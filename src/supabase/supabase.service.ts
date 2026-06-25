// Importa o decorator Injectable para tornar esta classe injetável via Injeção de Dependência
import { Injectable } from '@nestjs/common';

// Importa o cliente do Supabase e o tipo SupabaseClient para tipagem
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Marca a classe como um serviço singleton que será gerenciado pelo NestJS
@Injectable()
export class SupabaseService {
  // Declara o atributo que guardará a instância do cliente Supabase
  private readonly client: SupabaseClient;

  constructor() {
    // Lê a URL do Supabase a partir das variáveis de ambiente do .env
    const supabaseUrl = process.env.SUPABASE_URL;

    // Lê a chave service_role do Supabase a partir das variáveis de ambiente do .env
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Garante que as variáveis obrigatórias foram definidas antes de criar o cliente
    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem ser definidos no arquivo .env',
      );
    }

    // Cria a instância do cliente Supabase com a URL e a chave configuradas
    this.client = createClient(supabaseUrl, supabaseKey);
  }

  // Método público que retorna o cliente Supabase para ser usado nos services
  getClient(): SupabaseClient {
    return this.client;
  }
}
