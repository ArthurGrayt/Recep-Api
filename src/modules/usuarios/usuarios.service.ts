// Importa decorators e exceptions do NestJS
import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
// Importa o serviço global do Supabase
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class UsuariosService {
  // Instancia o Logger com o nome deste service para identificação nos logs
  private readonly logger = new Logger(UsuariosService.name);

  // Injeta o SupabaseService via construtor
  constructor(private readonly supabaseService: SupabaseService) {}

  // Método responsável por buscar os dados do usuário autenticado a partir do seu ID
  // O token já foi validado pelo AuthGuard antes de chegar aqui
  async getMe(userId: string) {
    // Valida que o userId foi fornecido (segurança adicional)
    if (!userId) {
      throw new UnauthorizedException('ID do usuário ausente.');
    }

    // Obtém o cliente do Supabase para realizar a consulta no banco
    const supabase = this.supabaseService.getClient();

    // Busca os dados complementares do usuário na tabela app_users,
    // trazendo junto as roles associadas da tabela user_roles_recep
    const { data: appUser, error: dbError } = await supabase
      .from('app_users')
      .select('*, user_roles_recep(*)')
      .eq('user_id', userId)
      .single();

    // Se ocorrer erro na busca ou o usuário não for encontrado na tabela app_users, lança exceção
    if (dbError || !appUser) {
      this.logger.error(
        `Usuário não encontrado na base (app_users) para o auth_id ${userId}: ${dbError?.message}`,
      );
      throw new NotFoundException('Dados do usuário não encontrados.');
    }

    // Retorna os dados unificados do usuário
    return appUser;
  }
}

