// src/tareas/tareas.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TareasController } from './tareas.controller';
import { TareasService } from './tareas.service';
import { Tarea, TareaSchema } from './esquemas/tarea.schema';
import { AuthModule } from '../auth/auth.module'; // Importamos AuthModule para usar Passport

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Tarea.name, schema: TareaSchema }]),
    AuthModule,
  ],
  controllers: [TareasController],
  providers: [TareasService],
})
export class TareasModule {}
