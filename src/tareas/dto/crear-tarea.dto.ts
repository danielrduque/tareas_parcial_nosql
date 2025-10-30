// src/tareas/dto/crear-tarea.dto.ts

import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { TaskStatus } from '../esquemas/tarea.schema';

export class CrearTareaDto {
  @IsNotEmpty({ message: 'El título no puede estar vacío.' })
  @IsString()
  titulo: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsEnum(TaskStatus, { message: 'El estado no es válido.' })
  @IsOptional()
  estado?: TaskStatus;
}
