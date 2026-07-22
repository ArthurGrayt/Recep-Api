// Importa o decorator Module do NestJS para declarar o módulo raiz da aplicação
import { Module } from '@nestjs/common';

// Importa o controller principal da aplicação (gerado por padrão pelo NestJS CLI)
import { AppController } from './app.controller';

// Importa o service principal da aplicação (gerado por padrão pelo NestJS CLI)
import { AppService } from './app.service';


// Importa ConfigModule para carregar variáveis do arquivo .env
import { ConfigModule } from '@nestjs/config';

// Importa o módulo de chamadas que contém todos os endpoints do fluxo de atendimento
import { ChamadasModule } from './modules/chamadas/chamadas.module';

// Importa o módulo global do Supabase — disponibiliza o cliente de banco para toda a aplicação
import { SupabaseModule } from './supabase/supabase.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';

// Importa o módulo MenuModule para disponibilizar a rota de menu
import { MenuModule } from './modules/menu/menu.module';

// Importa o módulo AgendamentosModule para gerenciar os agendamentos
import { AgendamentosModule } from './modules/agendamentos/agendamentos.module';

// Importa o módulo ColaboradoresModule para gerenciar os colaboradores
import { ColaboradoresModule } from './modules/colaboradores/colaboradores.module';
import { SalasModule } from './modules/salas/salas.module';
// Importa o módulo de cargos para disponibilizar o GET /cargos
import { CargosModule } from './modules/cargos/cargos.module';
// Importa o módulo de setores para disponibilizar o GET /setores
import { SetoresModule } from './modules/setores/setores.module';
// Importa o módulo de empresas para disponibilizar o GET /empresas
import { EmpresasModule } from './modules/empresas/empresas.module';
// Importa o módulo de unidades para disponibilizar o GET /unidades
import { UnidadesModule } from './modules/unidades/unidades.module';
// Importa o módulo de autenticação
import { AuthModule } from './modules/auth/auth.module';
// Importa o módulo de CRUD de Empresa para disponibilizar o POST /crud/empresa
import { EmpresaCrudModule } from './modules/CRUD Estrutura/Empresa/empresa.module';
// Importa o módulo de CRUD de Unidade para disponibilizar o POST /criar/unidade
import { UnidadeCrudModule } from './modules/CRUD Estrutura/Unidade/unidade.module';
// Importa o módulo de CRUD de Setor para disponibilizar o POST /criar/setor
import { SetorCrudModule } from './modules/CRUD Estrutura/Setor/setor.module';
// Importa o módulo de CRUD de Cargo para disponibilizar o POST /criar/cargo
import { CargoCrudModule } from './modules/CRUD Estrutura/Cargo/cargo.module';
// Importa o módulo de CRUD de Colaborador para disponibilizar o POST /criar/colaborador
import { ColaboradorModule } from './modules/CRUD Estrutura/Colaborador/colaborador.module';


// Declara o módulo raiz da aplicação (AppModule)
// Este é o ponto central onde todos os módulos são registrados
@Module({
  imports: [
    // Carrega o .env e disponibiliza o process.env globalmente
    ConfigModule.forRoot({ isGlobal: true }),
    // SupabaseModule é global (@Global), então basta importar aqui uma vez
    SupabaseModule,
    ChamadasModule,
    UsuariosModule,
    // Registra o MenuModule na aplicação
    MenuModule,
    // Registra o AgendamentosModule na aplicação
    AgendamentosModule,
    // Registra o ColaboradoresModule na aplicação
    ColaboradoresModule,
    SalasModule,
    // Registra o módulo de busca de cargos/funções
    CargosModule,
    // Registra o módulo de busca de setores
    SetoresModule,
    // Registra o módulo de busca de empresas clientes
    EmpresasModule,
    // Registra o módulo de busca de unidades clientes
    UnidadesModule,
    // Registra o módulo de autenticação e rotas de login
    AuthModule,
    // Registra o módulo de CRUD de Empresa com a rota POST /crud/empresa
    EmpresaCrudModule,
    // Registra o módulo de CRUD de Unidade com a rota POST /criar/unidade
    UnidadeCrudModule,
    // Registra o módulo de CRUD de Setor com a rota POST /criar/setor
    SetorCrudModule,
    // Registra o módulo de CRUD de Cargo com a rota POST /criar/cargo
    CargoCrudModule,
    // Registra o módulo de CRUD de Colaborador com a rota POST /criar/colaborador
    ColaboradorModule,
  ],

  // Registra os controllers padrão da aplicação
  controllers: [AppController],

  // Registra os providers (services) padrão da aplicação
  providers: [AppService],
})
export class AppModule {}
