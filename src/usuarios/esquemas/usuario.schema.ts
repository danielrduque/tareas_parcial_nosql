// src/usuarios/esquemas/usuario.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// 1. 👉 Asegúrate de que la definición del ENUM esté aquí, ANTES de la clase.
export enum UserRole {
  ADMIN = 'Administrador',
  USER = 'Usuario Corriente',
}

@Schema({ timestamps: true })
export class Usuario extends Document {
  // 2. 👉 Aquí está la corrección que hicimos para el _id.
  declare _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  nombre: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  // 3. 👉 Y aquí es donde se usa el enum, que ya fue definido arriba.
  @Prop({
    required: true,
    enum: Object.values(UserRole),
    default: UserRole.USER,
  })
  rol: UserRole;
}

export const UsuarioSchema = SchemaFactory.createForClass(Usuario);
