// src/usuarios/usuarios.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Usuario, UsuarioSchema } from './esquemas/usuario.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Usuario.name, schema: UsuarioSchema }]),
  ],
  exports: [MongooseModule], // Esta línea es clave para que otros módulos usen el modelo
})
export class UsuariosModule {} // <-- Asegúrate de que esta línea esté presente y correcta
