// Importa o decorator Injectable do NestJS para marcar a classe como um serviço
import { Injectable, Logger } from '@nestjs/common';
// Importa o SupabaseService para realizar consultas no banco de dados
import { SupabaseService } from '../../supabase/supabase.service';
// Importa o serviço de Salas para rotear os procedimentos
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

  // Método assíncrono para buscar agendamentos com paginação e filtro de datas e sala
  async findAll(page: number, limit: number, dataInicial?: string, dataFinal?: string, sala?: number) {
    // Registra no log que a busca por agendamentos foi iniciada com os parâmetros informados
    this.logger.log(`Buscando agendamentos - Página: ${page}, Limite: ${limit}, Inicial: ${dataInicial}, Final: ${dataFinal}, Sala: ${sala}`);

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

  // Interface para o novo payload rico do front-end
  async create(payload: { 
    colaborador_id?: string; 
    nome_avulso?: string;
    avulso?: boolean;
    cpf?: string;
    data_nascimento?: string;
    sexo?: string;
    funcao?: string;
    setor?: string;
    unidade?: number;
    aso_qtd_cobrar?: number;
    rac_qtd_cobrar?: number;
    exames: number[];
    obs_agendamento?: string;
    observacoes?: string;
    observacoes_laboratorial?: string;
  }) {
    this.logger.log(`Criando agendamento para o colaborador ${payload.colaborador_id || 'Avulso'}`);
    
    const supabase = this.supabaseService.getClient();
    
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
    
    // Define a data do atendimento como hoje (já que não vem mais do payload)
    const dataAtendimento = new Date().toISOString().split('T')[0];
    
    // Monta o array de inserts para criar uma linha na tabela agendamentos para CADA sala necessária
    // Mapeando os campos do payload para as respectivas colunas no banco de dados
    const insertsAgendamentos = Object.keys(procedimentosPorSala).map(salaStr => ({
      colaborador_id: payload.colaborador_id || null,
      sala: Number(salaStr),
      status: 'pendente',
      data_atendimento: dataAtendimento,
      unidade: payload.unidade ?? null,
      aso_qtd_cobrar: payload.aso_qtd_cobrar ?? null,
      rac_qtd_cobrar: payload.rac_qtd_cobrar ?? null,
      obs_agendamento: payload.obs_agendamento || null,
      observacoes: payload.observacoes || null,
      observacoes_laboratorial: payload.observacoes_laboratorial || null,
      // Se fosse salvar campos novos para avulso futuramente, eles entrariam aqui
    }));
    
    // Se nenhum procedimento válido com sala foi enviado, não fazemos nada
    if (insertsAgendamentos.length === 0) {
      this.logger.warn('Nenhum procedimento válido com sala mapeada. Nenhum agendamento criado.');
      return { message: 'Nenhum agendamento criado pois os procedimentos não possuem sala mapeada.' };
    }
    
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
}
