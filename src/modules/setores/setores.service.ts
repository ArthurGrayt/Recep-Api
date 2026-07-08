// Importa o decorator Injectable e Logger do NestJS
import { Injectable, Logger } from '@nestjs/common';
// Importa o serviço do Supabase para acesso ao banco de dados
import { SupabaseService } from '../../supabase/supabase.service';

// Marca a classe como um provedor injetável no NestJS
@Injectable()
export class SetoresService {
  // Instancia o Logger para registrar eventos deste serviço
  private readonly logger = new Logger(SetoresService.name);

  // Injeta o SupabaseService via construtor
  constructor(private readonly supabaseService: SupabaseService) {}

  // Método assíncrono para buscar setores com suporte a pesquisa por nome
  async buscar(search: string) {
    // Registra no log o termo de busca recebido
    this.logger.log(`Buscando setores com o termo: ${search}`);

    // Obtém o cliente do Supabase
    const supabase = this.supabaseService.getClient();

    // Inicia a query na tabela 'setor' selecionando apenas id e nome
    let query = supabase
      .from('setor')
      .select('id, nome')
      // Limita a 15 resultados para não sobrecarregar o payload
      .limit(15);

    // Se um termo de busca válido foi fornecido, aplica o filtro ILIKE (case-insensitive)
    if (search && search.trim() !== '') {
      // Busca registros cujo nome contenha o termo em qualquer posição
      query = query.ilike('nome', `%${search.trim()}%`);
    }

    // Executa a query e desestrutura o resultado
    const { data, error } = await query;

    // Se ocorrer algum erro na consulta
    if (error) {
      // Registra o erro com detalhes
      this.logger.error(`Erro ao buscar setores: ${error.message}`);
      // Lança a exceção para o controller tratar
      throw new Error(`Erro ao buscar setores: ${error.message}`);
    }

    // Retorna a lista de setores encontrados
    return data;
  }
}
