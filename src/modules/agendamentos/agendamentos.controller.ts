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
    // Filtros adicionais
    @Query('empresa_id') empresa_id?: string,
    @Query('unidade_id') unidade_id?: string,
    @Query('cargo_id') cargo_id?: string,
    @Query('metodo_pagamento') metodo_pagamento?: string,
    @Query('aso_liberado') aso_liberado?: string,
    @Query('tipo_exame') tipo_exame?: string,
    @Query('rac_qtd_cobrar') rac_qtd_cobrar?: string,
    @Query('aso_qtd_cobrar') aso_qtd_cobrar?: string,
  ) {
    // Define valores padrão para a paginação caso não sejam fornecidos
    const pageNumber = page ? Number(page) : 1;
    const limitNumber = limit ? Number(limit) : 10;
    const salaNumber = sala ? Number(sala) : undefined;

    const filters = {
      empresa_id,
      unidade_id,
      cargo_id,
      metodo_pagamento,
      aso_liberado,
      tipo_exame,
      rac_qtd_cobrar,
      aso_qtd_cobrar
    };

    // Chama o método findAll do serviço repassando a paginação e os filtros de data, sala e adicionais
    return this.agendamentosService.findAll(pageNumber, limitNumber, dataInicial, dataFinal, salaNumber, filters);
  }

  @ApiOperation({
    summary: 'Estatísticas de presença',
    description: 'Retorna a quantidade total de agendamentos (sala 1) separados por presença confirmada ou ausente.'
  })
  @Get('estatisticas/presenca')
  async getPresencaStats(
    @Query('data_inicial') dataInicial?: string,
    @Query('data_final') dataFinal?: string,
  ) {
    return this.agendamentosService.getPresencaStats(dataInicial, dataFinal);
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

  @ApiOperation({
    summary: 'Buscar exames feitos do agendamento',
    description: 'Busca apenas a lista de exames feitos vinculados ao colaborador nos agendamentos informados. Passe os IDs separados por vírgula no query param ids.'
  })
  @Get('colaborador/:colaborador_id/exames')
  async findExamesByColaboradorAndAgendamentos(
    @Param('colaborador_id') colaboradorId: string,
    @Query('ids') agendamentosIds: string,
  ) {
    console.log(`[API] Buscando exames -> Colaborador: ${colaboradorId} | Agendamentos IDs: ${agendamentosIds}`);
    const exames = await this.agendamentosService.findExamesByColaboradorAndAgendamentos(colaboradorId, agendamentosIds);
    console.log(`[API] Exames encontrados:`, JSON.stringify(exames, null, 2));
    return exames;
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

  @ApiOperation({
    summary: 'Atualizar ASO do agendamento',
    description: 'Faz upload de um arquivo base64 para o bucket ASOS e salva a URL na sala 1, ou remove a URL existente.'
  })
  @Patch('colaborador/:colaborador_id/data/:data_atendimento/aso')
  async updateAso(
    @Param('colaborador_id') colaboradorId: string,
    @Param('data_atendimento') dataAtendimento: string,
    @Body() payload: { aso_file?: string; remove?: boolean }
  ) {
    return this.agendamentosService.updateAso(colaboradorId, dataAtendimento, payload);
  }

  @ApiOperation({
    summary: 'Liberar ASO',
    description: 'Atualiza a data de liberação do ASO (aso_liberado) na sala 1.'
  })
  @Patch('colaborador/:colaborador_id/data/:data_atendimento/liberar-aso')
  async liberarAso(
    @Param('colaborador_id') colaboradorId: string,
    @Param('data_atendimento') dataAtendimento: string,
    @Body() payload: { aso_liberado: string | null }
  ) {
    return this.agendamentosService.liberarAso(colaboradorId, dataAtendimento, payload.aso_liberado);
  }

  @ApiOperation({
    summary: 'Atualizar Hora Chegada',
    description: 'Atualiza o horário de chegada de um agendamento.'
  })
  @Patch('colaborador/:colaborador_id/data/:data_atendimento/hora-chegada')
  async updateHoraChegada(
    @Param('colaborador_id') colaboradorId: string,
    @Param('data_atendimento') dataAtendimento: string,
    @Body() payload: { hora_chegada: string | null }
  ) {
    return this.agendamentosService.updateHoraChegada(colaboradorId, dataAtendimento, payload.hora_chegada);
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
      compareceu?: boolean;
      preco?: number;
      valor?: number;
      metodo_pagamento?: string;
      data_pagamento?: string;
      aso_liberado?: string;
      prioridade?: boolean;
    }
  ) {
    return this.agendamentosService.create(payload);
  }
}
