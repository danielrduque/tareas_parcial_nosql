// src/tareas/dto/actualizar-tarea.dto.ts

import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString, // 👈 Importamos el validador de fecha
} from 'class-validator';
// 👇 Importamos ambos enums
import { TaskStatus, TaskPriority } from '../esquemas/tarea.schema';

export class ActualizarTareaDto {
  @IsString()
  @IsOptional()
  titulo?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsEnum(TaskStatus, { message: 'El estado no es válido.' })
  @IsOptional()
  estado?: TaskStatus;

  // 👇 Añadimos los nuevos campos también aquí
  @IsEnum(TaskPriority, { message: 'La prioridad no es válida.' })
  @IsOptional()
  prioridad?: TaskPriority;

  @IsDateString(
    {},
    { message: 'La fecha de vencimiento debe ser una fecha válida.' },
  )
  @IsOptional()
  fechaVencimiento?: Date;
}
