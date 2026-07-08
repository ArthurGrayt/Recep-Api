// Importa o decorator Injectable do NestJS para permitir a injeção de dependência nesta classe
import { Injectable, Logger } from '@nestjs/common';
// Importa o serviço do Supabase, que gerencia a conexão com o banco de dados
import { SupabaseService } from '../../supabase/supabase.service';

// Decorator que marca a classe como um provedor que pode ser injetado em outras partes do sistema
@Injectable()
export class ColaboradoresService {
  // Cria uma instância de Logger para registrar informações e erros no console
  private readonly logger = new Logger(ColaboradoresService.name);

  // Injeta o SupabaseService via construtor para usá-lo nas consultas
  constructor(private readonly supabaseService: SupabaseService) {}

  // Método assíncrono para buscar colaboradores com base em um termo de pesquisa
  async buscar(search: string) {
    // Registra a intenção de busca no log do sistema
    this.logger.log(`Buscando colaboradores com o termo: ${search}`);

    // Obtém a instância do cliente Supabase já configurada
    const supabase = this.supabaseService.getClient();

    // Inicia a construção da query na tabela 'colaboradores'
    let query = supabase
      // Seleciona apenas as colunas id, nome e cpf para otimizar o tráfego de rede
      .from('colaboradores')
      .select('id, nome, cpf')
      // Limita o resultado a no máximo 10 registros para evitar payload muito grande
      .limit(10);

    // Se houver algum termo de busca válido fornecido
    if (search && search.trim() !== '') {
      // Adiciona a condição ILIKE (case-insensitive) para a coluna 'nome' usando o termo pesquisado
      // O símbolo '%' antes e depois significa que o termo pode estar em qualquer lugar da string
      query = query.ilike('nome', `%${search.trim()}%`);
    }

    // Executa a query no banco e desestrutura os dados e erros da resposta
    const { data, error } = await query;

    // Se ocorrer algum erro durante a busca
    if (error) {
      // Registra o erro no log informando a mensagem que veio do banco
      this.logger.error(`Erro ao buscar colaboradores: ${error.message}`);
      // Lança a exceção para que o controller ou a camada acima possa tratá-la
      throw new Error(`Erro ao buscar colaboradores: ${error.message}`);
    }

    // Retorna os dados encontrados, que será um array de colaboradores
    return data;
  }

  // Método assíncrono para buscar um colaborador específico pelo seu ID (UUID)
  async buscarPorId(id: string) {
    this.logger.log(`Buscando detalhes do colaborador com ID: ${id}`);
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('colaboradores')
      .select(`
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
      `)
      .eq('id', id)
      .single();

    if (error) {
      this.logger.error(`Erro ao buscar colaborador por ID: ${error.message}`);
      throw new Error(`Erro ao buscar colaborador por ID: ${error.message}`);
    }

    if (!data) return null;

    // Busca a alocação atual (ativo = true) ou pega a primeira como fallback
    const historicoCargos = data.colaborador_cargo_unidade_setor || [];
    const alocacaoAtual: any = historicoCargos.find((c: any) => c.ativo) || historicoCargos[0] || {};
    
    // Extrai empresa, unidade, função e setor navegando pelos relacionamentos de forma segura
    const unidadeNome = alocacaoAtual.cargo_setor_unidade?.unidade_setor?.unidade_cliente?.razao_social || null;
    const unidadeId = alocacaoAtual.cargo_setor_unidade?.unidade_setor?.unidade_cliente?.id || null;
    const empresaNome = alocacaoAtual.cargo_setor_unidade?.unidade_setor?.unidade_cliente?.empresa_cliente?.razao_social || null;
    const empresaId = alocacaoAtual.cargo_setor_unidade?.unidade_setor?.unidade_cliente?.empresa_cliente?.id || null;
    const funcaoNome = alocacaoAtual.cargo_setor_unidade?.cargo?.nome || null;
    const setorNome = alocacaoAtual.cargo_setor_unidade?.unidade_setor?.setor?.nome || null;

    // Retorna um objeto limpo planificado para facilitar o uso
    return {
      id: data.id,
      nome: data.nome,
      cpf: data.cpf,
      data_nascimento: data.data_nascimento,
      sexo: data.sexo,
      empresa: empresaNome,
      empresa_id: empresaId,
      unidade: unidadeNome,
      unidade_id: unidadeId,
      funcao: funcaoNome,
      setor: setorNome
    };
  }
}
