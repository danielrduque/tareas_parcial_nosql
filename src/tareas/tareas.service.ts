// src/tareas/tareas.service.ts

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tarea } from './esquemas/tarea.schema';
import { CrearTareaDto } from './dto/crear-tarea.dto';
import { ActualizarTareaDto } from './dto/actualizar-tarea.dto';
import { Usuario } from '../usuarios/esquemas/usuario.schema';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class TareasService {
  private readonly logger = new Logger(TareasService.name);

  constructor(
    @InjectModel(Tarea.name) private tareaModelo: Model<Tarea>,
    private readonly redisService: RedisService,
  ) {}

  async crear(crearTareaDto: CrearTareaDto, usuario: Usuario): Promise<Tarea> {
    const nuevaTarea = new this.tareaModelo({
      ...crearTareaDto,
      propietario: usuario._id,
    });
    const tareaGuardada = await nuevaTarea.save();

    // Invalidar el caché de la lista de tareas del usuario
    const cacheKey = `tareas:usuario:${usuario._id}`;
    await this.redisService.del(cacheKey);
    this.logger.log(`Cache invalidado para ${cacheKey}`);

    return tareaGuardada;
  }

  async obtenerTodasLasTareasAdmin(): Promise<Tarea[]> {
    this.logger.log('Admin: Obteniendo todas las tareas sin filtrar.');
    return this.tareaModelo.find().exec();
  }

  async obtenerTodas(usuario: Usuario): Promise<Tarea[]> {
    const cacheKey = `tareas:usuario:${usuario._id}`;
    const cachedTareas = await this.redisService.get(cacheKey);

    if (cachedTareas) {
      this.logger.log(`Cache hit para ${cacheKey}`);
      return JSON.parse(cachedTareas);
    }

    this.logger.log(`Cache miss para ${cacheKey}`);
    const tareas = await this.tareaModelo
      .find({ propietario: usuario._id })
      .exec();
    await this.redisService.set(cacheKey, JSON.stringify(tareas), 3600); // Cache por 1 hora
    return tareas;
  }

  async obtenerPorId(id: string, usuario: Usuario): Promise<Tarea> {
    const cacheKey = `tarea:${id}`;
    const cachedTarea = await this.redisService.get(cacheKey);

    if (cachedTarea) {
      this.logger.log(`Cache hit para ${cacheKey}`);
      const tarea = JSON.parse(cachedTarea);
      if (tarea.propietario.toString() !== usuario._id.toString()) {
        throw new ForbiddenException(
          'No tienes permiso para acceder a esta tarea.',
        );
      }
      return tarea;
    }

    this.logger.log(`Cache miss para ${cacheKey}`);
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

    await this.redisService.set(cacheKey, JSON.stringify(tarea), 3600); // Cache por 1 hora
    return tarea;
  }

  async obtenerReporteActividadPorUsuario(): Promise<any> {
    return this.tareaModelo.aggregate([
      // 1. Agrupar tareas por propietario y contar cuántas hay por estado
      {
        $group: {
          _id: '$propietario',
          tareasPorEstado: {
            $push: {
              k: '$estado',
              v: 1,
            },
          },
        },
      },
      // 2. Reestructurar el conteo por estado
      {
        $project: {
          tareasPorEstado: {
            $arrayToObject: {
              $map: {
                input: { $setUnion: ['$tareasPorEstado.k'] },
                as: 'estado',
                in: {
                  k: '$$estado',
                  v: {
                    $size: {
                      $filter: {
                        input: '$tareasPorEstado',
                        as: 'item',
                        cond: { $eq: ['$$item.k', '$$estado'] },
                      },
                    },
                  },
                },
              },
            },
          },
          totalTareas: {
            $sum: { $map: { input: '$tareasPorEstado', as: 't', in: '$$t.v' } },
          },
        },
      },
      // 3. Unir con la colección de usuarios para obtener el nombre y email
      {
        $lookup: {
          from: 'usuarios', // El nombre de la colección de usuarios en MongoDB
          localField: '_id',
          foreignField: '_id',
          as: 'infoUsuario',
        },
      },
      // 4. "Desenrollar" el array resultante y limpiar el resultado final
      {
        $unwind: '$infoUsuario',
      },
      {
        $project: {
          _id: 0,
          usuarioId: '$_id',
          nombre: '$infoUsuario.nombre',
          email: '$infoUsuario.email',
          conteoTareas: '$tareasPorEstado',
          totalTareas: { $size: '$tareasPorEstado' },
        },
      },
    ]);
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
    const tareaActualizada = await tarea.save();

    // Invalidar cachés
    const cacheKeyTarea = `tarea:${id}`;
    const cacheKeyLista = `tareas:usuario:${usuario._id}`;
    await this.redisService.del(cacheKeyTarea);
    await this.redisService.del(cacheKeyLista);
    this.logger.log(
      `Caches invalidados para ${cacheKeyTarea} y ${cacheKeyLista}`,
    );

    return tareaActualizada;
  }

  async eliminar(id: string, usuario: Usuario): Promise<{ message: string }> {
    const tarea = await this.obtenerPorId(id, usuario); // Reutilizamos para verificar propiedad
    await this.tareaModelo.deleteOne({ _id: id }).exec();

    // Invalidar cachés
    const cacheKeyTarea = `tarea:${id}`;
    const cacheKeyLista = `tareas:usuario:${usuario._id}`;
    await this.redisService.del(cacheKeyTarea);
    await this.redisService.del(cacheKeyLista);
    this.logger.log(
      `Caches invalidados para ${cacheKeyTarea} y ${cacheKeyLista}`,
    );

    return { message: 'Tarea eliminada exitosamente.' };
  }
}
