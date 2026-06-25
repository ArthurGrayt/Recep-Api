// Importa Global para tornar o módulo disponível em toda a aplicação sem importação individual
import { Global, Module } from '@nestjs/common';

// Importa o service que encapsula a criação do cliente Supabase
import { SupabaseService } from './supabase.service';

// O decorator @Global() faz com que os providers deste módulo fiquem disponíveis
// em qualquer outro módulo da aplicação sem precisar importar o SupabaseModule novamente
@Global()
@Module({
  // Registra o SupabaseService como provider deste módulo
  providers: [SupabaseService],

  // Exporta o SupabaseService para que outros módulos possam injetá-lo
  exports: [SupabaseService],
})
export class SupabaseModule {}
