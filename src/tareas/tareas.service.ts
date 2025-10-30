// src/tareas/tareas.service.ts

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tarea } from './esquemas/tarea.schema';
import { CrearTareaDto } from './dto/crear-tarea.dto';
import { ActualizarTareaDto } from './dto/actualizar-tarea.dto';
import { Usuario } from '../usuarios/esquemas/usuario.schema';

@Injectable()
export class TareasService {
  constructor(@InjectModel(Tarea.name) private tareaModelo: Model<Tarea>) {}

  async crear(crearTareaDto: CrearTareaDto, usuario: Usuario): Promise<Tarea> {
    const nuevaTarea = new this.tareaModelo({
      ...crearTareaDto,
      propietario: usuario._id,
    });
    return nuevaTarea.save();
  }

  async obtenerTodas(usuario: Usuario): Promise<Tarea[]> {
    return this.tareaModelo.find({ propietario: usuario._id }).exec();
  }

  async obtenerPorId(id: string, usuario: Usuario): Promise<Tarea> {
    const tarea = await this.tareaModelo.findById(id).exec();
    if (!tarea) {
      throw new NotFoundException(
        `La tarea con el ID "${id}" no fue encontrada.`,
      );
    }
    if (tarea.propietario.toString() !== usuario._id.toString()) {
      throw new ForbiddenException(
        'No tienes permiso para acceder a esta tarea.',
      );
    }
    return tarea;
  }

  async obtenerReportePorEstado(usuario: Usuario): Promise<any> {
    const reporte = await this.tareaModelo.aggregate([
      {
        $match: { propietario: usuario._id }, // 1. Filtrar tareas solo del usuario actual
      },
      {
        $group: {
          _id: '$estado', // 2. Agrupar por el campo 'estado'
          cantidad: { $sum: 1 }, // 3. Contar cuántos documentos hay en cada grupo
        },
      },
      {
        $project: {
          _id: 0, // 4. Opcional: Ocultar el campo _id
          estado: '$_id', // Renombrar _id a 'estado' para más claridad
          cantidad: 1, // Mantener el campo cantidad
        },
      },
    ]);

    return reporte;
  }

  async actualizar(
    id: string,
    actualizarTareaDto: ActualizarTareaDto,
    usuario: Usuario,
  ): Promise<Tarea> {
    const tarea = await this.obtenerPorId(id, usuario); // Reutilizamos para verificar propiedad
    Object.assign(tarea, actualizarTareaDto);
    return tarea.save();
  }

  async eliminar(id: string, usuario: Usuario): Promise<{ message: string }> {
    const tarea = await this.obtenerPorId(id, usuario); // Reutilizamos para verificar propiedad
    await this.tareaModelo.deleteOne({ _id: id }).exec();
    return { message: 'Tarea eliminada exitosamente.' };
  }
}
