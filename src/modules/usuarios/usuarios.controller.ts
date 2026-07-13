// Importa os decorators necessários do NestJS
import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
// Importa os decorators do Swagger para documentação
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
// Importa o tipo Request do Express para tipagem correta da requisição
import type { Request } from 'express';
// Importa o serviço de usuários para delegar a lógica de negócio
import { UsuariosService } from './usuarios.service';
// Importa o Guard centralizado que valida o cookie HTTP-only
import { AuthGuard } from '../auth/auth.guard';

// Define o prefixo base da rota como /usuarios
@ApiTags('Usuarios')
@Controller('usuarios')
export class UsuariosController {
  // Injeta o UsuariosService via construtor
  constructor(private readonly usuariosService: UsuariosService) {}

  // ─────────────────────────────────────────────────────────────────
  // GET /usuarios/me
  // Retorna os dados do usuário autenticado via cookie HTTP-only
  // ─────────────────────────────────────────────────────────────────
  @ApiOperation({
    summary: 'Buscar perfil do usuário',
    description:
      'Retorna os dados do usuário autenticado. O token é lido do cookie HTTP-only (access_token).',
  })
  // Aplica o Guard que valida o cookie e injeta req.user antes de entrar no método
  @UseGuards(AuthGuard)
  @Get('me')
  async getMe(@Req() req: Request & { user: { id: string } }) {
    // O AuthGuard já validou o token e injetou o usuário em req.user
    // Delega para o service passando apenas o ID do usuário autenticado
    return this.usuariosService.getMe(req.user.id);
  }
}

