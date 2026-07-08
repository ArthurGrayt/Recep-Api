// Importa os decorators do NestJS para configurar as rotas e injetar dependências
import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
// Importa o serviço de colaboradores onde está a lógica de busca
import { ColaboradoresService } from './colaboradores.service';

// Define o prefixo base da rota deste controller como /colaboradores
@ApiTags('Colaboradores')
@Controller('colaboradores')
export class ColaboradoresController {
  // Injeta a dependência do ColaboradoresService através do construtor
  constructor(private readonly colaboradoresService: ColaboradoresService) {}

  // Mapeia este método para responder a requisições HTTP GET na rota base (/colaboradores)
  @ApiOperation({
    summary: 'Pesquisar colaboradores',
    description: 'Busca colaboradores por nome, CPF ou matrícula.'
  })
  @Get()
  // O decorator @Query extrai o parâmetro 'search' da query string da requisição HTTP
  async buscarColaboradores(@Query('search') search: string) {
    // Chama o método buscar do service passando o termo de pesquisa e retorna o resultado para o cliente
    return this.colaboradoresService.buscar(search);
  }

  // Mapeia este método para a rota /colaboradores/:id (ex: /colaboradores/123e4567-e89b-12d3-a456-426614174000)
  @ApiOperation({
    summary: 'Buscar detalhes do colaborador',
    description: 'Busca os detalhes completos de um colaborador pelo seu UUID, retornando dados pessoais e histórico de alocações e exames.'
  })
  @Get(':id')
  // O decorator @Param extrai o 'id' dos parâmetros da URL
  async buscarPorId(@Param('id') id: string) {
    // Repassa o ID para o service realizar a busca detalhada
    return this.colaboradoresService.buscarPorId(id);
  }
}
