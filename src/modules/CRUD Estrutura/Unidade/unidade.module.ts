// Importa o decorator Module do NestJS para declarar este módulo
import { Module } from '@nestjs/common';
// Importa o controller que define as rotas HTTP do CRUD de unidade
import { UnidadeController } from './unidade.controller';
// Importa o service que contém a lógica de negócio de criação de unidade
import { UnidadeService } from './unidade.service';
// Importa o SupabaseModule que disponibiliza o SupabaseService para acesso ao banco
import { SupabaseModule } from '../../../supabase/supabase.module';

// Declara o módulo do CRUD de Unidade, agrupando controller, service e dependências
@Module({
  // Importa o SupabaseModule para que o SupabaseService seja injetável neste contexto
  imports: [SupabaseModule],
  // Registra o controller responsável por receber as requisições HTTP em /criar/unidade
  controllers: [UnidadeController],
  // Registra o service como provedor injetável que executa a lógica de negócio
  providers: [UnidadeService],
})
// Exporta o módulo para ser registrado no AppModule
export class UnidadeCrudModule {}
