import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { SalasService } from '../salas/salas.service';

// Marca a classe como um serviço injetável no sistema de injeção de dependências do NestJS
@Injectable()
export class AgendamentosService {
  // Instancia um Logger para registrar eventos relacionados aos agendamentos
  private readonly logger = new Logger(AgendamentosService.name);

  // Injeta o serviço do Supabase e o serviço de Salas através do construtor
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly salasService: SalasService,
  ) {}

  // Helper para fazer upload de imagens base64 para o Supabase Storage
  private async uploadFotoObs(supabase: any, base64Image: string, prefixId: string): Promise<string> {
    const match = base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!match) {
      throw new Error('Formato de imagem inválido. Esperado data:image/...;base64,...');
    }

    const contentType = match[1];
    const buffer = Buffer.from(match[2], 'base64');
    const ext = contentType.split('/')[1] || 'png';
    const filename = `${prefixId}_${Date.now()}.${ext}`;

    const { data, error } = await supabase
      .storage
      .from('observacoes_agendamentos')
      .upload(filename, buffer, {
        contentType,
        upsert: true
      });

    if (error) {
      this.logger.error(`Erro ao fazer upload da imagem: ${error.message}`);
      throw new Error(`Erro ao salvar a foto: ${error.message}`);
    }

    const { data: publicData } = supabase
      .storage
      .from('observacoes_agendamentos')
      .getPublicUrl(filename);

    return publicData.publicUrl;
  }

  // Helper para fazer upload de arquivos ASO para o Supabase Storage
  private async uploadAsoFile(supabase: any, base64File: string, prefixId: string): Promise<string> {
    const match = base64File.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!match) {
      throw new Error('Formato de arquivo inválido. Esperado data:[mime_type];base64,...');
    }

    const contentType = match[1];
    const buffer = Buffer.from(match[2], 'base64');
    let ext = 'pdf';
    if (contentType.includes('pdf')) ext = 'pdf';
    else if (contentType.includes('png')) ext = 'png';
    else if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = 'jpg';
    
    const filename = `${prefixId}_${Date.now()}.${ext}`;

    const { data, error } = await supabase
      .storage
      .from('ASOS')
      .upload(filename, buffer, {
        contentType,
        upsert: true
      });

    if (error) {
      this.logger.error(`Erro ao fazer upload do ASO: ${error.message}`);
      throw new Error(`Erro ao salvar o ASO: ${error.message}`);
    }

    const { data: publicData } = supabase
      .storage
      .from('ASOS')
      .getPublicUrl(filename);

    return publicData.publicUrl;
  }

  // Método assíncrono para buscar agendamentos com paginação e filtro de datas, sala e adicionais
  async findAll(page: number, limit: number, dataInicial?: string, dataFinal?: string, sala?: number, filters?: any) {
    // Registra no log que a busca por agendamentos foi iniciada com os parâmetros informados
    this.logger.log(`Buscando agendamentos - Página: ${page}, Limite: ${limit}, Inicial: ${dataInicial}, Final: ${dataFinal}, Sala: ${sala}, Filtros: ${JSON.stringify(filters || {})}`);

    // Obtém o cliente do Supabase para realizar a consulta
    const supabase = this.supabaseService.getClient();

    // Calcula os índices 'from' e 'to' para a paginação do Supabase (zero-indexed)
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Inicia a query na tabela "agendamentos", selecionando todas as colunas
    // e fazendo os joins (relacionamentos) no Supabase para buscar toda a hierarquia de
    // empresa -> unidade -> setor -> cargo -> colaborador
    let query = supabase
      .from('agendamentos')
      .select(`
        *,
        colaboradores (
          nome,
          cpf,
          colaborador_cargo_unidade_setor (
            ativo,
            cargo_setor_unidade (
              cargo (
                nome
              ),
              unidade_setor (
                setor (
                  nome
                ),
                unidade_cliente (
                  razao_social,
                  empresa_cliente (
                    razao_social
                  )
                )
              )
            )
          )
        )
      `, { count: 'exact' })
      .range(from, to)
      // Ordena por padrão pela data de atendimento de forma decrescente
      .order('data_atendimento', { ascending: false });

    // Se uma sala foi fornecida e é um número válido, filtra os agendamentos pela sala
    if (sala !== undefined && !isNaN(sala)) {
      query = query.eq('sala', sala);
    }

    // Se uma data inicial foi fornecida na requisição
    if (dataInicial) {
      // Se também houver uma data final, filtra os agendamentos pelo intervalo de datas
      if (dataFinal) {
        query = query.gte('data_atendimento', dataInicial).lte('data_atendimento', dataFinal);
      } else {
        // Se houver APENAS a data inicial, busca unicamente os agendamentos desse dia exato
        query = query.eq('data_atendimento', dataInicial);
      }
    } else if (dataFinal) {
      // Se houver apenas a data final (sem data inicial), busca tudo até essa data
      query = query.lte('data_atendimento', dataFinal);
    }
    // Aplica os filtros diretos na tabela agendamentos, se existirem
    if (filters) {
      if (filters.metodo_pagamento) {
        query = query.eq('metodo_pagamento', filters.metodo_pagamento);
      }
      if (filters.tipo_exame) {
        query = query.ilike('tipo', `%${filters.tipo_exame}%`);
      }
      if (filters.rac_qtd_cobrar !== undefined) {
        query = query.eq('rac_qtd_cobrar', Number(filters.rac_qtd_cobrar));
      }
      if (filters.aso_qtd_cobrar !== undefined) {
        query = query.eq('aso_qtd_cobrar', Number(filters.aso_qtd_cobrar));
      }
      if (filters.aso_liberado) {
        if (filters.aso_liberado === 'null') {
          query = query.is('aso_liberado', null);
        } else {
          // Se não for 'null', busca os que POSSUEM data (não nulos)
          query = query.not('aso_liberado', 'is', null);
        }
      }
      
      // Filtros hierárquicos: Empresa, Unidade e Cargo
      if (filters.empresa_id || filters.unidade_id || filters.cargo_id) {
        let colabQuery = supabase.from('colaborador_cargo_unidade_setor')
          .select(`
            colaborador_id,
            cargo_setor_unidade!inner (
              cargo${filters.cargo_id ? '!inner' : ''} (id, nome),
              unidade_setor${filters.empresa_id || filters.unidade_id ? '!inner' : ''} (
                unidade_cliente${filters.empresa_id || filters.unidade_id ? '!inner' : ''} (
                  id, razao_social,
                  empresa_cliente${filters.empresa_id ? '!inner' : ''} (id, razao_social)
                )
              )
            )
          `)
          .eq('ativo', true);

        if (filters.empresa_id) {
          if (!isNaN(Number(filters.empresa_id))) {
            colabQuery = colabQuery.eq('cargo_setor_unidade.unidade_setor.unidade_cliente.empresa_cliente.id', Number(filters.empresa_id));
          } else {
            colabQuery = colabQuery.ilike('cargo_setor_unidade.unidade_setor.unidade_cliente.empresa_cliente.razao_social', `%${filters.empresa_id}%`);
          }
        }
        if (filters.unidade_id) {
          if (!isNaN(Number(filters.unidade_id))) {
            colabQuery = colabQuery.eq('cargo_setor_unidade.unidade_setor.unidade_cliente.id', Number(filters.unidade_id));
          } else {
            colabQuery = colabQuery.ilike('cargo_setor_unidade.unidade_setor.unidade_cliente.razao_social', `%${filters.unidade_id}%`);
          }
        }
        if (filters.cargo_id) {
          if (!isNaN(Number(filters.cargo_id))) {
            colabQuery = colabQuery.eq('cargo_setor_unidade.cargo.id', Number(filters.cargo_id));
          } else {
            colabQuery = colabQuery.ilike('cargo_setor_unidade.cargo.nome', `%${filters.cargo_id}%`);
          }
        }

        const { data: colabsData, error: errColab } = await colabQuery;
        if (errColab) {
          this.logger.error(`Erro ao filtrar colaboradores: ${errColab.message}`);
          throw new Error(`Erro ao filtrar colaboradores: ${errColab.message}`);
        }

        const validColabIds = colabsData ? colabsData.map((c: any) => c.colaborador_id) : [];
        if (validColabIds.length === 0) {
          return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
        }
        
        query = query.in('colaborador_id', validColabIds);
      }
    }

    // Executa a consulta aguardando o retorno dos dados, possíveis erros e a contagem total
    const { data, error, count } = await query;

    // Verifica se houve algum erro durante a consulta
    if (error) {
      // Registra o erro no log
      this.logger.error(`Erro ao buscar agendamentos: ${error.message}`);
      // Lança um erro com a mensagem retornada pelo Supabase
      throw new Error(`Erro ao buscar agendamentos: ${error.message}`);
    }

    // Formata os dados para planificar a resposta aninhada retornada pelo Supabase
    // Isso facilita o uso dos dados no Frontend
    const dadosFormatados = data?.map(agendamento => {
      // Pega o objeto do colaborador retornado no join
      const colaborador = agendamento.colaboradores || {};
      
      // O Supabase retorna um array para relacionamentos 'um para muitos'
      // Buscamos a alocação atual (ativo = true) ou pegamos a primeira da lista como fallback
      const historicoCargos = colaborador.colaborador_cargo_unidade_setor || [];
      const alocacaoAtual = historicoCargos.find((c: any) => c.ativo) || historicoCargos[0] || {};
      
      // Extrai os nomes navegando de forma segura (optional chaining) pela árvore de dados
      const cargoNome = alocacaoAtual.cargo_setor_unidade?.cargo?.nome || null;
      const setorNome = alocacaoAtual.cargo_setor_unidade?.unidade_setor?.setor?.nome || null;
      const unidadeNome = alocacaoAtual.cargo_setor_unidade?.unidade_setor?.unidade_cliente?.razao_social || null;
      const empresaNome = alocacaoAtual.cargo_setor_unidade?.unidade_setor?.unidade_cliente?.empresa_cliente?.razao_social || null;

      // Cria um novo objeto removendo o campo sujo 'colaboradores' (gerado pelo Supabase)
      const { colaboradores, ...agendamentoLimpo } = agendamento;

      // Retorna o agendamento incluindo as novas propriedades de forma plana (flat) na raiz
      return {
        ...agendamentoLimpo,
        colaborador_nome: colaborador.nome || null,
        colaborador_cpf: colaborador.cpf || null,
        colaborador_cargo: cargoNome,
        colaborador_setor: setorNome,
        colaborador_unidade: unidadeNome,
        colaborador_empresa: empresaNome,
      };
    });

    // Retorna um objeto com os dados formatados e os metadados de paginação
    return {
      data: dadosFormatados,
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      }
    };
  }

  // Método para buscar estatísticas de presença
  async getPresencaStats(data_inicial?: string, data_final?: string) {
    this.logger.log(`Buscando estatísticas de presença - Inicial: ${data_inicial}, Final: ${data_final}`);
    const supabase = this.supabaseService.getClient();

    let queryTotal = supabase
      .from('agendamentos')
      .select('*', { count: 'exact', head: true })
      .eq('sala', 1);
      
    let queryPresentes = supabase
      .from('agendamentos')
      .select('*', { count: 'exact', head: true })
      .eq('sala', 1)
      .eq('compareceu', true);

    if (data_inicial) {
      if (data_final) {
        queryTotal = queryTotal.gte('data_atendimento', data_inicial).lte('data_atendimento', data_final);
        queryPresentes = queryPresentes.gte('data_atendimento', data_inicial).lte('data_atendimento', data_final);
      } else {
        queryTotal = queryTotal.eq('data_atendimento', data_inicial);
        queryPresentes = queryPresentes.eq('data_atendimento', data_inicial);
      }
    } else if (data_final) {
        queryTotal = queryTotal.lte('data_atendimento', data_final);
        queryPresentes = queryPresentes.lte('data_atendimento', data_final);
    }

    const [resTotal, resPresentes] = await Promise.all([queryTotal, queryPresentes]);

    if (resTotal.error) {
      this.logger.error(`Erro ao buscar total: ${resTotal.error.message}`);
      throw new Error(`Erro ao buscar total: ${resTotal.error.message}`);
    }
    if (resPresentes.error) {
      this.logger.error(`Erro ao buscar presentes: ${resPresentes.error.message}`);
      throw new Error(`Erro ao buscar presentes: ${resPresentes.error.message}`);
    }

    const total = resTotal.count || 0;
    const presentes = resPresentes.count || 0;
    const ausentes = total - presentes;

    return {
      presentes,
      ausentes,
      total
    };
  }

  // Método assíncrono para buscar os detalhes completos de todos os agendamentos de um colaborador em uma data específica
  async findByColaboradorAndDate(
    // Recebe o UUID do colaborador
    colaborador_id: string,
    // Recebe a data de atendimento
    data_atendimento: string,
    // Lista opcional de campos desejados no retorno (ex: ['id', 'status', 'colaboradores'])
    fields?: string[],
  ) {
    this.logger.log(`Buscando detalhes do agendamento para o colaborador: ${colaborador_id} na data: ${data_atendimento}`);
    
    const supabase = this.supabaseService.getClient();
    
    // Busca todos os agendamentos do colaborador naquela data com dados completos do colaborador
    const { data, error } = await supabase
      .from('agendamentos')
      .select(`
        *,
        colaboradores (
          id,
          nome,
          cpf,
          data_nascimento,
          sexo,
          colaborador_cargo_unidade_setor (
            ativo,
            cargo_setor_unidade (
              cargo (
                nome
              ),
              unidade_setor (
                setor (
                  nome
                ),
                unidade_cliente (
                  id,
                  razao_social,
                  empresa_cliente (
                    id,
                    razao_social
                  )
                )
              )
            )
          )
        )
      `)
      .eq('colaborador_id', colaborador_id)
      .eq('data_atendimento', data_atendimento);
      
    if (error) {
      this.logger.error(`Erro ao buscar detalhes do agendamento: ${error.message}`);
      throw new InternalServerErrorException(`Erro ao buscar detalhes do agendamento: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      return null;
    }
    
    // A regra de negócio principal foca na sala 1, pois ela guarda os dados financeiros e observações principais.
    // Usamos a sala 1 como base ou a primeira que retornar caso não haja sala 1.
    const baseAgendamento = data.find(a => a.sala === 1) || data[0];
    
    // Extrai e planifica os dados do colaborador navegando pelos relacionamentos de forma segura,
    // eliminando a necessidade de uma segunda chamada ao GET /colaboradores/:id
    const colabRaw: any = baseAgendamento.colaboradores || {};
    const historicoCargos = colabRaw.colaborador_cargo_unidade_setor || [];
    // Busca a alocação ativa ou pega a primeira como fallback
    const alocacaoAtual: any = historicoCargos.find((c: any) => c.ativo) || historicoCargos[0] || {};

    // Extrai empresa, unidade, função e setor a partir da hierarquia de relacionamentos
    const funcaoNome = alocacaoAtual.cargo_setor_unidade?.cargo?.nome || null;
    const setorNome = alocacaoAtual.cargo_setor_unidade?.unidade_setor?.setor?.nome || null;
    const unidadeNome = alocacaoAtual.cargo_setor_unidade?.unidade_setor?.unidade_cliente?.razao_social || null;
    const unidadeId = alocacaoAtual.cargo_setor_unidade?.unidade_setor?.unidade_cliente?.id || null;
    const empresaNome = alocacaoAtual.cargo_setor_unidade?.unidade_setor?.unidade_cliente?.empresa_cliente?.razao_social || null;
    const empresaId = alocacaoAtual.cargo_setor_unidade?.unidade_setor?.unidade_cliente?.empresa_cliente?.id || null;

    // Mapeia todos os IDs de todas as salas retornadas
    const agendamentosIds = data.map(a => a.id);

    // Monta o objeto do colaborador já planificado (mesmo formato do GET /colaboradores/:id)
    const colaboradorPlanificado = {
      id: colabRaw.id || null,
      nome: colabRaw.nome || null,
      cpf: colabRaw.cpf || null,
      data_nascimento: colabRaw.data_nascimento || null,
      sexo: colabRaw.sexo || null,
      funcao: funcaoNome,
      setor: setorNome,
      unidade: unidadeNome,
      unidade_id: unidadeId,
      empresa: empresaNome,
      empresa_id: empresaId,
    };

    // Monta o objeto de resposta completo antes de aplicar o filtro
    const respostaCompleta: Record<string, any> = {
      ...baseAgendamento,
      colaboradores: colaboradorPlanificado,
      agendamentos_ids: agendamentosIds, // Array de IDs de todas as salas para uso no frontend
    };

    // Se nenhum campo foi solicitado, retorna o objeto inteiro sem filtro
    if (!fields || fields.length === 0) {
      return respostaCompleta;
    }

    // Aplica o filtro: monta um novo objeto apenas com os campos solicitados
    const respostaFiltrada: Record<string, any> = {};
    for (const campo of fields) {
      // Só inclui o campo se ele existir no objeto de resposta completo
      if (campo in respostaCompleta) {
        respostaFiltrada[campo] = respostaCompleta[campo];
      }
    }

    // Retorna o objeto filtrado com apenas os campos desejados pelo cliente
    return respostaFiltrada;
  }

  async findExamesByColaboradorAndAgendamentos(colaborador_id: string, agendamentos_ids: string) {
    const supabase = this.supabaseService.getClient();

    // Transforma a string "100,101,91" em um array numérico [100, 101, 91]
    const idsArray = agendamentos_ids.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id));

    // Log para confirmar quais IDs chegaram e foram parseados
    this.logger.log(`[SERVICE] IDs parseados para busca de exames: ${JSON.stringify(idsArray)}`);

    // Busca os exames_feitos usando apenas a FK agendamento_id (os IDs jão garantem o vínculo com o colaborador)
    const { data: exames, error: examesErr, status, statusText } = await supabase
      .from('exames_feitos')
      .select(`
        id,
        proced_id,
        agendamento_id,
        procedimentos (
          nome
        )
      `)
      .in('agendamento_id', idsArray);

    // Log para mostrar resultado bruto que veio do banco
    this.logger.log(`[SERVICE] HTTP Status: ${status} ${statusText}`);
    this.logger.log(`[SERVICE] Resultado bruto do banco: ${JSON.stringify(exames)}`);
    if (examesErr) this.logger.error(`[SERVICE] Erro Supabase: ${JSON.stringify(examesErr)}`);

    if (examesErr) {
      this.logger.error(`Erro ao buscar exames feitos: ${examesErr.message}`);
      throw new InternalServerErrorException(`Erro ao buscar exames feitos: ${examesErr.message}`);
    }

    return exames || [];
  }

  // Método assíncrono para atualizar dados parciais ou exames de um agendamento agrupado por colaborador e data
  async updateByColaboradorAndDate(
    // Recebe o UUID do colaborador como identificador
    colaborador_id: string,
    // Recebe a data de atendimento atual do agendamento
    data_atendimento: string,
    // Recebe o payload com os campos a serem alterados
    payload: any
  ) {
    // Registra no log o início do processo de atualização com os parâmetros recebidos
    this.logger.log(`Atualizando agendamento para o colaborador: ${colaborador_id} na data: ${data_atendimento}`);
    // Obtém o cliente do Supabase
    const supabase = this.supabaseService.getClient();

    // Desestrutura o payload para separar a lista de exames dos demais campos
    const {
      // Extrai o array de exames (IDs dos procedimentos)
      exames,
      // Agrupa todos os outros campos a serem atualizados
      ...camposUpdate
    } = payload;

    // Se nenhum campo de atualização e nem a lista de exames foram enviados
    if (Object.keys(camposUpdate).length === 0 && !exames) {
      // Retorna uma mensagem informativa indicando que nada foi alterado
      return { message: 'Nenhuma alteração enviada' };
    }

    // Busca os registros atuais do agendamento para validar existência e usar como fallback
    const { data: agendamentosAtuais, error: errGetAtuais } = await supabase
      // Acessa a tabela de agendamentos
      .from('agendamentos')
      // Seleciona todas as colunas
      .select('*')
      // Filtra pelo UUID do colaborador
      .eq('colaborador_id', colaborador_id)
      // Filtra pela data de atendimento atual
      .eq('data_atendimento', data_atendimento);

    // Se houve erro ao buscar os registros atuais
    if (errGetAtuais) {
      // Registra o erro no log
      this.logger.error(`Erro ao buscar dados atuais do agendamento: ${errGetAtuais.message}`);
      // Lança uma exceção detalhando a falha
      throw new InternalServerErrorException(`Erro ao buscar dados atuais do agendamento: ${errGetAtuais.message}`);
    }

    if (!agendamentosAtuais || agendamentosAtuais.length === 0) {
      this.logger.error(`Nenhum agendamento encontrado! Params -> colaborador_id: ${colaborador_id}, data_atendimento: ${data_atendimento}`);
      // Lança uma exceção indicando que o agendamento não existe
      throw new NotFoundException(`Nenhum agendamento encontrado para colaborador_id: ${colaborador_id} e data: ${data_atendimento}.`);
    }

    // Identifica o agendamento da sala 1 como base ou pega o primeiro disponível
    const baseAgendamento = agendamentosAtuais.find(a => a.sala === 1) || agendamentosAtuais[0];

    // Verifica e atualiza os vínculos de cargo e setor, caso o usuário tenha alterado esses dados no formulário
    if (camposUpdate.unidade_id && camposUpdate.setor_id && camposUpdate.funcao_id) {
      await this.atualizarAlocacaoColaborador(supabase, colaborador_id, camposUpdate.unidade_id, camposUpdate.setor_id, camposUpdate.funcao_id);
    }

    // Cria um objeto vazio para guardar as propriedades globais que afetam todas as salas
    const camposGerais: any = {};
    if (camposUpdate.data_atendimento !== undefined) camposGerais.data_atendimento = camposUpdate.data_atendimento;
    if (camposUpdate.tipo !== undefined) camposGerais.tipo = camposUpdate.tipo;
    if (camposUpdate.unidade !== undefined) camposGerais.unidade = camposUpdate.unidade;
    if (camposUpdate.status !== undefined) camposGerais.status = camposUpdate.status;
    if (camposUpdate.prioridade !== undefined) camposGerais.prioridade = camposUpdate.prioridade;
    
    if (camposUpdate.compareceu !== undefined) {
      camposGerais.compareceu = camposUpdate.compareceu;
      if (camposUpdate.compareceu === false) {
        camposGerais.hora_chegada = null;
        
        // Remove hora_chegada também na fila_agendamentos
        try {
          const inicioDia = `${data_atendimento}T00:00:00.000Z`;
          const fimDia = `${data_atendimento}T23:59:59.999Z`;

          const { data: ticketData } = await supabase
            .from('ticket_chamadas')
            .select('id_ticket')
            .eq('id_colaborador', colaborador_id)
            .gte('created_at', inicioDia)
            .lte('created_at', fimDia)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (ticketData?.id_ticket) {
            await supabase
              .from('fila_agendamentos')
              .update({ hora_chegada: null })
              .eq('id_ticket', ticketData.id_ticket);
          }
        } catch (e) {
          this.logger.warn(`Não foi possível limpar hora_chegada na fila_agendamentos: ${e.message}`);
        }
      } else if (camposUpdate.compareceu === true && camposUpdate.hora_chegada) {
        // Se compareceu virou true e foi enviada uma hora_chegada
        camposGerais.hora_chegada = camposUpdate.hora_chegada;
        
        try {
          const inicioDia = `${data_atendimento}T00:00:00.000Z`;
          const fimDia = `${data_atendimento}T23:59:59.999Z`;

          const { data: ticketData } = await supabase
            .from('ticket_chamadas')
            .select('id_ticket')
            .eq('id_colaborador', colaborador_id)
            .gte('created_at', inicioDia)
            .lte('created_at', fimDia)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (ticketData?.id_ticket) {
            await supabase
              .from('fila_agendamentos')
              .update({ hora_chegada: camposUpdate.hora_chegada })
              .eq('id_ticket', ticketData.id_ticket);
          }
        } catch (e) {
          this.logger.warn(`Não foi possível setar hora_chegada na fila_agendamentos: ${e.message}`);
        }
      }
    } else if (camposUpdate.hora_chegada) {
      // Se apenas a hora_chegada foi enviada e o compareceu não mudou (já deve estar true)
      camposGerais.hora_chegada = camposUpdate.hora_chegada;
      
      try {
        const inicioDia = `${data_atendimento}T00:00:00.000Z`;
        const fimDia = `${data_atendimento}T23:59:59.999Z`;

        const { data: ticketData } = await supabase
          .from('ticket_chamadas')
          .select('id_ticket')
          .eq('id_colaborador', colaborador_id)
          .gte('created_at', inicioDia)
          .lte('created_at', fimDia)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (ticketData?.id_ticket) {
          await supabase
            .from('fila_agendamentos')
            .update({ hora_chegada: camposUpdate.hora_chegada })
            .eq('id_ticket', ticketData.id_ticket);
        }
      } catch (e) {
        this.logger.warn(`Não foi possível setar hora_chegada na fila_agendamentos: ${e.message}`);
      }
    }

    // Cria um objeto vazio para os campos que pertencem estritamente à sala 1 (recepção/financeiro)
    const camposSala1: any = {};
    if (camposUpdate.aso_qtd_cobrar !== undefined) camposSala1.aso_qtd_cobrar = camposUpdate.aso_qtd_cobrar;
    if (camposUpdate.rac_qtd_cobrar !== undefined) camposSala1.rac_qtd_cobrar = camposUpdate.rac_qtd_cobrar;
    if (camposUpdate.obs_agendamento !== undefined) camposSala1.obs_agendamento = camposUpdate.obs_agendamento;
    if (camposUpdate.observacoes !== undefined) camposSala1.observacoes = camposUpdate.observacoes;
    if (camposUpdate.observacoes_laboratorial !== undefined) camposSala1.observacoes_laboratorial = camposUpdate.observacoes_laboratorial;
    if (camposUpdate.preco !== undefined) camposSala1.valor = camposUpdate.preco;
    if (camposUpdate.valor !== undefined) camposSala1.valor = camposUpdate.valor;
    if (camposUpdate.metodo_pagamento !== undefined) camposSala1.metodo_pagamento = camposUpdate.metodo_pagamento;
    if (camposUpdate.aso_liberado !== undefined) camposSala1.aso_liberado = camposUpdate.aso_liberado;
    if (camposUpdate.data_pagamento !== undefined) camposSala1.data_pagamento = camposUpdate.data_pagamento;
    
    // Processamento da imagem foto_obs
    if (camposUpdate.foto_obs !== undefined) {
      if (camposUpdate.foto_obs && camposUpdate.foto_obs.startsWith('data:image')) {
        const urlSegura = `${colaborador_id}_${data_atendimento}`.replace(/[^a-zA-Z0-9_-]/g, '_');
        camposSala1.foto_obs = await this.uploadFotoObs(supabase, camposUpdate.foto_obs, urlSegura);
      } else {
        camposSala1.foto_obs = camposUpdate.foto_obs;
      }
    }

    // Para evitar o erro "tuple to be updated was already modified by an operation triggered by the current command",
    // faremos a atualização em duas etapas separadas garantindo que a mesma linha não seja afetada duas vezes.
    
    // 1. Atualiza TODAS AS SALAS EXCETO A SALA 1 com camposGerais
    if (Object.keys(camposGerais).length > 0) {
      const { error: errGerais } = await supabase
        .from('agendamentos')
        .update(camposGerais)
        .eq('colaborador_id', colaborador_id)
        .eq('data_atendimento', data_atendimento)
        .neq('sala', 1);

      if (errGerais) {
        throw new InternalServerErrorException(`Erro ao atualizar campos gerais nas salas: ${errGerais.message}`);
      }
    }

    // 2. Atualiza APENAS A SALA 1 juntando camposGerais + camposSala1
    const updateSala1 = { ...camposGerais, ...camposSala1 };
    if (Object.keys(updateSala1).length > 0) {
      const { error: errSala1 } = await supabase
        .from('agendamentos')
        .update(updateSala1)
        .eq('colaborador_id', colaborador_id)
        .eq('data_atendimento', data_atendimento)
        .eq('sala', 1);

      if (errSala1) {
        throw new InternalServerErrorException(`Erro ao atualizar campos da Sala 1: ${errSala1.message}`);
      }
    }

    // Se um array de exames foi fornecido para atualizar a lista de procedimentos
    if (exames && Array.isArray(exames)) {
      // Busca novamente os agendamentos já atualizados para refletir qualquer mudança de data
      const { data: agendamentosExistentes, error: errExistentes } = await supabase
        // Define a tabela agendamentos
        .from('agendamentos')
        // Seleciona todos os dados para ter acesso aos campos do baseAgendamento
        .select('*')
        // Filtra pelo colaborador
        .eq('colaborador_id', colaborador_id)
        // Usa a data atualizada (ou a original se não mudou)
        .eq('data_atendimento', camposGerais.data_atendimento || data_atendimento);

      // Se houver erro ao ler os agendamentos ativos
      if (errExistentes) {
        // Lança uma exceção
        throw new InternalServerErrorException(`Erro ao buscar agendamentos existentes para atualizar exames: ${errExistentes.message}`);
      }

      // Busca os detalhes e categorias dos novos exames enviados
      const { data: procedimentos, error: errProc } = await supabase
        // Define a tabela procedimentos
        .from('procedimentos')
        // Seleciona ID e categoria
        .select('id, idcategoria')
        // Filtra apenas os IDs presentes no payload
        .in('id', exames);

      // Se houver erro ao buscar os procedimentos
      if (errProc) {
        // Lança uma exceção
        throw new InternalServerErrorException(`Erro ao buscar lista de procedimentos (exames) informados: ${errProc.message}`);
      }

      // Obtém o mapa de categorias por sala
      const mapeamento = this.salasService.getMapeamentoCategorias();
      // Inicializa o objeto para agrupar exames por sala
      const procedimentosPorSala: Record<number, number[]> = {};

      // Itera por cada procedimento encontrado
      procedimentos?.forEach(proc => {
        // Obtém a sala correspondente baseado no mapa de categorias
        const sala = mapeamento[proc.idcategoria as keyof typeof mapeamento];
        // Se a categoria mapear para uma sala válida
        if (sala) {
          // Se o array daquela sala ainda não existe, cria ele
          if (!procedimentosPorSala[sala]) procedimentosPorSala[sala] = [];
          // Adiciona o ID do procedimento ao grupo daquela sala
          procedimentosPorSala[sala].push(proc.id);
        }
      });

      // Garante que a Sala 1 sempre exista na lista para evitar exclusão acidental da sala de recepção
      if (!procedimentosPorSala[1]) {
        // Inicializa o array vazio para a sala 1
        procedimentosPorSala[1] = [];
      }

      // Cria um mapa local mapeando o ID da sala para o ID do agendamento (linha do banco)
      const agendamentosPorSalaExistentes = new Map<number, number>();
      // Preenche o mapa com os dados buscados do banco
      agendamentosExistentes?.forEach(a => {
        // Vincula a sala com seu respectivo ID de agendamento
        agendamentosPorSalaExistentes.set(a.sala, a.id);
      });

      // Filtra as salas requeridas nos novos exames que ainda não possuem linha no banco
      const novasSalasParaCriar = Object.keys(procedimentosPorSala)
        // Converte as chaves de string para number
        .map(Number)
        // Filtra apenas as que não existem no nosso mapa
        .filter(sala => !agendamentosPorSalaExistentes.has(sala));

      // Se houver novas salas a serem criadas
      if (novasSalasParaCriar.length > 0) {
        // Prepara os dados de insert para cada nova sala
        const insertsNovasSalas = novasSalasParaCriar.map(salaNum => ({
          // Define o colaborador
          colaborador_id,
          // Define a sala correspondente
          sala: salaNum,
          // Status inicial pendente
          status: 'pendente',
          // Repassa o compareceu caso o usuário esteja marcando presença no mesmo momento
          compareceu: camposGerais.compareceu ?? baseAgendamento.compareceu ?? false,
          // Define a data de atendimento
          data_atendimento: camposGerais.data_atendimento || data_atendimento,
          // Mantém o tipo herdado do agendamento original
          tipo: camposGerais.tipo || baseAgendamento.tipo,
          // Mantém a unidade herdada do agendamento original
          unidade: camposGerais.unidade ?? baseAgendamento.unidade,
        }));

        // Insere os novos agendamentos das novas salas
        const { data: novasSalasCriadas, error: errNovasSalas } = await supabase
          // Define a tabela
          .from('agendamentos')
          // Envia a lista para inserção
          .insert(insertsNovasSalas)
          // Solicita o retorno do ID e Sala gerados
          .select('id, sala');

        // Se ocorrer erro na inserção das salas
        if (errNovasSalas) {
          // Lança exceção explicativa
          throw new InternalServerErrorException(`Erro ao criar novos agendamentos de sala: ${errNovasSalas.message}`);
        }

        // Adiciona as salas recém-criadas ao nosso mapa de relacionamento
        novasSalasCriadas?.forEach(ns => {
          // Salva o novo ID no mapa
          agendamentosPorSalaExistentes.set(ns.sala, ns.id);
        });
      }

      // Identifica salas antigas que não possuem mais nenhum exame associado (e não são a sala 1)
      const salasParaRemover = Array.from(agendamentosPorSalaExistentes.keys())
        // Filtra salas que não sejam a 1 e que não estejam no novo agrupamento
        .filter(sala => sala !== 1 && !procedimentosPorSala[sala]);

      // Cria uma lista contendo todos os IDs de agendamento do grupo
      const todosIdsAgendamentos = Array.from(agendamentosPorSalaExistentes.values());
      
      // Deleta todos os exames vinculados anteriormente a esses agendamentos em exames_feitos
      // Vamos deletar um por um para garantir que nenhuma constraint silenciosa de batch do supabase falhe
      if (todosIdsAgendamentos.length > 0) {
        for (const idAgendamento of todosIdsAgendamentos) {
          const { error: errDelExames } = await supabase
            .from('exames_feitos')
            .delete()
            .eq('agendamento_id', idAgendamento);
            
          if (errDelExames) {
            throw new InternalServerErrorException(`Erro ao limpar exames antigos do agendamento ${idAgendamento}: ${errDelExames.message}`);
          }
        }
      }

      // Se houver salas que ficaram vazias e precisam ser removidas
      if (salasParaRemover.length > 0) {
        // Mapeia as salas vazias para seus respectivos IDs no banco de dados
        const idsParaRemover = salasParaRemover.map(sala => agendamentosPorSalaExistentes.get(sala)!);
        // Deleta as linhas das salas obsoletas na tabela agendamentos
        for (const idToRemove of idsParaRemover) {
          const { error: errDelAgend } = await supabase
            .from('agendamentos')
            .delete()
            .eq('id', idToRemove);

          // Se houver erro ao deletar as salas obsoletas
          if (errDelAgend) {
            // Lança exceção com detalhes de qual ID falhou
            throw new InternalServerErrorException(`Erro ao remover sala vazia (ID: ${idToRemove}): ${errDelAgend.message}`);
          }
        }

        // Itera removendo as salas apagadas também do nosso mapa em memória
        salasParaRemover.forEach(sala => {
          // Deleta a entrada do mapa
          agendamentosPorSalaExistentes.delete(sala);
        });
      }



      // Prepara os novos inserts na tabela exames_feitos
      const insertsExamesFeitos: any[] = [];
      // Itera por cada sala e sua respectiva lista de IDs de exames
      Object.entries(procedimentosPorSala).forEach(([salaStr, procs]) => {
        // Converte a sala para number
        const salaNum = Number(salaStr);
        // Obtém o ID do agendamento relacionado a essa sala
        const agendamentoId = agendamentosPorSalaExistentes.get(salaNum);
        
        // Se a sala possui um agendamento válido cadastrado
        if (agendamentoId) {
          // Itera sobre cada procedimento da sala
          procs.forEach(proc_id => {
            // Adiciona o insert na lista
            insertsExamesFeitos.push({
              // Define o UUID do colaborador
              colaborador_uuid: colaborador_id,
              // Vincula ao ID do agendamento específico daquela sala
              agendamento_id: agendamentoId,
              // Define o ID do procedimento do exame
              proced_id: proc_id
            });
          });
        }
      });

      // Se houver novos vínculos de exames para inserir
      if (insertsExamesFeitos.length > 0) {
        // Insere os dados na tabela exames_feitos
        const { error: errInsertExames } = await supabase
          // Define a tabela
          .from('exames_feitos')
          // Insere a lista formatada
          .insert(insertsExamesFeitos);

        // Se erro ao inserir os novos exames
        if (errInsertExames) {
          // Lança exceção explicativa
          throw new InternalServerErrorException(`Erro ao re-inserir a lista de exames atualizada: ${errInsertExames.message}`);
        }
      }
    }

    // Retorna mensagem de sucesso na operação
    return { message: 'Agendamento atualizado com sucesso' };
  }

  // Método assíncrono para deletar definitivamente um agendamento inteiro (todas as salas) agrupado por colaborador e data
  async deleteByColaboradorAndDate(
    // Recebe o UUID do colaborador
    colaborador_id: string,
    // Recebe a data do atendimento
    data_atendimento: string
  ) {
    // Registra o início do processo de exclusão no log
    this.logger.log(`Deletando agendamento para o colaborador: ${colaborador_id} na data: ${data_atendimento}`);
    // Obtém o cliente do Supabase
    const supabase = this.supabaseService.getClient();

    // 1. Busca os IDs de todos os agendamentos desse grupo para poder limpar os exames
    const { data: agendamentos, error: errGet } = await supabase
      // Acessa a tabela agendamentos
      .from('agendamentos')
      // Seleciona os IDs
      .select('id')
      // Filtra pelo colaborador
      .eq('colaborador_id', colaborador_id)
      // Filtra pela data
      .eq('data_atendimento', data_atendimento);

    // Se ocorrer erro na busca
    if (errGet) {
      // Registra o erro e lança exceção
      this.logger.error(`Erro ao buscar agendamentos para exclusão: ${errGet.message}`);
      throw new Error(`Erro ao buscar agendamentos para exclusão: ${errGet.message}`);
    }

    // Se não houver nenhum agendamento, apenas retorna sucesso (já está deletado ou não existe)
    if (!agendamentos || agendamentos.length === 0) {
      return { message: 'Nenhum agendamento encontrado para excluir' };
    }

    // Extrai o array de IDs encontrados
    const ids = agendamentos.map(a => a.id);

    // 2. Remove todos os vínculos de exames feitos para evitar violação de chave estrangeira (se não houver cascade)
    const { error: errDelExames } = await supabase
      // Tabela exames_feitos
      .from('exames_feitos')
      // Ação de exclusão
      .delete()
      // Filtra pelos IDs dos agendamentos localizados
      .in('agendamento_id', ids);

    // Se falhar na remoção dos exames
    if (errDelExames) {
      // Registra o erro e lança exceção
      this.logger.error(`Erro ao excluir exames vinculados: ${errDelExames.message}`);
      throw new Error(`Erro ao excluir exames vinculados: ${errDelExames.message}`);
    }

    // 3. Remove definitivamente as linhas de agendamentos
    const { error: errDelAgendamentos } = await supabase
      // Tabela agendamentos
      .from('agendamentos')
      // Ação de exclusão
      .delete()
      // Filtra pelos IDs localizados
      .in('id', ids);

    // Se ocorrer erro ao excluir os agendamentos principais
    if (errDelAgendamentos) {
      // Lança exceção detalhando a falha
      this.logger.error(`Erro ao excluir agendamentos: ${errDelAgendamentos.message}`);
      throw new Error(`Erro ao excluir agendamentos: ${errDelAgendamentos.message}`);
    }

    // Retorna a confirmação de sucesso da deleção
    return { message: 'Agendamento e exames excluídos com sucesso' };
  }


  // Método assíncrono para atualizar ou remover a URL do ASO na sala 1
  async updateAso(colaborador_id: string, data_atendimento: string, payload: { aso_file?: string; remove?: boolean }) {
    this.logger.log(`Atualizando ASO para o colaborador: ${colaborador_id} na data: ${data_atendimento}`);
    const supabase = this.supabaseService.getClient();

    let asoUrl = null;

    if (payload.remove) {
      asoUrl = null;
    } else if (payload.aso_file && payload.aso_file.startsWith('data:')) {
      const urlSegura = `${colaborador_id}_${data_atendimento}`.replace(/[^a-zA-Z0-9_-]/g, '_');
      asoUrl = await this.uploadAsoFile(supabase, payload.aso_file, urlSegura);
    } else if (payload.aso_file && payload.aso_file.startsWith('http')) {
      asoUrl = payload.aso_file;
    } else {
      return { message: 'Nenhuma alteração realizada no ASO' };
    }

    const { error } = await supabase
      .from('agendamentos')
      .update({ aso_url: asoUrl })
      .eq('colaborador_id', colaborador_id)
      .eq('data_atendimento', data_atendimento)
      .eq('sala', 1);

    if (error) {
      this.logger.error(`Erro ao atualizar ASO: ${error.message}`);
      throw new Error(`Erro ao atualizar ASO: ${error.message}`);
    }

    return { message: 'ASO atualizado com sucesso', aso_url: asoUrl };
  }

  // Método assíncrono para atualizar a data do aso_liberado na sala 1
  async liberarAso(colaborador_id: string, data_atendimento: string, aso_liberado: string | null) {
    this.logger.log(`Atualizando liberação de ASO para o colaborador: ${colaborador_id} na data: ${data_atendimento}`);
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase
      .from('agendamentos')
      .update({ aso_liberado })
      .eq('colaborador_id', colaborador_id)
      .eq('data_atendimento', data_atendimento)
      .eq('sala', 1);

    if (error) {
      this.logger.error(`Erro ao atualizar data de liberação do ASO: ${error.message}`);
      throw new Error(`Erro ao atualizar data de liberação do ASO: ${error.message}`);
    }

    return { message: 'Data de liberação do ASO atualizada com sucesso', aso_liberado };
  }

  // Interface para o novo payload rico do front-end
  async create(payload: { 
    colaborador_id?: string; 
    nome_avulso?: string;
    cpf?: string;
    data_nascimento?: string;
    sexo?: string;
    funcao?: string;
    funcao_id?: number;
    setor?: string;
    setor_id?: number;
    empresa?: string;
    empresa_id?: number;
    tipo?: string;
    unidade?: number;
    unidade_id?: number;
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
    hora_chegada?: string | null;
  }) {
    this.logger.log(`Criando agendamento para o colaborador ${payload.colaborador_id || 'Avulso'}`);
    
    const supabase = this.supabaseService.getClient();
    
    // Define a data do atendimento com base no que foi enviado ou como hoje
    const dataAtendimento = payload.data_atendimento || new Date().toISOString().split('T')[0];

    // Validação contra duplicação silenciosa de agendamentos
    if (payload.colaborador_id) {
      const { data: agendamentoDuplicado, error: errDuplicado } = await supabase
        .from('agendamentos')
        .select('id')
        .eq('colaborador_id', payload.colaborador_id)
        .eq('data_atendimento', dataAtendimento)
        .limit(1);

      if (errDuplicado) {
        this.logger.error(`Erro ao verificar duplicação: ${errDuplicado.message}`);
        throw new Error(`Erro ao verificar duplicação: ${errDuplicado.message}`);
      }

      if (agendamentoDuplicado && agendamentoDuplicado.length > 0) {
        throw new Error(`Já existe um agendamento para este colaborador na data ${dataAtendimento}. Utilize a edição para modificar.`);
      }
    }

    // 1. Buscar os procedimentos para descobrir as categorias de cada um
    const { data: procedimentos, error: errProc } = await supabase
      .from('procedimentos')
      .select('id, idcategoria')
      .in('id', payload.exames);
      
    if (errProc) {
      this.logger.error(`Erro ao buscar procedimentos: ${errProc.message}`);
      throw new Error(`Erro ao buscar procedimentos: ${errProc.message}`);
    }
    
    // 2. Resgatar o mapeamento central de Categorias -> Salas
    const mapeamento = this.salasService.getMapeamentoCategorias();
    
    // 3. Agrupar os IDs de procedimentos por Sala
    const procedimentosPorSala: Record<number, number[]> = {};
    
    procedimentos?.forEach(proc => {
      // Faz o casting da chave, se a categoria existir no mapa, retorna a sala
      const sala = mapeamento[proc.idcategoria as keyof typeof mapeamento];
      
      // Se a sala existir, agrupa.
      // Segundo a regra estabelecida: "não criamos nesse caso" para exames sem sala
      if (sala) {
        if (!procedimentosPorSala[sala]) procedimentosPorSala[sala] = [];
        procedimentosPorSala[sala].push(proc.id);
      }
    });

    // Garante que a Sala 1 sempre exista, independente de ter exames mapeados para ela ou não
    if (!procedimentosPorSala[1]) {
      procedimentosPorSala[1] = [];
    }
    
    // 3.5 Processar upload de foto, caso exista um base64
    
    // 3.5 Processar upload de foto, caso exista um base64
    let fotoUrl: string | null = null;
    if (payload.foto_obs && payload.foto_obs.startsWith('data:image')) {
      const colabOrAvulso = payload.colaborador_id || 'avulso';
      const urlSegura = `${colabOrAvulso}_${dataAtendimento}`.replace(/[^a-zA-Z0-9_-]/g, '_');
      fotoUrl = await this.uploadFotoObs(supabase, payload.foto_obs, urlSegura);
    } else {
      fotoUrl = payload.foto_obs || null;
    }

    // Monta o array de inserts para criar uma linha na tabela agendamentos para CADA sala necessária
    // Mapeando os campos do payload para as respectivas colunas no banco de dados
    const insertsAgendamentos = Object.keys(procedimentosPorSala).map(salaStr => {
      const salaNum = Number(salaStr);
      return {
        colaborador_id: payload.colaborador_id || null,
        sala: salaNum,
        status: 'pendente',
        data_atendimento: dataAtendimento,
        tipo: payload.tipo || null,
        unidade: payload.unidade ?? null,
        compareceu: payload.compareceu ?? false,
        prioridade: payload.prioridade ?? false,
        hora_chegada: payload.hora_chegada || null,
        // Campos de faturamento e observações vão EXCLUSIVAMENTE para a sala 1
        aso_qtd_cobrar: salaNum === 1 ? (payload.aso_qtd_cobrar ?? null) : null,
        rac_qtd_cobrar: salaNum === 1 ? (payload.rac_qtd_cobrar ?? null) : null,
        obs_agendamento: salaNum === 1 ? (payload.obs_agendamento || null) : null,
        observacoes: salaNum === 1 ? (payload.observacoes || null) : null,
        observacoes_laboratorial: salaNum === 1 ? (payload.observacoes_laboratorial || null) : null,
        valor: salaNum === 1 ? (payload.preco ?? payload.valor ?? null) : null,
        metodo_pagamento: salaNum === 1 ? (payload.metodo_pagamento || null) : null,
        data_pagamento: salaNum === 1 ? (payload.data_pagamento || null) : null,
        aso_liberado: salaNum === 1 ? (payload.aso_liberado || null) : null,
        foto_obs: salaNum === 1 ? fotoUrl : null,
      };
    });
    
    // 4. Salvar os Agendamentos
    // Usamos .select() para o Supabase retornar os registros inseridos (com os IDs gerados)
    const { data: agendamentosCriados, error: errAgend } = await supabase
      .from('agendamentos')
      .insert(insertsAgendamentos)
      .select('id, sala');
      
    if (errAgend) {
      this.logger.error(`Erro ao criar agendamentos: ${errAgend.message}`);
      throw new Error(`Erro ao criar agendamentos: ${errAgend.message}`);
    }
    
    // Atualiza a alocação de cargo do colaborador, caso os IDs tenham sido informados
    if (payload.colaborador_id && payload.unidade_id && payload.setor_id && payload.funcao_id) {
      try {
        await this.atualizarAlocacaoColaborador(supabase, payload.colaborador_id, payload.unidade_id, payload.setor_id, payload.funcao_id);
      } catch (err) {
        this.logger.warn(`Aviso: não foi possível atualizar alocação do colaborador ${payload.colaborador_id}: ${err.message}`);
      }
    }
    
    // 5. Preparar inserts para a tabela exames_feitos (vinculando procedimento -> colaborador -> agendamento específico)
    const insertsExamesFeitos: any[] = [];
    
    agendamentosCriados?.forEach(agendamento => {
      // Para o agendamento desta sala, pegamos os procedimentos que rotearam pra cá
      const procs = procedimentosPorSala[agendamento.sala];
      
      procs.forEach(proc_id => {
        insertsExamesFeitos.push({
          colaborador_uuid: payload.colaborador_id,
          agendamento_id: agendamento.id,
          proced_id: proc_id
        });
      });
    });
    
    // 6. Salvar os vínculos na tabela exames_feitos
    if (insertsExamesFeitos.length > 0) {
      const { error: errExames } = await supabase
        .from('exames_feitos')
        .insert(insertsExamesFeitos);
        
      if (errExames) {
        this.logger.error(`Erro ao vincular exames_feitos: ${errExames.message}`);
        throw new Error(`Erro ao vincular exames_feitos: ${errExames.message}`);
      }
    }
    
    this.logger.log(`Sucesso: ${agendamentosCriados?.length} agendamentos criados e ${insertsExamesFeitos.length} exames vinculados.`);
    
    return {
      message: 'Agendamentos e exames registrados com sucesso',
      agendamentos: agendamentosCriados
    };
  }

  // Helper para atualizar o vínculo (job) do colaborador
  private async atualizarAlocacaoColaborador(supabase: any, colaboradorId: string, unidadeId: number, setorId: number, cargoId: number) {
    // 1. Procurar ou criar unidade_setor
    let unidadeSetorId: number;
    const { data: usData } = await supabase
      .from('unidade_setor')
      .select('id')
      .eq('unidade_id', unidadeId)
      .eq('setor_id', setorId)
      .maybeSingle();

    if (usData) {
      unidadeSetorId = usData.id;
    } else {
      const { data: newUsData, error: errNewUs } = await supabase
        .from('unidade_setor')
        .insert({ unidade_id: unidadeId, setor_id: setorId })
        .select('id').single();
      if (errNewUs) throw new InternalServerErrorException(`Erro ao criar unidade_setor: ${errNewUs.message}`);
      unidadeSetorId = newUsData.id;
    }

    // 2. Procurar ou criar cargo_setor_unidade
    let cargoSetorUnidadeId: number;
    const { data: csuData } = await supabase
      .from('cargo_setor_unidade')
      .select('id')
      .eq('unidade_setor_id', unidadeSetorId)
      .eq('cargo_id', cargoId)
      .maybeSingle();

    if (csuData) {
      cargoSetorUnidadeId = csuData.id;
    } else {
      const { data: newCsuData, error: errNewCsu } = await supabase
        .from('cargo_setor_unidade')
        .insert({ unidade_setor_id: unidadeSetorId, cargo_id: cargoId })
        .select('id').single();
      if (errNewCsu) throw new InternalServerErrorException(`Erro ao criar cargo_setor_unidade: ${errNewCsu.message}`);
      cargoSetorUnidadeId = newCsuData.id;
    }

    // 3. Verificar alocação atual
    const { data: alocacoesAtivas } = await supabase
      .from('colaborador_cargo_unidade_setor')
      .select('id, cargo_unidade_setor_id')
      .eq('colaborador_id', colaboradorId)
      .eq('ativo', true);

    const alocacaoAtual = alocacoesAtivas && alocacoesAtivas.length > 0 ? alocacoesAtivas[0] : null;

    if (!alocacaoAtual || alocacaoAtual.cargo_unidade_setor_id !== cargoSetorUnidadeId) {
      if (alocacaoAtual) {
        await supabase
          .from('colaborador_cargo_unidade_setor')
          .update({ ativo: false, data_fim: new Date().toISOString() })
          .eq('id', alocacaoAtual.id);
      }
      
      await supabase
        .from('colaborador_cargo_unidade_setor')
        .insert({
          colaborador_id: colaboradorId,
          cargo_unidade_setor_id: cargoSetorUnidadeId,
          ativo: true,
          data_inicio: new Date().toISOString()
        });
    }
  }

  async updateHoraChegada(colaborador_id: string, data_atendimento: string, hora_chegada: string | null) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('agendamentos')
      .update({ hora_chegada })
      .eq('colaborador_id', colaborador_id)
      .eq('data_atendimento', data_atendimento);

    if (error) {
      this.logger.error(`Erro ao atualizar hora de chegada: ${error.message}`);
      throw new InternalServerErrorException(`Erro ao atualizar hora de chegada: ${error.message}`);
    }

    // Tenta atualizar também na fila_agendamentos se o ticket já existir
    try {
      // 1. Busca o id_ticket mais recente do colaborador gerado no dia do atendimento
      const inicioDia = `${data_atendimento}T00:00:00.000Z`;
      const fimDia = `${data_atendimento}T23:59:59.999Z`;

      const { data: ticketData } = await supabase
        .from('ticket_chamadas')
        .select('id_ticket')
        .eq('id_colaborador', colaborador_id)
        .gte('created_at', inicioDia)
        .lte('created_at', fimDia)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (ticketData?.id_ticket) {
        // 2. Atualiza a hora_chegada na fila correspondente
        await supabase
          .from('fila_agendamentos')
          .update({ hora_chegada })
          .eq('id_ticket', ticketData.id_ticket);
      }
    } catch (e) {
      this.logger.warn(`Não foi possível atualizar hora_chegada na fila_agendamentos: ${e.message}`);
    }

    return { message: 'Hora de chegada atualizada com sucesso', hora_chegada };
  }
}
