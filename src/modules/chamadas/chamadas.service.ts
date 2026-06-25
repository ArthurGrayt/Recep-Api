// Importa o decorator Injectable do NestJS para marcar a classe como um provider injetável
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';

// Importa o SupabaseService para ter acesso ao cliente do banco de dados
import { SupabaseService } from '../../supabase/supabase.service';

// Importa o DTO que define o formato do payload recebido pelo endpoint de processar ticket
import { SalvarTicketDto } from './dto/salvar-ticket.dto';

// Importa o Gateway de WebSockets
import { TelaChamadaGateway } from './tela-chamada.gateway';

// Marca a classe como um serviço injetável pelo NestJS
@Injectable()
export class ChamadasService {
  // Instancia o Logger com o contexto deste service para identificar os logs no terminal
  private readonly logger = new Logger(ChamadasService.name);

  // Injeta o SupabaseService via construtor para ter acesso ao cliente do banco
  constructor (
    private readonly supabaseService: SupabaseService,
    private readonly telaChamadaGateway: TelaChamadaGateway
  ) {}

  // ─────────────────────────────────────────────────────────────────
  // ENDPOINT: POST /chamadas/tickets/processar
  // Roteador principal: analisa o campo "tipo" e direciona para a fila correta
  // ─────────────────────────────────────────────────────────────────
  async processarTicket(dto: SalvarTicketDto) {
    this.logger.log(
      `Processando ticket #${dto.id_ticket} | Tipo: ${dto.tipo}`,
    );

    // Verifica o tipo do ticket e chama o método correspondente
    if (dto.tipo === 'Sem agendamento') {
      // Sem agendamento: insere direto na fila da recepção usando o código de texto (ex: SA001)
      return this.inserirFilaAtendimentos(dto.ticket, dto.id_ticket);
    } else if (dto.tipo === 'Agendado') {
      // Agendado: precisa do uuid do colaborador para buscar as salas
      if (!dto.id_colaborador) {
        throw new NotFoundException(
          'id_colaborador é obrigatório para tickets do tipo Agendado',
        );
      }
      // Busca as salas e insere na fila de agendamentos
      return this.inserirFilaAgendamentos(dto.ticket, dto.id_colaborador, dto.id_ticket, dto.nome);
    }

    // Retorna erro se o tipo enviado não for reconhecido
    throw new NotFoundException(
      `Tipo de ticket inválido: "${dto.tipo}". Use "Agendado" ou "Sem agendamento".`,
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // Caminho "Sem agendamento": insere na fila_atendimentos com disp = true
  // ─────────────────────────────────────────────────────────────────
  private async inserirFilaAtendimentos(ticket: string, id_ticket: number) {
    this.logger.log(
      `Inserindo ticket ${ticket} na fila_atendimentos (disp = true)`,
    );

    // Obtém o cliente Supabase para executar a operação no banco
    const supabase = this.supabaseService.getClient();

    // Insere uma linha na tabela fila_atendimentos na coluna ticket_id
    const { data, error } = await supabase
      .from('fila_atendimentos')
      .insert({ ticket_id: ticket, disp: true, sala: 'Recepção', id_ticket: id_ticket })
      .select();

    // Lança um erro caso o Supabase retorne algum problema na operação
    if (error) throw new Error(`Erro ao inserir em fila_atendimentos: ${error.message}`);

    this.logger.log(`Ticket ${ticket} inserido com sucesso na fila_atendimentos (Aguardando Recepção)`);
    return { mensagem: 'Ticket inserido na fila de atendimentos', data };
  }

  // ─────────────────────────────────────────────────────────────────
  // Caminho "Agendado": busca salas em agendamentos e insere N linhas em fila_agendamentos
  // ─────────────────────────────────────────────────────────────────
  private async inserirFilaAgendamentos(
    ticket: string,
    id_colaborador: string,
    id_ticket: number, // Chave estrangeira
    nome?: string, // Recebe o nome do colaborador
  ) {
    this.logger.log(
      `Buscando salas do colaborador ${id_colaborador} em agendamentos (compareceu = true)`,
    );

    const supabase = this.supabaseService.getClient();

    // Busca todas as linhas do colaborador em agendamentos onde compareceu = true
    // A coluna no banco chama "colaborador_id"
    const { data: salas, error: erroSalas } = await supabase
      .from('agendamentos')
      .select('sala')
      .eq('colaborador_id', id_colaborador)
      .eq('compareceu', true);

    // Lança erro se a consulta falhar
    if (erroSalas) throw new Error(`Erro ao buscar agendamentos: ${erroSalas.message}`);

    // Verifica se o colaborador tem salas agendadas
    if (!salas || salas.length === 0) {
      throw new NotFoundException(
        `Nenhum agendamento encontrado para o colaborador ${id_colaborador}`,
      );
    }

    this.logger.log(
      `${salas.length} sala(s) encontrada(s) para o colaborador. Inserindo em fila_agendamentos...`,
    );

    // Monta o array de objetos para inserção em massa, uma linha por sala
    const linhasDaFila = [];

    // Adiciona a sala 1 (Recepção) com disponivel = 1
    linhasDaFila.push({
      ticket_text: ticket,
      sala: 1,
      disponivel: 1, // 1 = disponível para ser chamado na recepção
      nome: nome,
      id_ticket: id_ticket,
    });

    // Adiciona as salas médicas com disponivel = 0
    salas.forEach((agendamento) => {
      if (Number(agendamento.sala) !== 1) {
        linhasDaFila.push({
          ticket_text: ticket,
          sala: agendamento.sala,
          disponivel: 0, // 0 = colaborador ainda não passou pela recepção
          nome: nome,
          id_ticket: id_ticket,
        });
      }
    });

    // Insere todas as linhas de uma vez na tabela fila_agendamentos
    const { data, error: erroInsert } = await supabase
      .from('fila_agendamentos')
      .insert(linhasDaFila)
      .select();

    // Lança erro se a inserção falhar
    if (erroInsert) throw new Error(`Erro ao inserir em fila_agendamentos: ${erroInsert.message}`);

    this.logger.log(
      `Ticket ${ticket} inserido em ${salas.length} sala(s) da fila_agendamentos`,
    );
    return {
      mensagem: `Ticket inserido em ${salas.length} sala(s) da fila de agendamentos`,
      data,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // ENDPOINT: POST /chamadas/recepcao/chamar-sem-agendamento/:id_ticket/:identificador
  // Recepção chama o colaborador "Sem agendamento", exibe na TV e finaliza da fila (disp = false)
  // ─────────────────────────────────────────────────────────────────
  async chamarSemAgendamentoRecepcao(id_ticket: number, identificador: string) {
    this.logger.log(`Recepção chamando ticket sem agendamento ${identificador} (ID_Ticket: ${id_ticket})`);

    const supabase = this.supabaseService.getClient();

    // 1. Busca os dados da fila antes de deletar
    const { data: filaData, error: errBusca } = await supabase
      .from('fila_atendimentos')
      .select('created_at, disp')
      .eq('id_ticket', id_ticket)
      .eq('ticket_id', identificador)
      .maybeSingle();

    if (errBusca) throw new Error(`Erro ao buscar dados: ${errBusca.message}`);
    
    if (!filaData) {
      throw new NotFoundException(`Atendimento ID do ticket ${id_ticket} e ticket ${identificador} não encontrado na fila.`);
    }

    // Regra: Verifica se já foi finalizado
    if (filaData.disp === false) {
      const msgErro = `O atendimento do ticket ${identificador} já foi finalizado na recepção anteriormente.`;
      this.logger.warn(msgErro);
      throw new BadRequestException(msgErro);
    }

    // 3. Executa a atualização da fila (soft-delete) marcando como disp = false
    const { error } = await supabase
      .from('fila_atendimentos')
      .update({ 
        disp: false,
        chamado_em: new Date().toISOString()
      })
      .eq('id_ticket', id_ticket)
      .eq('ticket_id', identificador);

    if (error) throw new Error(`Erro ao chamar atendimento sem agendamento: ${error.message}`);

    // Emite o evento para a TV através do WebSocket (Aviso visual para o colaborador ir ao balcão)
    this.telaChamadaGateway.emitirChamadaSemAgendamento(identificador, 'Recepção');

    return { mensagem: 'Atendimento sem agendamento chamado na recepção com sucesso' };
  }

  // ─────────────────────────────────────────────────────────────────
  // ENDPOINT: POST /chamadas/recepcao/reverter-sem-agendamento/:id_ticket/:identificador
  // Reverte um "Chamar" equivocado para sem agendamento (volta a aparecer na fila)
  // ─────────────────────────────────────────────────────────────────
  async reverterChamadaSemAgendamentoRecepcao(id_ticket: number, identificador: string) {
    this.logger.log(`Revertendo chamada sem agendamento do ticket ${identificador} (ID_Ticket: ${id_ticket})`);

    const supabase = this.supabaseService.getClient();

    const { error } = await supabase
      .from('fila_atendimentos')
      .update({ 
        disp: true,
        chamado_em: null
      })
      .eq('id_ticket', id_ticket)
      .eq('ticket_id', identificador)
      .eq('disp', false); // Só reverte se realmente já foi chamado

    if (error) throw new Error(`Erro ao reverter chamada sem agendamento: ${error.message}`);

    return { mensagem: 'Chamada sem agendamento revertida. O colaborador voltou a aguardar.' };
  }












  // ─────────────────────────────────────────────────────────────────
  // ENDPOINT: POST /chamadas/recepcao/chamar/:id_ticket/:identificador
  // Recepção chama o colaborador Agendado (Sala 1: 1 -> 2)
  // ─────────────────────────────────────────────────────────────────
  async chamarAgendadoRecepcao(id_ticket: number, identificador: string) {
    this.logger.log(`Recepção chamando ticket agendado ${identificador} (ID: ${id_ticket})`);
    // A Recepção agora é tratada internamente como a sala 1
    // Reutiliza toda a lógica de segurança e validação já existente
    return this.chamarNaSala(1, id_ticket, identificador);
  }

  // ─────────────────────────────────────────────────────────────────
  // ENDPOINT: POST /chamadas/recepcao/atender/:id_ticket/:identificador
  // Recepção atende o colaborador Agendado: atualiza fila_agendamentos
  // ─────────────────────────────────────────────────────────────────
  async atenderNaRecepcao(id_ticket: number, identificador: string) {
    this.logger.log(`Recepção finalizando ticket agendado ${identificador} (ID: ${id_ticket}) e liberando para salas`);

    const supabase = this.supabaseService.getClient();

    // 1. Marca a sala 1 (Recepção) como finalizada (3) e salva no histórico
    // Podemos reutilizar o método de finalizar, que já cria o histórico
    await this.finalizarNaSala(1, id_ticket, identificador);

    // 2. Libera as outras salas médicas de 0 para 1
    const { data, error } = await supabase
      .from('fila_agendamentos')
      .update({ disponivel: 1 })
      .eq('id_ticket', id_ticket)
      .neq('sala', 1)
      .eq('disponivel', 0)
      .select();

    if (error) throw new Error(`Erro ao liberar salas médicas: ${error.message}`);

    this.logger.log(
      `Ticket ${identificador} finalizado na recepção e liberado para as salas médicas`,
    );
    return {
      mensagem: 'Colaborador agendado finalizado na recepção e liberado para as salas.',
      data,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // ENDPOINT: POST /chamadas/sala/:sala_id/chamar/:id_ticket/:identificador
  // Sala chama o colaborador: atualiza disponivel de 1 para 2 (em atendimento)
  // ─────────────────────────────────────────────────────────────────
  async chamarNaSala(sala_id: number, id_ticket: number, identificador: string) {
    this.logger.log(`Sala ${sala_id} tentando chamar ticket ${identificador} (ID: ${id_ticket})`);

    const supabase = this.supabaseService.getClient();

    // 0. Regra Nova: Uma sala médica não pode chamar ninguém se já estiver com alguém em atendimento
    // A Recepção (sala 1) está isenta dessa regra e pode chamar múltiplos colaboradores
    if (sala_id !== 1) {
      const { data: ocupantesSala, error: errSala } = await supabase
        .from('fila_agendamentos')
        .select('id')
        .eq('sala', sala_id)
        .eq('disponivel', 2)
        .limit(1);

      if (errSala) throw new Error(`Erro ao verificar status da sala: ${errSala.message}`);

      if (ocupantesSala && ocupantesSala.length > 0) {
        const msgErro = `A sala ${sala_id} já está atendendo um colaborador. Finalize o atendimento atual antes de chamar o próximo.`;
        this.logger.warn(msgErro);
        throw new BadRequestException(msgErro);
      }
    }

    // 1. Busca todas as filas desse ticket
    const { data: filas, error: errBusca } = await supabase
      .from('fila_agendamentos')
      .select('*')
      .eq('id_ticket', id_ticket);

    if (errBusca) throw new Error(`Erro ao buscar validações: ${errBusca.message}`);

    if (!filas || filas.length === 0) {
      throw new NotFoundException(`Ticket ${identificador} não encontrado na fila de agendamentos.`);
    }

    // 2. Regra: Se o colaborador estiver com disponivel = 2 em QUALQUER sala, não pode ser chamado
    const salaEmAtendimento = filas.find(f => Number(f.disponivel) === 2);
    if (salaEmAtendimento) {
      const msgErro = `Não é possível chamar. O colaborador já está em atendimento na sala ${salaEmAtendimento.sala}.`;
      this.logger.warn(msgErro);
      // Lança um erro HTTP 400 (Bad Request) com a mensagem clara para o front-end
      throw new NotFoundException(msgErro); // Usando NotFoundException ou BadRequestException (nest import)
    }

    // 3. Regra: Verifica a situação específica na sala que está tentando chamá-lo
    const filaDestaSala = filas.find(f => Number(f.sala) === sala_id);
    if (!filaDestaSala) {
      throw new NotFoundException(`O ticket ${identificador} não possui agendamento para a sala ${sala_id}.`);
    }

    if (Number(filaDestaSala.disponivel) === 0) {
      const msgErro = `Não é possível chamar. O ticket ${identificador} ainda não foi liberado pela recepção (disponivel = 0).`;
      this.logger.warn(msgErro);
      throw new NotFoundException(msgErro);
    }

    if (Number(filaDestaSala.disponivel) !== 1) {
       // Tratamento genérico caso haja outro status desconhecido
       throw new NotFoundException(`Status inválido para chamada.`);
    }

    this.logger.log(
      `Validações aprovadas. Sala ${sala_id} chamando ticket ${identificador} (disponivel: 1 → 2)`,
    );

    // 4. Se passou pelas validações, faz o update para disponivel = 2 (em atendimento)
    const { data, error } = await supabase
      .from('fila_agendamentos')
      .update({ 
        disponivel: 2, 
        chamado_em: new Date().toISOString() 
      })
      .eq('id_ticket', id_ticket)
      .eq('sala', sala_id)
      .select();

    if (error) throw new Error(`Erro ao chamar na sala: ${error.message}`);

    if (sala_id === 1) {
      this.telaChamadaGateway.emitirChamadaSemAgendamento(identificador, 'Recepção', filaDestaSala.nome);
    } else {
      this.telaChamadaGateway.emitirChamadaAgendada(identificador, sala_id, filaDestaSala.nome);
    }

    this.logger.log(`Ticket ${identificador} em atendimento na sala ${sala_id}`);
    return { mensagem: `Colaborador chamado para a sala ${sala_id}`, data };
  }

  // ─────────────────────────────────────────────────────────────────
  // ENDPOINT: POST /chamadas/sala/:sala_id/finalizar/:id_ticket/:identificador
  // Sala finaliza o atendimento: deleta a linha correspondente
  // ─────────────────────────────────────────────────────────────────
  async finalizarNaSala(sala_id: number, id_ticket: number, identificador: string) {
    this.logger.log(
      `Sala ${sala_id} finalizando atendimento do ticket ${identificador} (ID: ${id_ticket})`,
    );

    const supabase = this.supabaseService.getClient();

    // 1. Busca os dados da fila antes de deletar para salvar no histórico
    const { data: filaData, error: errBusca } = await supabase
      .from('fila_agendamentos')
      .select('created_at, disponivel')
      .eq('id_ticket', id_ticket)
      .eq('sala', sala_id)
      .maybeSingle();

    if (errBusca) throw new Error(`Erro ao buscar dados para histórico: ${errBusca.message}`);

    if (!filaData) {
      throw new NotFoundException(`Atendimento do ticket ${identificador} não encontrado na sala ${sala_id}.`);
    }

    // Regra: Verifica se já foi finalizado
    if (Number(filaData.disponivel) === 3) {
      const msgErro = `O atendimento do ticket ${identificador} na sala ${sala_id} já foi finalizado anteriormente.`;
      this.logger.warn(msgErro);
      throw new BadRequestException(msgErro);
    }

    // (O histórico de atendimentos foi desativado conforme regras do negócio)

    // 3. Em vez de deletar, atualiza a linha específica marcando como disponivel = 3 (Finalizado)
    const { error } = await supabase
      .from('fila_agendamentos')
      .update({ 
        disponivel: 3, 
        finalizado_em: new Date().toISOString() 
      })
      .eq('id_ticket', id_ticket)
      .eq('sala', sala_id);

    if (error) throw new Error(`Erro ao finalizar atendimento na sala: ${error.message}`);

    this.logger.log(
      `Atendimento do ticket ${identificador} na sala ${sala_id} finalizado. Status alterado para 3 e arquivado.`,
    );
    return {
      mensagem: `Atendimento finalizado na sala ${sala_id} e salvo no histórico.`,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // ENDPOINT: GET /chamadas/fila/atendimentos
  // Lista todos os tickets aguardando atendimento na recepção (disp = true)
  // ─────────────────────────────────────────────────────────────────
  async getFilaAtendimentos() {
    this.logger.log('Buscando fila de atendimentos (disp = true)');

    const supabase = this.supabaseService.getClient();

    // Seleciona todas as linhas da fila_atendimentos onde disp = true (aguardando)
    const { data, error } = await supabase
      .from('fila_atendimentos')
      .select('*')
      .eq('disp', true)
      .order('created_at', { ascending: true }); // Ordena por ordem de chegada

    if (error) throw new Error(`Erro ao buscar fila_atendimentos: ${error.message}`);

    this.logger.log(`${data?.length ?? 0} ticket(s) na fila de atendimentos`);
    return data;
  }

  // ─────────────────────────────────────────────────────────────────
  // ENDPOINT: GET /chamadas/fila/agendamentos/:sala_id
  // Lista os tickets disponíveis para uma sala específica (disponivel = 1)
  // ─────────────────────────────────────────────────────────────────
  async getFilaAgendamentos(sala_id: number) {
    this.logger.log(
      `Buscando fila de agendamentos da sala ${sala_id} (disponivel = 1)`,
    );

    const supabase = this.supabaseService.getClient();

    // Seleciona linhas da sala específica onde disponivel = 1 (aguardando chamada da sala)
    const { data, error } = await supabase
      .from('fila_agendamentos')
      .select('*')
      .eq('sala', sala_id)
      .eq('disponivel', 1)
      .order('created_at', { ascending: true }); // Ordena por ordem de chegada

    if (error) throw new Error(`Erro ao buscar fila_agendamentos: ${error.message}`);

    this.logger.log(
      `${data?.length ?? 0} ticket(s) disponível(is) na sala ${sala_id}`,
    );
    return data;
  }

  // ─────────────────────────────────────────────────────────────────
  // ENDPOINT: POST /chamadas/sala/:sala_id/reverter-chamada/:id_ticket/:identificador
  // Reverte um "Chamar" equivocado (2 -> 1)
  // ─────────────────────────────────────────────────────────────────
  async reverterChamadaNaSala(sala_id: number, id_ticket: number, identificador: string) {
    this.logger.log(`Revertendo chamada na sala ${sala_id} do ticket ${identificador} (ID: ${id_ticket})`);
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase
      .from('fila_agendamentos')
      .update({ 
        disponivel: 1, 
        chamado_em: null 
      })
      .eq('id_ticket', id_ticket)
      .eq('sala', sala_id)
      .eq('disponivel', 2);

    if (error) throw new Error(`Erro ao reverter chamada: ${error.message}`);

    return { mensagem: 'Chamada revertida com sucesso. O colaborador voltou a aguardar.' };
  }

  // ─────────────────────────────────────────────────────────────────
  // ENDPOINT: POST /chamadas/sala/:sala_id/reverter-finalizacao/:id_ticket/:identificador
  // Reverte uma Finalização equivocada (3 -> 2). Na recepção, também re-bloqueia as salas.
  // ─────────────────────────────────────────────────────────────────
  async reverterFinalizacaoNaSala(sala_id: number, id_ticket: number, identificador: string) {
    this.logger.log(`Revertendo finalização na sala ${sala_id} do ticket ${identificador} (ID: ${id_ticket})`);
    const supabase = this.supabaseService.getClient();

    // 1. Volta a sala específica de 3 para 2
    const { error } = await supabase
      .from('fila_agendamentos')
      .update({ 
        disponivel: 2, 
        finalizado_em: null 
      })
      .eq('id_ticket', id_ticket)
      .eq('sala', sala_id)
      .eq('disponivel', 3);

    if (error) throw new Error(`Erro ao reverter finalização: ${error.message}`);

    // 2. Se for a Recepção (Sala 1), precisa re-bloquear as salas médicas (1 -> 0)
    if (sala_id === 1) {
      this.logger.log(`Recepção revertida: re-bloqueando salas médicas do ticket ${identificador}`);
      const { error: errBloqueio } = await supabase
        .from('fila_agendamentos')
        .update({ disponivel: 0 })
        .eq('id_ticket', id_ticket)
        .neq('sala', 1)
        .eq('disponivel', 1);

      if (errBloqueio) throw new Error(`Erro ao re-bloquear salas médicas: ${errBloqueio.message}`);
    }

    return { mensagem: 'Finalização revertida com sucesso. O colaborador voltou para em atendimento.' };
  }
}
