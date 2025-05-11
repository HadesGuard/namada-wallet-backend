import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

export interface DenomUnit {
  denom: string;
  exponent: number;
  aliases?: string[];
}

export interface Asset {
  description: string;
  denom_units: DenomUnit[];
  base: string;
  name: string;
  display: string;
  symbol: string;
  address?: string;
  coingecko_id?: string;
  logo_URIs?: {
    png?: string;
    svg?: string;
  };
  images?: {
    png?: string;
    svg?: string;
  };
}

interface AssetList {
  chain_name: string;
  assets: Asset[];
}

@Injectable()
export class AssetService {
  private readonly logger = new Logger(AssetService.name);
  private assets: Asset[] = [];

  constructor(private configService: ConfigService) {
    this.loadAssets();
  }

  private loadAssets() {
    try {
      const filePath = path.join(
        process.cwd(),
        'data',
        'chain-registry',
        'namada',
        'assetlist.json',
      );
      this.logger.log(`Loading assets from: ${filePath}`);

      if (!fs.existsSync(filePath)) {
        throw new Error(`Asset list file not found at: ${filePath}`);
      }

      const fileContent = fs.readFileSync(filePath, 'utf8');
      const assetList: AssetList = JSON.parse(fileContent);

      if (!assetList.assets || !Array.isArray(assetList.assets)) {
        throw new Error('Invalid asset list format: assets array not found');
      }

      this.assets = assetList.assets;
      this.logger.log(`Successfully loaded ${this.assets.length} assets`);

      // Log some asset details for verification
      this.assets.forEach((asset) => {
        this.logger.debug(
          `Asset: ${asset.symbol} (${asset.name}) - Coingecko ID: ${asset.coingecko_id || 'N/A'}`,
        );
      });
    } catch (error) {
      this.logger.error('Failed to load assets:', error);
      this.assets = [];
    }
  }

  getAllAssets(): Asset[] {
    return this.assets;
  }

  getAssetBySymbol(symbol: string): Asset {
    return this.assets.find((asset) => asset.symbol === symbol);
  }

  getAssetByAddress(address: string): Asset {
    return this.assets.find((asset) => asset.address === address);
  }

  getAssetByCoingeckoId(coingeckoId: string): Asset {
    return this.assets.find((asset) => asset.coingecko_id === coingeckoId);
  }

  getAssetSymbols(): string[] {
    return this.assets.map((asset) => asset.symbol);
  }

  getAssetAddresses(): string[] {
    return this.assets
      .filter((asset) => asset.address)
      .map((asset) => asset.address);
  }

  getCoingeckoIds(): string[] {
    return this.assets
      .filter((asset) => asset.coingecko_id)
      .map((asset) => asset.coingecko_id);
  }
}
