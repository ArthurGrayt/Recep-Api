// Importa o decorator Injectable e Logger do NestJS
import { Injectable, Logger } from '@nestjs/common';
// Importa o serviço do Supabase para acesso ao banco de dados
import { SupabaseService } from '../../supabase/supabase.service';

// Marca a classe como um provedor injetável no NestJS
@Injectable()
export class EmpresasService {
  // Instancia o Logger para registrar eventos deste serviço
  private readonly logger = new Logger(EmpresasService.name);

  // Injeta o SupabaseService via construtor
  constructor(private readonly supabaseService: SupabaseService) {}

  // Método assíncrono para buscar empresas com suporte a pesquisa por razão social e paginação
  async buscar(search?: string, page: number = 1, limit: number = 10) {
    // Registra no log o termo de busca e paginação recebidos
    this.logger.log(`Buscando empresas com o termo: ${search}, page: ${page}, limit: ${limit}`);

    // Obtém o cliente do Supabase
    const supabase = this.supabaseService.getClient();

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Inicia a query na tabela 'empresa_cliente' selecionando id e razao_social
    let query = supabase
      .from('empresa_cliente')
      .select('id, razao_social', { count: 'exact' })
      // Ordena alfabeticamente pela razão social
      .order('razao_social', { ascending: true })
      .range(from, to);

    // Se um termo de busca válido foi fornecido, aplica o filtro ILIKE
    if (search && search.trim() !== '') {
      query = query.ilike('razao_social', `%${search.trim()}%`);
    }

    // Executa a query e desestrutura o resultado
    const { data, error, count } = await query;

    // Se ocorrer algum erro na consulta
    if (error) {
      // Registra o erro com detalhes
      this.logger.error(`Erro ao buscar empresas: ${error.message}`);
      // Lança a exceção para o controller tratar
      throw new Error(`Erro ao buscar empresas: ${error.message}`);
    }

    // Retorna a lista de empresas encontradas e metadados de paginação
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
