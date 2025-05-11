import { Controller, Get, Param } from '@nestjs/common';
import { PriceService } from './price.service';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@ApiTags('Price')
@Controller('price')
export class PriceController {
  constructor(private readonly priceService: PriceService) {}

  @Get(':symbol')
  @ApiOperation({ summary: 'Get token price in USD' })
  @ApiParam({ name: 'symbol', description: 'Token symbol (e.g., NAM)' })
  @ApiResponse({
    status: 200,
    description: 'Returns token price in USD',
    schema: {
      type: 'object',
      properties: {
        symbol: { type: 'string' },
        price: { type: 'number' },
        source: { type: 'string', enum: ['coinmarketcap', 'coingecko'] },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Token price not found' })
  async getTokenPrice(@Param('symbol') symbol: string) {
    const price = await this.priceService.getTokenPrice(symbol);
    return {
      symbol: symbol.toUpperCase(),
      price,
      source: price ? 'coinmarketcap' : 'coingecko',
    };
  }
}
