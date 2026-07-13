// Importa o decorator Module do NestJS para declarar o módulo
import { Module } from '@nestjs/common';
// Importa o controller de autenticação (login, register, logout...)
import { AuthController } from './auth.controller';
// Importa o service de autenticação com a lógica de negócio
import { AuthService } from './auth.service';
// Importa o Guard que valida o cookie HTTP-only em rotas protegidas
import { AuthGuard } from './auth.guard';

@Module({
  // Registra o controller de autenticação
  controllers: [AuthController],
  // Registra o AuthService e o AuthGuard como providers do módulo
  providers: [AuthService, AuthGuard],
  // Exporta ambos para que outros módulos possam usar o Guard e o Service
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
