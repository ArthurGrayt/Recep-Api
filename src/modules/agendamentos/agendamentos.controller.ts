// Importa os decorators necessários do pacote comum do NestJS, incluindo o Query para ler parâmetros da URL
import { Controller, Get, Query, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
// Importa o serviço de agendamentos responsável pela lógica de negócio
import { AgendamentosService } from './agendamentos.service';

// Define este arquivo como um controlador e especifica o prefixo da rota como 'agendamentos'
@ApiTags('Agendamentos')
@Controller('agendamentos')
export class AgendamentosController {
  // Injeta o AgendamentosService pelo construtor
  constructor(private readonly agendamentosService: AgendamentosService) {}

  // Define um endpoint do tipo GET para a raiz da rota '/agendamentos'
  @ApiOperation({
    summary: 'Listar agendamentos',
    description: 'Retorna uma lista paginada de agendamentos. Suporta filtros por data inicial, data final e sala.'
  })
  @Get()
  // Método assíncrono para lidar com a requisição de buscar agendamentos
  async findAll(
    // Extrai o parâmetro "page" da query string (ex: ?page=1)
    @Query('page') page?: number,
    // Extrai o parâmetro "limit" da query string (ex: ?limit=10)
    @Query('limit') limit?: number,
    // Extrai o parâmetro "data_inicial" da query string (ex: ?data_inicial=2026-07-03)
    @Query('data_inicial') dataInicial?: string,
    // Extrai o parâmetro "data_final" da query string (ex: ?data_final=2026-07-05)
    @Query('data_final') dataFinal?: string,
    // Extrai o parâmetro "sala" da query string (ex: ?sala=2)
    @Query('sala') sala?: string,
  ) {
    // Define valores padrão para a paginação caso não sejam fornecidos
    const pageNumber = page ? Number(page) : 1;
    const limitNumber = limit ? Number(limit) : 10;
    const salaNumber = sala ? Number(sala) : undefined;

    // Chama o método findAll do serviço repassando a paginação e os filtros de data e sala
    return this.agendamentosService.findAll(pageNumber, limitNumber, dataInicial, dataFinal, salaNumber);
  }

  @ApiOperation({
    summary: 'Buscar detalhes do agendamento',
    description: 'Busca os detalhes de um agendamento unificado. Use o query param ?fields=campo1,campo2 para receber apenas os campos desejados (ex: ?fields=id,status,colaboradores,exames_feitos).'
  })
  @Get('colaborador/:colaborador_id/data/:data_atendimento')
  async findByColaboradorAndDate(
    // Extrai o parâmetro colaborador_id da URL
    @Param('colaborador_id') colaboradorId: string,
    // Extrai o parâmetro data_atendimento da URL
    @Param('data_atendimento') dataAtendimento: string,
    // Extrai o query param opcional 'fields' (ex: ?fields=id,status,colaboradores)
    @Query('fields') fields?: string,
  ) {
    // Converte a string de campos em um array, ou deixa undefined para retornar tudo
    const camposSolicitados = fields ? fields.split(',').map(f => f.trim()) : undefined;
    return this.agendamentosService.findByColaboradorAndDate(colaboradorId, dataAtendimento, camposSolicitados);
  }

  // Endpoint do tipo PATCH para atualizar campos parciais do agendamento usando colaborador e data
  @ApiOperation({
    summary: 'Atualizar agendamento',
    description: 'Permite atualização parcial de um agendamento. Atualiza campos gerais em todas as salas, campos financeiros na sala 1, e pode reestruturar as salas caso a lista de exames seja alterada.'
  })
  @Patch('colaborador/:colaborador_id/data/:data_atendimento')
  // Método assíncrono para atualizar dados
  async update(
    // Extrai o parâmetro colaborador_id da URL
    @Param('colaborador_id') colaboradorId: string,
    // Extrai o parâmetro data_atendimento da URL
    @Param('data_atendimento') dataAtendimento: string,
    // Extrai o corpo da requisição (payload de atualização)
    @Body() payload: any,
  ) {
    // Chama o método correspondente do serviço para realizar as atualizações necessárias
    return this.agendamentosService.updateByColaboradorAndDate(colaboradorId, dataAtendimento, payload);
  }

  // Endpoint do tipo DELETE para excluir definitivamente um agendamento usando colaborador e data
  @ApiOperation({
    summary: 'Deletar agendamento',
    description: 'Exclui de forma definitiva um agendamento (todas as salas) e limpa os exames associados a ele, utilizando o colaborador e a data.'
  })
  @Delete('colaborador/:colaborador_id/data/:data_atendimento')
  // Método assíncrono para deletar dados
  async remove(
    // Extrai o parâmetro colaborador_id da URL
    @Param('colaborador_id') colaboradorId: string,
    // Extrai o parâmetro data_atendimento da URL
    @Param('data_atendimento') dataAtendimento: string,
  ) {
    // Chama o método correspondente do serviço para realizar a exclusão
    return this.agendamentosService.deleteByColaboradorAndDate(colaboradorId, dataAtendimento);
  }

  // Endpoint para criação de novos agendamentos
  @ApiOperation({
    summary: 'Criar novo agendamento',
    description: 'Cria um novo agendamento dividindo automaticamente os exames pelas salas correspondentes de acordo com a categoria de cada procedimento.'
  })
  @Post()
  async create(
    @Body() payload: { 
      colaborador_id?: string; 
      nome_avulso?: string;
      avulso?: boolean;
      cpf?: string;
      data_nascimento?: string;
      sexo?: string;
      funcao?: string;
      setor?: string;
      tipo?: string;
      unidade?: number;
      aso_qtd_cobrar?: number;
      rac_qtd_cobrar?: number;
      data_atendimento?: string;
      exames: number[];
      obs_agendamento?: string;
      observacoes?: string;
      observacoes_laboratorial?: string;
      foto_obs?: string;
    }
  ) {
    return this.agendamentosService.create(payload);
  }
}
