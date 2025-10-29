// src/auth/auth.service.ts

import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Inject,
  Logger,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { Usuario } from '../usuarios/esquemas/usuario.schema';
import { RegistroAuthDto } from './dto/registro-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(Usuario.name) private usuarioModelo: Model<Usuario>,
    private jwtService: JwtService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async registrar(
    registroAuthDto: RegistroAuthDto,
  ): Promise<{ accessToken: string }> {
    const { nombre, email, password } = registroAuthDto;

    const usuarioExistente = await this.usuarioModelo.findOne({ email });
    if (usuarioExistente) {
      throw new ConflictException('El correo electrónico ya está registrado.');
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    const nuevoUsuario = new this.usuarioModelo({
      nombre,
      email,
      passwordHash,
    });

    await nuevoUsuario.save();

    const payload = {
      id: nuevoUsuario._id,
      email: nuevoUsuario.email,
      rol: nuevoUsuario.rol,
    };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }

  async login(loginAuthDto: LoginAuthDto): Promise<{ accessToken: string }> {
    const { email, password } = loginAuthDto;

    const usuario = await this.usuarioModelo.findOne({ email });
    if (!usuario) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    const passwordValida = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordValida) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    const payload = { id: usuario._id, email: usuario.email, rol: usuario.rol };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }

  async logout(token: string): Promise<{ message: string }> {
    const payload: any = this.jwtService.decode(token);
    if (payload && payload.exp) {
      const tiempoRestanteMs = payload.exp * 1000 - Date.now();
      if (tiempoRestanteMs > 0) {
        this.logger.log(`Añadiendo token a la blacklist en Redis...`);
        this.logger.debug(`Clave: blacklist:${token}`);
        this.logger.debug(`TTL (ms): ${tiempoRestanteMs}`);

        try {
          await this.cacheManager.set(
            `blacklist:${token}`,
            true,
            tiempoRestanteMs,
          );
          const test = await this.cacheManager.get(`blacklist:${token}`);
          this.logger.debug(`Valor leído desde Redis: ${test}`);
          this.logger.log('✅ Token añadido a la blacklist exitosamente.');
        } catch (error) {
          this.logger.error('❌ Error al intentar guardar en Redis:', error);
        }
      }
    }
    return { message: 'Sesión cerrada exitosamente.' };
  }
}
