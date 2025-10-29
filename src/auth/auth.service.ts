// src/auth/auth.service.ts

import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Inject, // <-- Añadir Inject
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager'; // <-- Añadir CACHE_MANAGER
import { Cache } from 'cache-manager'; // <-- Añadir Cache
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { Usuario } from '../usuarios/esquemas/usuario.schema';
import { RegistroAuthDto } from './dto/registro-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Usuario.name) private usuarioModelo: Model<Usuario>,
    private jwtService: JwtService,
    // 👇 Inyectamos el gestor de caché para poder usar Redis
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Registra un nuevo usuario en la base de datos.
   * @param registroAuthDto - Datos para el registro.
   */
  async registrar(
    registroAuthDto: RegistroAuthDto,
  ): Promise<{ accessToken: string }> {
    const { nombre, email, password } = registroAuthDto;

    // 1. Verificar si el email ya existe
    const usuarioExistente = await this.usuarioModelo.findOne({ email });
    if (usuarioExistente) {
      throw new ConflictException('El correo electrónico ya está registrado.');
    }

    // 2. Encriptar la contraseña
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Crear y guardar el nuevo usuario
    const nuevoUsuario = new this.usuarioModelo({
      nombre,
      email,
      passwordHash,
    });

    await nuevoUsuario.save();

    // 4. Generar y retornar el JWT
    const payload = {
      id: nuevoUsuario._id,
      email: nuevoUsuario.email,
      rol: nuevoUsuario.rol,
    };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }

  /**
   * Valida las credenciales y genera un token de acceso.
   * @param loginAuthDto - Credenciales de inicio de sesión.
   */
  async login(loginAuthDto: LoginAuthDto): Promise<{ accessToken: string }> {
    const { email, password } = loginAuthDto;

    // 1. Buscar al usuario por email
    const usuario = await this.usuarioModelo.findOne({ email });
    if (!usuario) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    // 2. Comparar la contraseña proporcionada con el hash almacenado
    const passwordValida = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordValida) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    // 3. Generar y retornar el JWT
    const payload = { id: usuario._id, email: usuario.email, rol: usuario.rol };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }

  /**
   * Añade un token a la blacklist de Redis para invalidarlo.
   * @param token - El JWT a invalidar.
   */
  async logout(token: string): Promise<{ message: string }> {
    // Decodificamos el token para saber su fecha de expiración
    const payload: any = this.jwtService.decode(token);
    if (payload && payload.exp) {
      // Calculamos cuánto tiempo le queda de vida al token en milisegundos
      const tiempoRestanteMs = payload.exp * 1000 - Date.now();

      // Si todavía es válido, lo agregamos a la blacklist en Redis
      if (tiempoRestanteMs > 0) {
        await this.cacheManager.set(
          `blacklist:${token}`,
          true,
          tiempoRestanteMs,
        );
      }
    }
    return { message: 'Sesión cerrada exitosamente.' };
  }
}
