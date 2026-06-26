// Importa os decorators necessários do NestJS
import { Controller, Get, Headers, UnauthorizedException } from '@nestjs/common';
// Importa o serviço de usuários
import { UsuariosService } from './usuarios.service';

// Define o prefixo base da rota como /usuarios
@Controller('usuarios')
export class UsuariosController {
  // Injeta o UsuariosService via construtor
  constructor(private readonly usuariosService: UsuariosService) {}

  // ─────────────────────────────────────────────────────────────────
  // GET /usuarios/me
  // Retorna os dados do usuário autenticado
  // ─────────────────────────────────────────────────────────────────
  @Get('me')
  async getMe(@Headers('authorization') authHeader: string) {
    // Verifica se o cabeçalho Authorization foi enviado
    if (!authHeader) {
      // Caso não seja enviado, lança erro 401
      throw new UnauthorizedException('Cabeçalho de autorização ausente.');
    }

    // Delega para o service a lógica de extração e validação passando o header
    return this.usuariosService.getMe(authHeader);
  }
}
