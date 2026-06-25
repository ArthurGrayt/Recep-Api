// Importa os decorators necessários para definir o controller, rotas e extração de parâmetros
import { Controller, Post, Get, Patch, Delete, Body, Param, Logger } from '@nestjs/common';

// Importa o service que contém toda a lógica de negócio
import { ChamadasService } from './chamadas.service';

// Importa o DTO que define o formato esperado do payload de entrada
import { SalvarTicketDto } from './dto/salvar-ticket.dto';

// Define o prefixo base das rotas deste controller — todas começarão com /chamadas
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
  @Post('tickets/processar')
  processarTicket(@Body() dto: SalvarTicketDto) {
    // Loga a chegada da requisição com os dados básicos do ticket
    this.logger.log(`POST /tickets/processar recebido → ticket: ${dto.ticket}, tipo: ${dto.tipo}`);
    // Delega a lógica de roteamento para o service
    return this.chamadasService.processarTicket(dto);
  }

  // ─────────────────────────────────────────────────────────────────
  // PATCH /chamadas/fila/atendimentos/:id/:ticket_id
  // Recepção finaliza o atendimento sem agendamento (soft-delete)
  // ─────────────────────────────────────────────────────────────────
  @Patch('fila/atendimentos/:id/:ticket_id')
  finalizarAtendimentoRecepcao(
    @Param('id') id: string,
    @Param('ticket_id') ticket_id: string,
  ) {
    this.logger.log(`PATCH /fila/atendimentos/${id}/${ticket_id}`);
    return this.chamadasService.excluirDaFilaAtendimentos(Number(id), ticket_id);
  }

  // ─────────────────────────────────────────────────────────────────
  // POST /chamadas/recepcao/atender/:identificador
  // Recepção conclui o atendimento presencial do colaborador (Agendado)
  // ─────────────────────────────────────────────────────────────────
  @Post('recepcao/atender/:identificador')
  atenderNaRecepcao(@Param('identificador') identificador: string) {
    // Loga o ticket que está sendo atendido na recepção
    this.logger.log(`POST /recepcao/atender/${identificador}`);
    // Passa a string inteira para o service (ex: "AG001")
    return this.chamadasService.atenderNaRecepcao(identificador);
  }

  // ─────────────────────────────────────────────────────────────────
  // POST /chamadas/sala/:sala_id/chamar/:identificador
  // Sala chama o colaborador para atendimento (disponivel: 1 → 2)
  // ─────────────────────────────────────────────────────────────────
  @Post('sala/:sala_id/chamar/:identificador')
  chamarNaSala(
    @Param('sala_id') sala_id: string,
    @Param('identificador') identificador: string,
  ) {
    // Loga qual sala está chamando qual ticket
    this.logger.log(`POST /sala/${sala_id}/chamar/${identificador}`);
    // Converte a sala para número e passa o identificador de string para o service
    return this.chamadasService.chamarNaSala(Number(sala_id), identificador);
  }

  // ─────────────────────────────────────────────────────────────────
  // POST /chamadas/sala/:sala_id/finalizar/:identificador
  // Sala finaliza o atendimento e remove o colaborador da fila
  // ─────────────────────────────────────────────────────────────────
  @Post('sala/:sala_id/finalizar/:identificador')
  finalizarNaSala(
    @Param('sala_id') sala_id: string,
    @Param('identificador') identificador: string,
  ) {
    // Loga qual sala está finalizando qual ticket
    this.logger.log(`POST /sala/${sala_id}/finalizar/${identificador}`);
    // Converte a sala para número e passa o identificador de string para o service
    return this.chamadasService.finalizarNaSala(Number(sala_id), identificador);
  }

  // ─────────────────────────────────────────────────────────────────
  // GET /chamadas/fila/atendimentos
  // Retorna todos os tickets aguardando atendimento na recepção
  // ─────────────────────────────────────────────────────────────────
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
  @Get('fila/agendamentos/:sala_id')
  getFilaAgendamentos(@Param('sala_id') sala_id: string) {
    // Loga a chegada da requisição de leitura da fila de uma sala específica
    this.logger.log(`GET /fila/agendamentos/${sala_id}`);
    // Converte sala_id de string para número e delega ao service
    return this.chamadasService.getFilaAgendamentos(Number(sala_id));
  }
}
