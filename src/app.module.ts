// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    // 1. Configuración de Entorno (Aún es necesaria para otros módulos)
    ConfigModule.forRoot({ isGlobal: true }),

    // 2. Conexión a MongoDB - HARDCODED (Reemplaza la URI con la tuya)
    // RECUERDA: La conexión de abajo DEBE ser revertida a usar ConfigService
    // para cumplir con el Requisito 1.1 (Uso de variables de entorno).
    MongooseModule.forRoot('mongodb://localhost:27017/tareas', {
      // Opciones de conexión si las necesitas
    }),

    // 3. Conexión a Redis - HARDCODED (Reemplaza host y port con los tuyos)
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      // RECUERDA: La conexión de abajo DEBE ser revertida a usar ConfigService
      // para cumplir con el Requisito 1.1 (Uso de variables de entorno).
      host: 'localhost', // Reemplaza por tu host de Redis
      port: 6379, // Reemplaza por tu puerto de Redis
    }),

    // 4. Módulos Auxiliares y de Entidades
    RedisModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
