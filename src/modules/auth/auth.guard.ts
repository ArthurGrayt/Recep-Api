// Importa os utilitários necessários do NestJS e do Express
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
// Importa o tipo Request do Express para tipagem do objeto de requisição
import type { Request } from 'express';
// Importa o serviço global do Supabase para validar o token JWT
import { SupabaseService } from '../../supabase/supabase.service';

// Nome do cookie que armazena o token de acesso (deve ser igual ao definido no auth.controller)
const COOKIE_NAME = 'access_token';

// Marca a classe como injetável pelo sistema de DI do NestJS
@Injectable()
export class AuthGuard implements CanActivate {
  // Injeta o SupabaseService via construtor para validar o token
  constructor(private readonly supabaseService: SupabaseService) {}

  // Método principal do Guard — retorna true para permitir ou lança exceção para bloquear
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Obtém o objeto de requisição HTTP do contexto de execução
    const request = context.switchToHttp().getRequest<Request>();

    // Tenta extrair o token do cookie HTTP-only
    const token = request.cookies?.[COOKIE_NAME];

    // Se o cookie não estiver presente, bloqueia a requisição com 401
    if (!token) {
      throw new UnauthorizedException(
        'Acesso negado: cookie de autenticação ausente.',
      );
    }

    // Obtém o cliente do Supabase para realizar a validação do JWT
    const supabase = this.supabaseService.getClient();

    // Valida o token junto ao Supabase — retorna o usuário autenticado se válido
    const { data, error } = await supabase.auth.getUser(token);

    // Se o Supabase retornar erro ou não encontrar o usuário, bloqueia com 401
    if (error || !data?.user) {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }

    // Injeta o usuário validado no objeto de requisição para uso nos controllers
    // O TypeScript exige que extendamos o tipo Request para aceitar a propriedade 'user'
    (request as Request & { user: typeof data.user }).user = data.user;

    // Retorna true para sinalizar ao NestJS que a requisição pode prosseguir
    return true;
  }
}
