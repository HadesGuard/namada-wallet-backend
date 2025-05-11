import { Injectable } from '@nestjs/common';
import { Configuration, DefaultApi, Balance } from '@namada/indexer-client';
import { RedisService } from '../redis/redis.service';

interface BalanceWithPrice extends Balance {
  price?: number;
}

@Injectable()
export class AccountService {
  private readonly indexerAPI: DefaultApi;

  constructor(private readonly redisService: RedisService) {
    const config = new Configuration({
      basePath: 'https://indexer.namada.tududes.com',
      baseOptions: { headers: {} },
    });
    this.indexerAPI = new DefaultApi(config);
  }

  async getAccount(address: string) {
    const account = await this.indexerAPI.apiV1AccountAddressGet(address);
    const data = account.data as Balance[];

    if (!data || !Array.isArray(data)) {
      return [];
    }

    const pricePromises = data.map(async (balance) => {
      try {
        const price = await this.redisService.get(
          `price:${balance.tokenAddress}`,
        );
        return {
          ...balance,
          price: price || 0,
        };
      } catch (error) {
        return {
          ...balance,
          price: 0,
        };
      }
    });

    const results = await Promise.allSettled(pricePromises);
    return results.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      return {
        ...data[results.indexOf(result)],
        price: 0,
      };
    });
  }
}
