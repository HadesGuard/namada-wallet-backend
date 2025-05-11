import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { RedisService } from './redis/redis.service';

@Injectable()
export class AppService implements OnModuleDestroy {
  constructor(private readonly redisService: RedisService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async onModuleDestroy() {
    try {
      // Close Redis connection
      await this.redisService.onModuleDestroy();
      console.log('Redis connection closed');
    } catch (error) {
      console.error('Error closing connections:', error);
    }
  }
}
