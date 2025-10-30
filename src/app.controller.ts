// src/app.controller.ts

import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Eliminamos el antiguo método getHello() y lo reemplazamos por este:
  @Get('test-redis') // 👈 Define la ruta a la que harás la petición
  async testRedis(): Promise<string> {
    // Llama al nuevo método de prueba en tu servicio
    return this.appService.testRedis();
  }
}
