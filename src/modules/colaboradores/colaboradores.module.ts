// Importa o decorator Module, responsável por agrupar controllers e providers no NestJS
import { Module } from '@nestjs/common';
// Importa o controller das rotas de colaboradores
import { ColaboradoresController } from './colaboradores.controller';
// Importa o serviço que contém as regras de negócio de colaboradores
import { ColaboradoresService } from './colaboradores.service';
// Importa o módulo do Supabase, que será necessário para acessar o serviço de banco de dados
import { SupabaseModule } from '../../supabase/supabase.module';

// O decorator @Module define os elementos que compõem este módulo
@Module({
  // Importa módulos de terceiros ou globais (aqui, o SupabaseModule para ter acesso ao SupabaseService)
  imports: [SupabaseModule],
  // Registra o controlador que lida com as requisições HTTP da rota /colaboradores
  controllers: [ColaboradoresController],
  // Registra o provedor (service) para que possa ser injetado no controlador
  providers: [ColaboradoresService],
})
// Exporta a classe do módulo para ser importada no módulo principal da aplicação (AppModule)
export class ColaboradoresModule {}
