import { Controller, Get } from '@nestjs/common';
import { SalasService } from './salas.service';

@Controller('salas')
export class SalasController {
  constructor(private readonly salasService: SalasService) {}

  @Get('mapeamento')
  getMapeamento() {
    return this.salasService.getMapeamentoCategorias();
  }
}
