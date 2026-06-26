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
  ],

  // Registra os controllers padrão da aplicação
  controllers: [AppController],

  // Registra os providers (services) padrão da aplicação
  providers: [AppService],
})
export class AppModule {}
