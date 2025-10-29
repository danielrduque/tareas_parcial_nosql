// src/auth/jwt.strategy.ts

import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Request } from 'express';

import { Usuario } from '../usuarios/esquemas/usuario.schema';

interface JwtPayload {
  id: string;
  email: string;
  rol: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel(Usuario.name)
    private readonly usuarioModelo: Model<Usuario>,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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

    // Verificación de seguridad para TypeScript y robustez
    if (!authHeader) {
      throw new UnauthorizedException('Falta el encabezado de autorización.');
    }

    const token = authHeader.split(' ')[1];

    // Verificamos si el token está en la blacklist de Redis
    const isBlacklisted = await this.cacheManager.get(`blacklist:${token}`);
    if (isBlacklisted) {
      // 👇 ¡ESTA ES LA LÍNEA QUE TE ENVÍA EL MENSAJE!
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
