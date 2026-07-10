// Importa os decorators do NestJS necessários para definir rotas e extrair parâmetros
import { Controller, Get, Query } from '@nestjs/common';
// Importa os decorators do Swagger para documentação
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
// Importa o service de unidades com a lógica de negócio
import { UnidadesService } from './unidades.service';

// Agrupa este controller na categoria "Unidades" na documentação do Swagger
@ApiTags('Unidades')
// Define o prefixo base da rota como /unidades
@Controller('unidades')
export class UnidadesController {
  // Injeta o UnidadesService via construtor
  constructor(private readonly unidadesService: UnidadesService) {}

  // Documenta a rota no Swagger
  @ApiOperation({
    summary: 'Pesquisar unidades',
    description: 'Busca unidades pela razão social. Use ?search= para filtrar por nome e ?empresa_id= para filtrar somente as unidades de uma empresa específica. Retorna até 15 resultados.'
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Termo para pesquisar unidades pela razão social',
    type: String,
  })
  @ApiQuery({
    name: 'empresa_id',
    required: false,
    description: 'ID da empresa para filtrar apenas as unidades pertencentes a ela',
    type: String,
  })
  // Define um endpoint GET na rota base /unidades
  @Get()
  // Método assíncrono que recebe os query params opcionais da query string e paginação
  async buscar(
    // Extrai o termo de busca da query string (ex: ?search=matriz)
    @Query('search') search?: string,
    // Extrai o filtro opcional por empresa (ex: ?empresa_id=2)
    @Query('empresa_id') empresa_id?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    // Converte empresa_id para número se foi fornecido, ou deixa undefined
    const empresaIdNumero = empresa_id ? Number(empresa_id) : undefined;
    const pageNumber = page ? Number(page) : 1;
    const limitNumber = limit ? Number(limit) : 10;
    // Repassa os parâmetros para o service e retorna o resultado
    return this.unidadesService.buscar(search, empresaIdNumero, pageNumber, limitNumber);
  }
}
