// src/auth/auth.controller.ts

// 👇 Añade Get, UseGuards, y Req a esta línea
import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
// 👇 Añade esta nueva línea para importar AuthGuard
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegistroAuthDto } from './dto/registro-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { RateLimitGuard } from './guards/rate-limit.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registro')
  registrar(@Body(ValidationPipe) registroAuthDto: RegistroAuthDto) {
    return this.authService.registrar(registroAuthDto);
  }

  @Post('login')
  @UseGuards(RateLimitGuard)
  login(@Body(ValidationPipe) loginAuthDto: LoginAuthDto) {
    return this.authService.login(loginAuthDto);
  }

  @Post('logout')
  @UseGuards(AuthGuard())
  logout(@Req() req) {
    // Extraemos el token del header 'Authorization'
    const token = req.headers.authorization.split(' ')[1];
    return this.authService.logout(token);
  }

  @Get('perfil')
  @UseGuards(AuthGuard())
  obtenerPerfil(@Req() req) {
    return {
      mensaje: 'Esta es una ruta protegida.',
      usuario: req.user,
    };
  }
}
