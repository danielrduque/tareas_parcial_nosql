// src/redis/redis.module.ts

import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global() // @Global hace el servicio disponible en toda la aplicación
@Module({
  providers: [RedisService],
  exports: [RedisService], // Exporta el servicio para que otros módulos puedan usarlo
})
export class RedisModule {}
