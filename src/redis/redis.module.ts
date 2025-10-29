// src/redis/redis.module.ts
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisService } from './redis.service';

@Module({
  imports: [CacheModule.register()], // 👈 importa el CacheModule
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
