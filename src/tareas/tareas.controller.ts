// src/tareas/tareas.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
  Req,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TareasService } from './tareas.service';
import { CrearTareaDto } from './dto/crear-tarea.dto';
import { ActualizarTareaDto } from './dto/actualizar-tarea.dto';

@Controller('tareas')
@UseGuards(AuthGuard()) // Protegemos todas las rutas de este controlador
export class TareasController {
  constructor(private readonly tareasService: TareasService) {}

  @Post()
  crear(@Body(ValidationPipe) crearTareaDto: CrearTareaDto, @Req() req) {
    return this.tareasService.crear(crearTareaDto, req.user);
  }

  @Get('reporte/por-estado')
  obtenerReporte(@Req() req) {
    return this.tareasService.obtenerReportePorEstado(req.user);
  }

  @Get(':id')
  obtenerUna(@Param('id') id: string, @Req() req) {
    return this.tareasService.obtenerPorId(id, req.user);
  }

  @Patch(':id')
  actualizar(
    @Param('id') id: string,
    @Body(ValidationPipe) actualizarTareaDto: ActualizarTareaDto,
    @Req() req,
  ) {
    return this.tareasService.actualizar(id, actualizarTareaDto, req.user);
  }

  @Delete(':id')
  eliminar(@Param('id') id: string, @Req() req) {
    return this.tareasService.eliminar(id, req.user);
  }
}
