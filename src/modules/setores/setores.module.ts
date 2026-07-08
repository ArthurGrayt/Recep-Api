// Importa o decorator Module do NestJS para declarar o módulo
import { Module } from '@nestjs/common';
// Importa o controller de setores
import { SetoresController } from './setores.controller';
// Importa o service de setores com a lógica de negócio
import { SetoresService } from './setores.service';
// Importa o módulo do Supabase necessário para acesso ao banco de dados
import { SupabaseModule } from '../../supabase/supabase.module';

// Define o módulo agrupando controller, service e dependências
@Module({
  // Importa o SupabaseModule para disponibilizar o SupabaseService
  imports: [SupabaseModule],
  // Registra o controller que lida com as requisições HTTP de /setores
  controllers: [SetoresController],
  // Registra o service como provedor injetável
  providers: [SetoresService],
})
// Exporta o módulo para ser registrado no AppModule
export class SetoresModule {}
