// src/redis/redis.service.ts

import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisService implements OnModuleInit {
  private readonly logger = new Logger(RedisService.name);

  // Inyectamos el gestor de caché
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async onModuleInit() {
    // Intentamos establecer un valor para verificar la conexión
    try {
      await this.cacheManager.set('redis_check', Date.now(), 5000); // 5 segundos TTL
      this.logger.log('✅ Conexión a Redis exitosa.'); // Requisito 9
    } catch (error) {
      this.logger.error(
        '❌ Fallo la conexión a Redis. Asegúrate de que esté corriendo.',
        error.message,
      );
      // Opcional: podrías lanzar un error fatal aquí si la conexión a Redis es obligatoria
      // throw new Error('No se pudo conectar a Redis.');
    }
  }

  // Aquí podrías agregar métodos de utilidad para Redis (get, set, del)
  async get(key: string): Promise<any> {
    return this.cacheManager.get(key);
  }

  // ... otros métodos
}
