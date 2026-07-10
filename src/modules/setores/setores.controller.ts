// Importa os decorators do NestJS necessários para definir rotas e extrair parâmetros
import { Controller, Get, Query } from '@nestjs/common';
// Importa os decorators do Swagger para documentação
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
// Importa o service de setores com a lógica de negócio
import { SetoresService } from './setores.service';

// Agrupa este controller na categoria "Setores" na documentação do Swagger
@ApiTags('Setores')
// Define o prefixo base da rota como /setores
@Controller('setores')
export class SetoresController {
  // Injeta o SetoresService via construtor
  constructor(private readonly setoresService: SetoresService) {}

  // Documenta a rota no Swagger
  @ApiOperation({
    summary: 'Pesquisar setores',
    description: 'Busca setores pelo nome. Use o query param ?search= para filtrar. Retorna até 15 resultados.'
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Termo para pesquisar setores pelo nome',
    type: String,
  })
  // Define um endpoint GET na rota base /setores
  @Get()
  // Método assíncrono que recebe o parâmetro de busca opcional da query string e parâmetros de paginação
  async buscar(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const pageNumber = page ? Number(page) : 1;
    const limitNumber = limit ? Number(limit) : 10;
    // Repassa o termo de busca e paginação para o service e retorna o resultado
    return this.setoresService.buscar(search, pageNumber, limitNumber);
  }
}
