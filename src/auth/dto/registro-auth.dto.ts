// src/auth/dto/registro-auth.dto.ts

import { IsString, IsEmail, MinLength, IsNotEmpty } from 'class-validator';

export class RegistroAuthDto {
  @IsNotEmpty({ message: 'El nombre no puede estar vacío.' })
  @IsString()
  nombre: string;

  @IsNotEmpty({ message: 'El email no puede estar vacío.' })
  @IsEmail({}, { message: 'El email no es válido.' })
  email: string;

  @IsNotEmpty({ message: 'La contraseña no puede estar vacía.' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  password: string;
}
