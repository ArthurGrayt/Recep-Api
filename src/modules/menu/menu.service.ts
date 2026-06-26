// Importa o decorator Injectable e classes de tratamento de erro HTTP do NestJS
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
// Importa o serviço do Supabase que contém a instância do cliente
import { SupabaseService } from '../../supabase/supabase.service';

// Decora a classe como um serviço que pode ser injetado em outros componentes
@Injectable()
export class MenuService {
  // Injeta o SupabaseService no construtor para acessar o banco de dados
  constructor(private readonly supabaseService: SupabaseService) {}

  // Método assíncrono getMenu que recebe o id (system_id) para busca no banco
  async getMenu(id: string) {
    // Obtém a instância do cliente Supabase já configurado com a Service Role
    const client = this.supabaseService.getClient();

    // Faz uma requisição assíncrona para a tabela 'menu' buscando todos os campos onde 'system_id' seja igual ao 'id'
    const { data, error } = await client
      .from('menu')
      .select('*')
      .eq('system_id', id);

    // Verifica se houve algum erro na requisição ao banco de dados
    if (error) {
      // Lança uma exceção HTTP 500 informando o erro ao cliente
      throw new HttpException(
        // Corpo da resposta de erro
        { success: false, message: 'Erro ao buscar dados do menu', error },
        // Status code HTTP 500 (Internal Server Error)
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Retorna o objeto JSON formatado conforme a interface ApiResponse esperada pelo frontend
    return {
      // Propriedade success indica que a operação foi bem-sucedida
      success: true,
      // Propriedade status contendo o código HTTP 200
      status: 200,
      // Propriedade message com uma mensagem amigável
      message: 'Menus carregados com sucesso',
      // Propriedade object recebendo os dados vindos do Supabase
      object: data,
    };
  }
}
