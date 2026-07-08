// Importa os decorators necessários para definir o controller, rotas e extração de parâmetros
import { Controller, Post, Get, Patch, Delete, Body, Param, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

// Importa o service que contém toda a lógica de negócio
import { ChamadasService } from './chamadas.service';

// Importa o DTO que define o formato esperado do payload de entrada
import { SalvarTicketDto } from './dto/salvar-ticket.dto';

// Define o prefixo base das rotas deste controller — todas começarão com /chamadas
@ApiTags('Chamadas')
@Controller('chamadas')
export class ChamadasController {
  // Instancia o Logger com o nome deste controller para identificação nos logs
  private readonly logger = new Logger(ChamadasController.name);

  // Injeta o ChamadasService via construtor (Injeção de Dependência)
  constructor(private readonly chamadasService: ChamadasService) {}

  // ─────────────────────────────────────────────────────────────────
  // POST /chamadas/tickets/processar
  // Ponto de entrada do fluxo — recebe o ticket e direciona para a fila correta
  // ─────────────────────────────────────────────────────────────────
  @ApiOperation({
    summary: 'Processar novo ticket',
    description: 'Ponto de entrada do fluxo. Recebe o ticket gerado e o direciona para a fila correta (recepção ou sala).'
  })
  @Post('tickets/processar')
  processarTicket(@Body() dto: SalvarTicketDto) {
    // Loga a chegada da requisição com os dados básicos do ticket
    this.logger.log(`POST /tickets/processar recebido → ticket: ${dto.ticket}, tipo: ${dto.tipo}`);
    // Delega a lógica de roteamento para o service
    return this.chamadasService.processarTicket(dto);
  }

  // ─────────────────────────────────────────────────────────────────
  // POST /chamadas/recepcao/chamar-sem-agendamento/:id_ticket/:identificador
  // Recepção chama o colaborador sem agendamento (TV + soft-delete)
  // ─────────────────────────────────────────────────────────────────
  @ApiOperation({
    summary: 'Chamar paciente sem agendamento',
    description: 'A recepção chama um colaborador que não tem agendamento (aciona a TV e realiza soft-delete na fila).'
  })
  @Post('recepcao/chamar-sem-agendamento/:id_ticket/:identificador')
  chamarSemAgendamentoRecepcao(
    @Param('id_ticket') id_ticket: string,
    @Param('identificador') identificador: string,
  ) {
    this.logger.log(`POST /recepcao/chamar-sem-agendamento/${id_ticket}/${identificador}`);
    return this.chamadasService.chamarSemAgendamentoRecepcao(Number(id_ticket), identificador);
  }

  // ─────────────────────────────────────────────────────────────────
  // POST /chamadas/recepcao/reverter-sem-agendamento/:id_ticket/:identificador
  // Reverte a chamada sem agendamento e volta o colaborador para a fila
  // ─────────────────────────────────────────────────────────────────
  @ApiOperation({
    summary: 'Reverter chamada sem agendamento',
    description: 'Reverte a chamada de um paciente sem agendamento na recepção, devolvendo-o para a fila.'
  })
  @Post('recepcao/reverter-sem-agendamento/:id_ticket/:identificador')
  reverterSemAgendamentoRecepcao(
    @Param('id_ticket') id_ticket: string,
    @Param('identificador') identificador: string,
  ) {
    this.logger.log(`POST /recepcao/reverter-sem-agendamento/${id_ticket}/${identificador}`);
    return this.chamadasService.reverterChamadaSemAgendamentoRecepcao(Number(id_ticket), identificador);
  }

  // ─────────────────────────────────────────────────────────────────
  // POST /chamadas/recepcao/chamar/:id_ticket/:identificador
  // Recepção chama o colaborador Agendado (Sala 1: 1 -> 2)
  // ─────────────────────────────────────────────────────────────────
  @ApiOperation({
    summary: 'Chamar paciente agendado',
    description: 'A recepção chama o colaborador agendado (muda o status de disponível para em atendimento).'
  })
  @Post('recepcao/chamar/:id_ticket/:identificador')
  chamarNaRecepcao(
    @Param('id_ticket') id_ticket: string,
    @Param('identificador') identificador: string
  ) {
    this.logger.log(`POST /recepcao/chamar/${id_ticket}/${identificador}`);
    return this.chamadasService.chamarAgendadoRecepcao(Number(id_ticket), identificador);
  }

  // ─────────────────────────────────────────────────────────────────
  // POST /chamadas/recepcao/atender/:id_ticket/:identificador
  // Recepção conclui o atendimento presencial do colaborador (Agendado)
  // ─────────────────────────────────────────────────────────────────
  @ApiOperation({
    summary: 'Atender na recepção',
    description: 'Conclui o atendimento presencial do colaborador na recepção.'
  })
  @Post('recepcao/atender/:id_ticket/:identificador')
  atenderNaRecepcao(
    @Param('id_ticket') id_ticket: string,
    @Param('identificador') identificador: string
  ) {
    this.logger.log(`POST /recepcao/atender/${id_ticket}/${identificador}`);
    return this.chamadasService.atenderNaRecepcao(Number(id_ticket), identificador);
  }

  // ─────────────────────────────────────────────────────────────────
  // POST /chamadas/sala/:sala_id/chamar/:id_ticket/:identificador
  // Sala chama o colaborador para atendimento (disponivel: 1 → 2)
  // ─────────────────────────────────────────────────────────────────
  @ApiOperation({
    summary: 'Chamar paciente na sala',
    description: 'A sala de exame chama o colaborador (status muda de disponível para em atendimento na sala).'
  })
  @Post('sala/:sala_id/chamar/:id_ticket/:identificador')
  chamarNaSala(
    @Param('sala_id') sala_id: string,
    @Param('id_ticket') id_ticket: string,
    @Param('identificador') identificador: string,
  ) {
    this.logger.log(`POST /sala/${sala_id}/chamar/${id_ticket}/${identificador}`);
    return this.chamadasService.chamarNaSala(Number(sala_id), Number(id_ticket), identificador);
  }

  // ─────────────────────────────────────────────────────────────────
  // POST /chamadas/sala/:sala_id/finalizar/:id_ticket/:identificador
  // Sala finaliza o atendimento e remove o colaborador da fila
  // ─────────────────────────────────────────────────────────────────
  @ApiOperation({
    summary: 'Finalizar atendimento na sala',
    description: 'A sala finaliza o atendimento do colaborador e remove-o da fila atual daquela sala.'
  })
  @Post('sala/:sala_id/finalizar/:id_ticket/:identificador')
  finalizarNaSala(
    @Param('sala_id') sala_id: string,
    @Param('id_ticket') id_ticket: string,
    @Param('identificador') identificador: string,
  ) {
    this.logger.log(`POST /sala/${sala_id}/finalizar/${id_ticket}/${identificador}`);
    return this.chamadasService.finalizarNaSala(Number(sala_id), Number(id_ticket), identificador);
  }

  // ─────────────────────────────────────────────────────────────────
  // POST /chamadas/sala/:sala_id/reverter-chamada/:id_ticket/:identificador
  // Reverte um "Chamar" equivocado (2 -> 1)
  // ─────────────────────────────────────────────────────────────────
  @ApiOperation({
    summary: 'Reverter chamada na sala',
    description: 'Reverte uma chamada equivocada, retornando o status do colaborador para disponível na fila da sala.'
  })
  @Post('sala/:sala_id/reverter-chamada/:id_ticket/:identificador')
  reverterChamada(
    @Param('sala_id') sala_id: string,
    @Param('id_ticket') id_ticket: string,
    @Param('identificador') identificador: string,
  ) {
    this.logger.log(`POST /sala/${sala_id}/reverter-chamada/${id_ticket}/${identificador}`);
    return this.chamadasService.reverterChamadaNaSala(Number(sala_id), Number(id_ticket), identificador);
  }

  // ─────────────────────────────────────────────────────────────────
  // POST /chamadas/sala/:sala_id/reverter-finalizacao/:id_ticket/:identificador
  // Reverte uma Finalização equivocada (3 -> 2)
  // ─────────────────────────────────────────────────────────────────
  @ApiOperation({
    summary: 'Reverter finalização na sala',
    description: 'Reverte uma finalização equivocada, voltando o colaborador para em atendimento na sala.'
  })
  @Post('sala/:sala_id/reverter-finalizacao/:id_ticket/:identificador')
  reverterFinalizacao(
    @Param('sala_id') sala_id: string,
    @Param('id_ticket') id_ticket: string,
    @Param('identificador') identificador: string,
  ) {
    this.logger.log(`POST /sala/${sala_id}/reverter-finalizacao/${id_ticket}/${identificador}`);
    return this.chamadasService.reverterFinalizacaoNaSala(Number(sala_id), Number(id_ticket), identificador);
  }

  // ─────────────────────────────────────────────────────────────────
  // GET /chamadas/fila/atendimentos
  // Retorna todos os tickets aguardando atendimento na recepção
  // ─────────────────────────────────────────────────────────────────
  @ApiOperation({
    summary: 'Buscar fila da recepção',
    description: 'Retorna todos os tickets que estão aguardando atendimento na recepção (sem agendamento).'
  })
  @Get('fila/atendimentos')
  getFilaAtendimentos() {
    // Loga a chegada da requisição de leitura da fila da recepção
    this.logger.log('GET /fila/atendimentos');
    // Delega a busca ao service e retorna o resultado
    return this.chamadasService.getFilaAtendimentos();
  }

  // ─────────────────────────────────────────────────────────────────
  // GET /chamadas/fila/agendamentos/:sala_id
  // Retorna todos os tickets disponíveis (disponivel = 1) para uma sala específica
  // ─────────────────────────────────────────────────────────────────
  @ApiOperation({
    summary: 'Buscar fila da sala',
    description: 'Retorna todos os agendamentos disponíveis para atendimento em uma sala específica.'
  })
  @Get('fila/agendamentos/:sala_id')
  getFilaAgendamentos(@Param('sala_id') sala_id: string) {
    // Loga a chegada da requisição de leitura da fila de uma sala específica
    this.logger.log(`GET /fila/agendamentos/${sala_id}`);
    // Converte sala_id de string para número e delega ao service
    return this.chamadasService.getFilaAgendamentos(Number(sala_id));
  }

  // ─────────────────────────────────────────────────────────────────
  // GET /chamadas/fila/todos
  // Retorna todos os atendimentos reunindo fila_atendimentos e fila_agendamentos
  // ─────────────────────────────────────────────────────────────────
  @ApiOperation({
    summary: 'Buscar todas as filas',
    description: 'Retorna uma lista unificada de todos os atendimentos (recepção e salas) em andamento.'
  })
  @Get('fila/todos')
  getTodosAtendimentos() {
    // Loga a chegada da requisição de leitura de todos os atendimentos
    this.logger.log('GET /fila/todos');
    // Delega ao service a busca das duas filas simultaneamente
    return this.chamadasService.getTodosAtendimentos();
  }
}
