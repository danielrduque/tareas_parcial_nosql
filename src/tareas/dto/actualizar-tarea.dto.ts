// src/tareas/dto/actualizar-tarea.dto.ts

import { IsString, IsOptional, IsEnum } from 'class-validator';
import { TaskStatus } from '../esquemas/tarea.schema';

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
}
