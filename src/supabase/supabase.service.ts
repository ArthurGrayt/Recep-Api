// Importa o decorator Injectable para tornar esta classe injetável via Injeção de Dependência
import { Injectable } from '@nestjs/common';

// Importa o cliente do Supabase e o tipo SupabaseClient para tipagem
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Importa ConfigService para acessar de forma segura variáveis de ambiente do .env
import { ConfigService } from '@nestjs/config';

// Marca a classe como um serviço singleton que será gerenciado pelo NestJS
@Injectable()
export class SupabaseService {
  // Declara o atributo que guardará a instância do cliente Supabase
  private readonly client: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    // Lê a URL do Supabase a partir das variáveis de ambiente usando ConfigService
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');

    // Lê a chave service_role do Supabase a partir das variáveis de ambiente usando ConfigService
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

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
