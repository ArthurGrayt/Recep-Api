// Importa os decorators necessários do NestJS
import { Controller, Get, Headers, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
// Importa o serviço de usuários
import { UsuariosService } from './usuarios.service';

// Define o prefixo base da rota como /usuarios
@ApiTags('Usuarios')
@Controller('usuarios')
export class UsuariosController {
  // Injeta o UsuariosService via construtor
  constructor(private readonly usuariosService: UsuariosService) {}

  // ─────────────────────────────────────────────────────────────────
  // GET /usuarios/me
  // Retorna os dados do usuário autenticado
  // ─────────────────────────────────────────────────────────────────
  @ApiOperation({
    summary: 'Buscar perfil do usuário',
    description: 'Retorna os dados do perfil do usuário autenticado validando o token JWT enviado no cabeçalho.'
  })
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
