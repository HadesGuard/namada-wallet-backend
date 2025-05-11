import { Module } from '@nestjs/common';
import { PriceService } from './price.service';
import { PriceController } from './price.controller';
import { RedisModule } from '../redis/redis.module';
import { AssetModule } from '../asset/asset.module';

@Module({
  imports: [RedisModule, AssetModule],
  providers: [PriceService],
  controllers: [PriceController],
  exports: [PriceService],
})
export class PriceModule {}
