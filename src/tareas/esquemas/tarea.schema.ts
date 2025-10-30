// src/tareas/esquemas/tarea.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

// Definiendo los estados posibles para una tarea
export enum TaskStatus {
  PENDIENTE = 'Pendiente',
  EN_CURSO = 'En Curso',
  COMPLETADA = 'Completada',
}

// 👇 1. Añadimos un nuevo enum para las prioridades
export enum TaskPriority {
  BAJA = 'Baja',
  MEDIA = 'Media',
  ALTA = 'Alta',
}

@Schema({ timestamps: true }) // Agrega createdAt y updatedAt automáticamente
export class Tarea extends Document {
  @Prop({ required: true, trim: true })
  titulo: string;

  @Prop({ trim: true })
  descripcion: string;

  @Prop({
    required: true,
    enum: Object.values(TaskStatus),
    default: TaskStatus.PENDIENTE,
  })
  estado: TaskStatus;

  // 👇 2. Añadimos el campo 'prioridad'
  @Prop({
    enum: Object.values(TaskPriority),
    default: TaskPriority.MEDIA, // Por defecto, las tareas tendrán prioridad media
  })
  prioridad: TaskPriority;

  // 👇 3. Añadimos el campo 'fechaVencimiento'
  @Prop({ type: Date, default: null }) // Por defecto no hay fecha de vencimiento
  fechaVencimiento: Date;

  // Relación con el usuario propietario de la tarea
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Usuario', required: true })
  propietario: MongooseSchema.Types.ObjectId;
}

export const TareaSchema = SchemaFactory.createForClass(Tarea);
