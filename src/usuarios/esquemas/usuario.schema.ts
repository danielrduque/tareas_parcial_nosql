// src/usuarios/esquemas/usuario.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Definiendo los roles de usuario
export enum UserRole {
  ADMIN = 'Administrador',
  USER = 'Usuario Corriente',
}

@Schema({ timestamps: true })
export class Usuario extends Document {
  @Prop({ required: true, trim: true })
  nombre: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string; // Almacenaremos el hash, no la contraseña en texto plano

  @Prop({
    required: true,
    enum: Object.values(UserRole),
    default: UserRole.USER,
  })
  rol: UserRole;
}

export const UsuarioSchema = SchemaFactory.createForClass(Usuario);
