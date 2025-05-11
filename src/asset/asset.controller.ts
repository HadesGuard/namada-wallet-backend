import { Controller, Get, Param } from '@nestjs/common';
import { AssetService } from './asset.service';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { Asset } from './asset.service';

@ApiTags('Assets')
@Controller('assets')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Get()
  @ApiOperation({ summary: 'Get all assets' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of all assets',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          symbol: { type: 'string' },
          name: { type: 'string' },
          address: { type: 'string' },
          coingecko_id: { type: 'string' },
        },
      },
    },
  })
  getAllAssets(): Asset[] {
    return this.assetService.getAllAssets();
  }

  @Get('symbols')
  @ApiOperation({ summary: 'Get all asset symbols' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of all asset symbols',
    schema: {
      type: 'array',
      items: { type: 'string' },
    },
  })
  getAssetSymbols(): string[] {
    return this.assetService.getAssetSymbols();
  }

  @Get('symbol/:symbol')
  @ApiOperation({ summary: 'Get asset by symbol' })
  @ApiParam({ name: 'symbol', description: 'Asset symbol (e.g., NAM)' })
  @ApiResponse({
    status: 200,
    description: 'Returns asset information',
    schema: {
      type: 'object',
      properties: {
        description: { type: 'string' },
        symbol: { type: 'string' },
        name: { type: 'string' },
        address: { type: 'string' },
        coingecko_id: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  getAssetBySymbol(@Param('symbol') symbol: string): Asset {
    return this.assetService.getAssetBySymbol(symbol);
  }

  @Get('address/:address')
  @ApiOperation({ summary: 'Get asset by address' })
  @ApiParam({ name: 'address', description: 'Asset address' })
  @ApiResponse({
    status: 200,
    description: 'Returns asset information',
    schema: {
      type: 'object',
      properties: {
        description: { type: 'string' },
        symbol: { type: 'string' },
        name: { type: 'string' },
        address: { type: 'string' },
        coingecko_id: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  getAssetByAddress(@Param('address') address: string): Asset {
    return this.assetService.getAssetByAddress(address);
  }
}
