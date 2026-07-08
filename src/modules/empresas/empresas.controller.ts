// Importa os decorators do NestJS necessários para definir rotas e extrair parâmetros
import { Controller, Get, Query } from '@nestjs/common';
// Importa os decorators do Swagger para documentação
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
// Importa o service de empresas com a lógica de negócio
import { EmpresasService } from './empresas.service';

// Agrupa este controller na categoria "Empresas" na documentação do Swagger
@ApiTags('Empresas')
// Define o prefixo base da rota como /empresas
@Controller('empresas')
export class EmpresasController {
  // Injeta o EmpresasService via construtor
  constructor(private readonly empresasService: EmpresasService) {}

  // Documenta a rota no Swagger
  @ApiOperation({
    summary: 'Pesquisar empresas',
    description: 'Busca empresas clientes pela razão social. Use o query param ?search= para filtrar. Retorna até 15 resultados ordenados alfabeticamente.'
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Termo para pesquisar empresas pela razão social',
    type: String,
  })
  // Define um endpoint GET na rota base /empresas
  @Get()
  // Método assíncrono que recebe o parâmetro de busca opcional da query string
  async buscar(@Query('search') search: string) {
    // Repassa o termo de busca para o service e retorna o resultado
    return this.empresasService.buscar(search);
  }
}
