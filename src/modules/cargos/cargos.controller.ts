// Importa os decorators do NestJS necessários para definir rotas e extrair parâmetros
import { Controller, Get, Query } from '@nestjs/common';
// Importa os decorators do Swagger para documentação
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
// Importa o service de cargos com a lógica de negócio
import { CargosService } from './cargos.service';

// Agrupa este controller na categoria "Cargos" na documentação do Swagger
@ApiTags('Cargos')
// Define o prefixo base da rota como /cargos
@Controller('cargos')
export class CargosController {
  // Injeta o CargosService via construtor
  constructor(private readonly cargosService: CargosService) {}

  // Documenta a rota no Swagger com um resumo e descrição detalhada
  @ApiOperation({
    summary: 'Pesquisar cargos',
    description: 'Busca cargos/funções pelo nome. Use o query param ?search= para filtrar. Retorna até 15 resultados.'
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Termo para pesquisar cargos pelo nome',
    type: String,
  })
  // Define um endpoint GET na rota base /cargos
  @Get()
  // Método assíncrono que recebe o parâmetro de busca opcional da query string e paginação
  async buscar(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const pageNumber = page ? Number(page) : 1;
    const limitNumber = limit ? Number(limit) : 10;
    // Repassa o termo de busca para o service e retorna o resultado
    return this.cargosService.buscar(search, pageNumber, limitNumber);
  }
}
