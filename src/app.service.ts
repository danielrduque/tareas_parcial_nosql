// src/app.service.ts
import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class AppService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AppService.name);
  private redisClient: Redis;

  // Este método se ejecuta cuando el módulo se inicia
  onModuleInit() {
    this.logger.log('--- Inicializando cliente ioredis directo ---');
    try {
      this.redisClient = new Redis({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
      });

      this.redisClient.on('connect', () => {
        this.logger.log('✅ Cliente ioredis conectado exitosamente a Redis.');
      });

      this.redisClient.on('error', (error) => {
        this.logger.error('❌ Error de conexión con ioredis:', error);
      });
    } catch (error) {
      this.logger.error('❌ Fallo al crear el cliente ioredis:', error);
    }
  }

  // Este método se ejecuta cuando la aplicación se apaga para cerrar la conexión
  onModuleDestroy() {
    if (this.redisClient) {
      this.redisClient.quit();
      this.logger.log('Cliente ioredis desconectado.');
    }
  }

  async testRedis(): Promise<string> {
    if (!this.redisClient) {
      return 'El cliente Redis (ioredis) no está inicializado.';
    }

    const clave = 'prueba-directa-ioredis';
    const valor = `funciona-${Math.floor(Math.random() * 1000)}`;

    this.logger.log('--- Prueba de escritura directa con ioredis ---');

    try {
      this.logger.log(
        `Intentando escribir: [CLAVE: ${clave}, VALOR: ${valor}]`,
      );

      // Comando SET directo con ioredis, con un TTL de 60 segundos
      await this.redisClient.set(clave, valor, 'EX', 300);

      this.logger.log(
        '✅ Comando SET enviado a Redis sin errores a través de ioredis.',
      );

      // Verificación directa
      const valorLeido = await this.redisClient.get(clave);
      this.logger.log(`✅ Valor leído de vuelta desde Redis: "${valorLeido}"`);

      if (valorLeido === valor) {
        return `¡FUNCIONÓ! ioredis escribió y leyó correctamente. Revisa tu redis-cli.`;
      } else {
        return `FALLO: ioredis no pudo verificar la escritura, aunque no dio error.`;
      }
    } catch (error) {
      this.logger.error('❌ Error durante la operación de ioredis:', error);
      return 'FALLO: Excepción durante la prueba de ioredis.';
    }
  }
}
