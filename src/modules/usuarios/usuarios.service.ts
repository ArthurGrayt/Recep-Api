// Importa decorators e exceptions do NestJS
import { Injectable, UnauthorizedException, NotFoundException, Logger } from '@nestjs/common';
// Importa o serviço global do Supabase
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class UsuariosService {
  // Instancia o Logger com o nome deste service para identificação nos logs
  private readonly logger = new Logger(UsuariosService.name);

  // Injeta o SupabaseService via construtor
  constructor(private readonly supabaseService: SupabaseService) {}

  // Método responsável por buscar os dados do usuário autenticado
  async getMe(token: string) {
    // Obtém o cliente do Supabase
    const supabase = this.supabaseService.getClient();

    // Remove o prefixo 'Bearer ' ignorando maiúsculas/minúsculas, espaços extras e aspas
    const jwt = token.replace(/^Bearer\s+/i, '').replace(/['"]/g, '').trim();
    
    this.logger.debug(`Supabase URL em memória: ${process.env.SUPABASE_URL}`);
    this.logger.debug(`Header Original: [${token}]`);
    this.logger.debug(`JWT Processado: [${jwt}]`);

    // Busca os dados do usuário autenticado validando o token JWT
    const { data: authData, error: authError } = await supabase.auth.getUser(jwt);

    // Se houver erro na validação ou o usuário não for encontrado, lança exceção de não autorizado
    if (authError || !authData?.user) {
      this.logger.error(`Erro ao validar token do usuário: ${authError?.message}`);
      throw new UnauthorizedException('Token inválido ou expirado.');
    }

    // Pega o ID de autenticação do usuário
    const authUserId = authData.user.id;

    // Busca os dados complementares do usuário na tabela app_users, 
    // trazendo junto as roles associadas da tabela user_roles_recep
    const { data: appUser, error: dbError } = await supabase
      .from('app_users')
      .select('*, user_roles_recep(*)')
      .eq('user_id', authUserId)
      .single();

    // Se ocorrer erro na busca ou o usuário não for encontrado na tabela app_users, lança exceção
    if (dbError || !appUser) {
      this.logger.error(`Usuário não encontrado na base (app_users) para o auth_id ${authUserId}: ${dbError?.message}`);
      throw new NotFoundException('Dados do usuário não encontrados.');
    }

    // Retorna os dados unificados
    return appUser;
  }
}
