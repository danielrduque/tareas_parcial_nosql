// src/redis/redis.service.ts

import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private readonly logger = new Logger(RedisService.name);

  onModuleInit() {
    this.client = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });

    this.client.on('connect', () => {
      this.logger.log('✅ Conectado a Redis exitosamente usando ioredis.');
    });

    this.client.on('error', (error) => {
      this.logger.error('❌ Error de conexión con Redis:', error);
    });
  }

  onModuleDestroy() {
    this.client.quit();
    this.logger.log('Desconectado de Redis.');
  }

  /**
   * Guarda un valor en Redis con un tiempo de vida (TTL).
   * @param key La clave.
   * @param value El valor.
   * @param ttlSeconds El tiempo de vida en segundos.
   */
  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.client.set(key, value, 'EX', ttlSeconds);
  }

  /**
   * Obtiene un valor de Redis.
   * @param key La clave a buscar.
   * @returns El valor si existe, o null si no.
   */
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  /**
   * Elimina una clave de Redis.
   * @param key La clave a eliminar.
   */
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * Incrementa el contador en la clave de forma atómica y devuelve el nuevo valor.
   * (Esencial para Rate Limiting)
   * @param key La clave del contador.
   * @returns El valor después del incremento.
   */
  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  /**
   * Establece un tiempo de expiración (TTL) para una clave.
   * @param key La clave.
   * @param ttlSeconds El tiempo de vida en segundos.
   * @returns 1 si el TTL fue establecido, 0 si la clave no existe o no se pudo establecer.
   */
  async expire(key: string, ttlSeconds: number): Promise<number> {
    return this.client.expire(key, ttlSeconds);
  }
}
