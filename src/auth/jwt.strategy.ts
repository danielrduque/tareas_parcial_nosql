// src/auth/strategies/jwt.strategy.ts

import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Request } from 'express';

import { RedisService } from '../redis/redis.service'; // 👈 Importa tu servicio
import { Usuario } from '../usuarios/esquemas/usuario.schema';

interface JwtPayload {
  id: string;
  email: string;
  rol: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    @InjectModel(Usuario.name)
    private readonly usuarioModelo: Model<Usuario>,
    private readonly configService: ConfigService,
    private redisService: RedisService, // 👈 Inyecta RedisService aquí
  ) {
    const secret = configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error(
        'El secreto del JWT no está definido en las variables de entorno.',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload): Promise<Usuario> {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Falta el encabezado de autorización.');
    }

    const token = authHeader.split(' ')[1];

    // --- 👇 Usa tu nuevo servicio para verificar la blacklist 👇 ---
    const isBlacklisted = await this.redisService.get(`blacklist:${token}`);
    if (isBlacklisted) {
      this.logger.warn(
        `🛑 Token en blacklist detectado (ioredis). Acceso denegado.`,
      );
      throw new UnauthorizedException('El token ha sido invalidado (logout).');
    }

    const { id } = payload;
    const usuario = await this.usuarioModelo.findById(id);

    if (!usuario) {
      throw new UnauthorizedException('Token no válido o usuario no existe.');
    }

    return usuario;
  }
}
