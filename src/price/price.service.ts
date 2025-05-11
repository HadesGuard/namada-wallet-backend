import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { RedisService } from '../redis/redis.service';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { AssetService } from '../asset/asset.service';

@Injectable()
export class PriceService {
  private readonly logger = new Logger(PriceService.name);
  private readonly CMC_API_KEY: string;
  private readonly CMC_BASE_URL: string;
  private readonly COINGECKO_API_KEY: string;
  private readonly COINGECKO_BASE_URL: string;
  private readonly CACHE_TTL: number;

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly assetService: AssetService,
  ) {
    this.CMC_API_KEY = this.configService.get('api.coinmarketcap.apiKey');
    this.CMC_BASE_URL = this.configService.get('api.coinmarketcap.baseUrl');
    this.COINGECKO_API_KEY = this.configService.get('api.coingecko.apiKey');
    this.COINGECKO_BASE_URL = this.configService.get('api.coingecko.baseUrl');
    this.CACHE_TTL = this.configService.get('price.cacheTTL');
  }

  private async retryWithDelay(
    fn: () => Promise<any>,
    maxRetries = 3,
    initialDelay = 2000,
  ): Promise<any> {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (error.response?.status === 429) {
          const retryAfter =
            parseInt(error.response.headers['retry-after']) ||
            initialDelay * Math.pow(2, i);
          this.logger.warn(
            `Rate limit hit, waiting ${retryAfter}ms before retry...`,
          );
          await new Promise((resolve) => setTimeout(resolve, retryAfter));
          continue;
        }
        throw error;
      }
    }
    throw lastError;
  }

  async getTokenPrice(address: string): Promise<number> {
    try {
      // Try to get from cache first
      const cachedPrice = await this.redisService.get(`price:${address}`);
      if (cachedPrice) {
        this.logger.debug(`Cache hit for ${address}: ${cachedPrice}`);
        return cachedPrice;
      }

      this.logger.debug(`Cache miss for ${address}, fetching from API...`);

      const asset = this.assetService.getAssetByAddress(address);
      if (!asset) {
        this.logger.warn(`No asset found for address ${address}`);
        await this.redisService.set(`price:${address}`, 0, this.CACHE_TTL);
        return 0;
      }

      // Try CoinMarketCap first
      try {
        const cmcPrice = await this.getCMCPrice(asset.symbol);
        if (cmcPrice) {
          this.logger.debug(
            `Got price from CoinMarketCap for ${asset.symbol}: ${cmcPrice}`,
          );
          await this.redisService.set(
            `price:${address}`,
            cmcPrice,
            this.CACHE_TTL,
          );
          return cmcPrice;
        }
      } catch (error) {
        this.logger.warn(
          `CoinMarketCap price not found for ${asset.symbol}, trying CoinGecko: ${error.message}`,
        );
      }

      // Fallback to CoinGecko
      try {
        const coingeckoPrice = await this.getCoinGeckoPrice(asset.symbol);
        this.logger.debug(
          `Got price from CoinGecko for ${asset.symbol}: ${coingeckoPrice}`,
        );
        await this.redisService.set(
          `price:${address}`,
          coingeckoPrice,
          this.CACHE_TTL,
        );
        return coingeckoPrice;
      } catch (error) {
        this.logger.warn(
          `CoinGecko price not found for ${asset.symbol}: ${error.message}`,
        );
      }

      // If both APIs fail, return 0
      this.logger.warn(
        `Price not found for ${asset.symbol} from both APIs, returning 0`,
      );
      await this.redisService.set(`price:${address}`, 0, this.CACHE_TTL);
      return 0;
    } catch (error) {
      this.logger.error(
        `Error fetching price for ${address}: ${error.message}`,
      );
      return 0;
    }
  }

  async onModuleInit() {
    this.logger.log(
      'Price service initialized, starting initial price update...',
    );
    await this.updatePrices();
  }

  @Cron('*/5 * * * *')
  async updatePrices() {
    this.logger.log('Starting scheduled price update...');
    try {
      const assets = this.assetService.getAllAssets();
      const assetsWithCoingeckoId = assets.filter(
        (asset) => asset.coingecko_id,
      );

      this.logger.log(
        `Found ${assetsWithCoingeckoId.length} assets with CoinGecko IDs`,
      );

      // Process assets sequentially to avoid rate limits
      for (const asset of assetsWithCoingeckoId) {
        try {
          this.logger.debug(`Processing ${asset.symbol}...`);
          const price = await this.getTokenPrice(asset.address);
          this.logger.debug(`Updated price for ${asset.symbol}: ${price}`);

          // Add delay between each asset to respect rate limits
          await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 seconds delay
        } catch (error) {
          this.logger.error(
            `Failed to update price for ${asset.symbol}: ${error.message}`,
          );
        }
      }

      this.logger.log('Price update completed successfully');
    } catch (error) {
      this.logger.error(`Price update job failed: ${error.message}`);
    }
  }

  private async getCMCPrice(symbol: string): Promise<number | null> {
    if (!this.CMC_API_KEY) {
      this.logger.warn('CMC_API_KEY not set, skipping CoinMarketCap');
      return null;
    }

    return this.retryWithDelay(async () => {
      try {
        const response = await axios.get(
          `${this.CMC_BASE_URL}/cryptocurrency/quotes/latest`,
          {
            headers: {
              'X-CMC_PRO_API_KEY': this.CMC_API_KEY,
            },
            params: {
              symbol: symbol.toUpperCase(),
              convert: 'USD',
            },
          },
        );

        const data = response.data.data[symbol.toUpperCase()];
        if (!data) {
          return null;
        }

        // Check if the slug matches CoinGecko ID
        const asset = this.assetService.getAssetBySymbol(symbol);

        if (
          asset?.coingecko_id &&
          data.platform.slug.toLowerCase() !== asset.coingecko_id.toLowerCase()
        ) {
          this.logger.warn(
            `CMC slug (${data.slug}) doesn't match CoinGecko ID (${asset.coingecko_id}) for ${symbol}`,
          );
          return null;
        }

        return data.quote.USD.price;
      } catch (error) {
        if (error.response) {
          this.logger.error(
            `CoinMarketCap API error for ${symbol}: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
          );
        }
        throw error;
      }
    });
  }

  private async getCoinGeckoPrice(symbol: string): Promise<number> {
    const asset = await this.assetService.getAssetBySymbol(symbol);
    if (!asset?.coingecko_id) {
      throw new Error(`No CoinGecko ID found for ${symbol}`);
    }

    return this.retryWithDelay(async () => {
      try {
        const response = await axios.get(
          `${this.COINGECKO_BASE_URL}/simple/price`,
          {
            headers: {
              'x-cg-demo-api-key': this.COINGECKO_API_KEY,
            },
            params: {
              ids: asset.coingecko_id,
              vs_currencies: 'usd',
              include_24hr_change: 'false',
              include_last_updated_at: 'false',
            },
          },
        );

        if (!response.data || !response.data[asset.coingecko_id]) {
          this.logger.warn(
            `No price data found in response for ${symbol}: ${JSON.stringify(response.data)}`,
          );
          throw new Error(`Price not found for ${symbol}`);
        }

        const price = response.data[asset.coingecko_id].usd;
        if (!price) {
          throw new Error(`Invalid price data for ${symbol}`);
        }

        return price;
      } catch (error) {
        if (error.response) {
          this.logger.error(
            `CoinGecko API error for ${symbol}: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
          );
        }
        throw error;
      }
    });
  }
}
