// Importa o decorator Module do NestJS para declarar este módulo
import { Module } from '@nestjs/common';
// Importa o controller que define as rotas HTTP do CRUD de empresa
import { EmpresaController } from './empresa.controller';
// Importa o service que contém a lógica de negócio de criação de empresa
import { EmpresaService } from './empresa.service';
// Importa o SupabaseModule que disponibiliza o SupabaseService para acesso ao banco
import { SupabaseModule } from '../../../supabase/supabase.module';

// Declara o módulo do CRUD de Empresa, agrupando controller, service e dependências
@Module({
  // Importa o SupabaseModule para que o SupabaseService seja injetável neste contexto
  imports: [SupabaseModule],
  // Registra o controller responsável por receber as requisições HTTP em /crud/empresa
  controllers: [EmpresaController],
  // Registra o service como provedor injetável que executa a lógica de negócio
  providers: [EmpresaService],
})
// Exporta o módulo para ser registrado no AppModule
export class EmpresaCrudModule {}
