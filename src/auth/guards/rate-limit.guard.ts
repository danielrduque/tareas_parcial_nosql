// src/auth/guards/rate-limit.guard.ts

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  // Límites que definen la política de Rate Limiting:
  private readonly LIMIT = 5; // Máximo 5 intentos de login por IP
  private readonly TTL_SECONDS = 60; // En un periodo de 60 segundos (1 minuto)

  constructor(private readonly redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Usamos la IP del cliente y la ruta como clave única
    const ip = request.ip || request.headers['x-forwarded-for'] || 'unknown-ip';
    const key = `rate-limit:${request.route.path}:${ip}`;

    // 1. Incrementa el contador de forma atómica
    const hits = await this.redisService.incr(key);

    if (hits === 1) {
      // 2. Si es el primer hit, establece el TTL para que expire en 60 segundos.
      await this.redisService.expire(key, this.TTL_SECONDS);
      this.logger.log(
        `[Rate Limit] Nuevo contador para IP: ${ip} en ruta: ${request.route.path}`,
      );
    }

    if (hits > this.LIMIT) {
      // 3. Si el contador excede el límite (6ta petición), bloquea la petición (429).
      this.logger.warn(
        `[Rate Limit] Límite excedido (${hits}/${this.LIMIT}) para IP: ${ip}`,
      );
      throw new HttpException(
        `Demasiadas peticiones de inicio de sesión. Inténtalo de nuevo en ${this.TTL_SECONDS} segundos.`,
        HttpStatus.TOO_MANY_REQUESTS, // Código 429
      );
    }

    this.logger.debug(`[Rate Limit] IP: ${ip} | Hits: ${hits}/${this.LIMIT}`);
    return true; // Permite la ejecución del controlador (petición válida)
  }
}
