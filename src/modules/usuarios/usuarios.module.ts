// Importa o decorator Module do NestJS para declarar o módulo
import { Module } from '@nestjs/common';
// Importa o controller que define as rotas de /usuarios
import { UsuariosController } from './usuarios.controller';
// Importa o service com a lógica de negócio dos usuários
import { UsuariosService } from './usuarios.service';
// Importa o AuthModule para disponibilizar o AuthGuard neste módulo
import { AuthModule } from '../auth/auth.module';

@Module({
  // Torna o AuthGuard disponível para ser injetado neste módulo
  imports: [AuthModule],
  // Registra o controller das rotas de usuários
  controllers: [UsuariosController],
  // Registra o service de usuários como provider
  providers: [UsuariosService],
})
export class UsuariosModule {}

