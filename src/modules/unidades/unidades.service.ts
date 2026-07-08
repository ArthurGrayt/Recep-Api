// Importa o decorator Injectable e Logger do NestJS
import { Injectable, Logger } from '@nestjs/common';
// Importa o serviço do Supabase para acesso ao banco de dados
import { SupabaseService } from '../../supabase/supabase.service';

// Marca a classe como um provedor injetável no NestJS
@Injectable()
export class UnidadesService {
  // Instancia o Logger para registrar eventos deste serviço
  private readonly logger = new Logger(UnidadesService.name);

  // Injeta o SupabaseService via construtor
  constructor(private readonly supabaseService: SupabaseService) {}

  // Método assíncrono para buscar unidades com suporte a pesquisa e filtro por empresa
  async buscar(search: string, empresa_id?: number) {
    // Registra no log o termo de busca e filtro recebidos
    this.logger.log(`Buscando unidades com o termo: ${search}, empresa_id: ${empresa_id}`);

    // Obtém o cliente do Supabase
    const supabase = this.supabaseService.getClient();

    // Inicia a query na tabela 'unidade_cliente' selecionando id, razao_social e empresa_id
    let query = supabase
      .from('unidade_cliente')
      .select('id, razao_social, empresa_cliente_id')
      // Ordena alfabeticamente pela razão social
      .order('razao_social', { ascending: true })
      // Limita a 15 resultados para não sobrecarregar o payload
      .limit(15);

    // Se um termo de busca válido foi fornecido, aplica o filtro ILIKE (case-insensitive)
    if (search && search.trim() !== '') {
      // Busca registros cuja razão social contenha o termo em qualquer posição
      query = query.ilike('razao_social', `%${search.trim()}%`);
    }

    // Se um empresa_id foi fornecido, filtra somente as unidades daquela empresa
    if (empresa_id) {
      query = query.eq('empresa_cliente_id', empresa_id);
    }

    // Executa a query e desestrutura o resultado
    const { data, error } = await query;

    // Se ocorrer algum erro na consulta
    if (error) {
      // Registra o erro com detalhes
      this.logger.error(`Erro ao buscar unidades: ${error.message}`);
      // Lança a exceção para o controller tratar
      throw new Error(`Erro ao buscar unidades: ${error.message}`);
    }

    // Retorna a lista de unidades encontradas
    return data;
  }
}
