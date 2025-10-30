// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from './redis/redis.module'; // 👈 Importa el nuevo módulo
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';

@Module({
  imports: [
    // 🌍 Variables de entorno globales
    ConfigModule.forRoot({ isGlobal: true }),

    // 🍃 Conexión a MongoDB
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
    }),

    // 🔹 Módulos de la aplicación
    RedisModule, // 👈 Nuestro módulo de Redis que funcionará globalmente
    AuthModule,
    UsuariosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
