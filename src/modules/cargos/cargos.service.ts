// Importa o decorator Injectable e Logger do NestJS
import { Injectable, Logger } from '@nestjs/common';
// Importa o serviço do Supabase para acesso ao banco de dados
import { SupabaseService } from '../../supabase/supabase.service';

// Marca a classe como um provedor injetável no NestJS
@Injectable()
export class CargosService {
  // Instancia o Logger para registrar eventos deste serviço
  private readonly logger = new Logger(CargosService.name);

  // Injeta o SupabaseService via construtor
  constructor(private readonly supabaseService: SupabaseService) {}

  // Método assíncrono para buscar cargos com suporte a pesquisa por nome e paginação
  async buscar(search?: string, page: number = 1, limit: number = 10) {
    // Registra no log o termo de busca e paginação recebidos
    this.logger.log(`Buscando cargos com o termo: ${search}, page: ${page}, limit: ${limit}`);

    // Obtém o cliente do Supabase
    const supabase = this.supabaseService.getClient();

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Inicia a query na tabela 'cargo' selecionando apenas id e nome
    let query = supabase
      .from('cargo')
      .select('id, nome', { count: 'exact' })
      .order('nome', { ascending: true })
      .range(from, to);

    // Se um termo de busca válido foi fornecido, aplica o filtro ILIKE
    if (search && search.trim() !== '') {
      query = query.ilike('nome', `%${search.trim()}%`);
    }

    // Executa a query e desestrutura o resultado
    const { data, error, count } = await query;

    // Se ocorrer algum erro na consulta
    if (error) {
      // Registra o erro com detalhes
      this.logger.error(`Erro ao buscar cargos: ${error.message}`);
      // Lança a exceção para o controller tratar
      throw new Error(`Erro ao buscar cargos: ${error.message}`);
    }

    // Retorna a lista de cargos encontrados e metadados de paginação
    return {
      data,
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      }
    };
  }
}
