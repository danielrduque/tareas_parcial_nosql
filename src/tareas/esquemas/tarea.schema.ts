// src/tareas/esquemas/tarea.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

// Definiendo los estados posibles para una tarea
export enum TaskStatus {
  PENDIENTE = 'Pendiente',
  EN_CURSO = 'En Curso',
  COMPLETADA = 'Completada',
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

  // Relación con el usuario propietario de la tarea
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Usuario', required: true })
  propietario: MongooseSchema.Types.ObjectId;
}

export const TareaSchema = SchemaFactory.createForClass(Tarea);
