import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SalasService } from './salas.service';

@ApiTags('Salas')
@Controller('salas')
export class SalasController {
  constructor(private readonly salasService: SalasService) {}

  @ApiOperation({
    summary: 'Buscar mapeamento de salas',
    description: 'Retorna o objeto de mapeamento estático que define para qual sala cada categoria de procedimento deve ser roteada.'
  })
  @Get('mapeamento')
  getMapeamento() {
    return this.salasService.getMapeamentoCategorias();
  }
}
