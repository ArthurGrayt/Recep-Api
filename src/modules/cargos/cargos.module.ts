// Importa o decorator Module do NestJS para declarar o módulo
import { Module } from '@nestjs/common';
// Importa o controller de cargos
import { CargosController } from './cargos.controller';
// Importa o service de cargos com a lógica de negócio
import { CargosService } from './cargos.service';
// Importa o módulo do Supabase necessário para acesso ao banco de dados
import { SupabaseModule } from '../../supabase/supabase.module';

// Define o módulo agrupando controller, service e dependências
@Module({
  // Importa o SupabaseModule para disponibilizar o SupabaseService
  imports: [SupabaseModule],
  // Registra o controller que lida com as requisições HTTP de /cargos
  controllers: [CargosController],
  // Registra o service como provedor injetável
  providers: [CargosService],
})
// Exporta o módulo para ser registrado no AppModule
export class CargosModule {}
