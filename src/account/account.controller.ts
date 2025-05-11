import { Controller, Get, Param } from '@nestjs/common';
import { AccountService } from './account.service';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { Balance } from '@namada/indexer-client';

interface BalanceWithPrice extends Balance {
  price?: number;
}

@ApiTags('Account')
@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get(':address')
  @ApiOperation({ summary: 'Get account information by address' })
  @ApiParam({ name: 'address', description: 'Account address' })
  @ApiResponse({
    status: 200,
    description: 'Returns account information',
    schema: {
      type: 'object',
      properties: {
        address: { type: 'string' },
        balance: { type: 'object' },
        // Add other properties based on actual response
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async getAccount(
    @Param('address') address: string,
  ): Promise<BalanceWithPrice[]> {
    return this.accountService.getAccount(address);
  }
}
