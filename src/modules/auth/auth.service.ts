import { Injectable, Logger, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async login(email: string, password: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      this.logger.error(`Login falhou: ${error?.message}`);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    this.logger.log(`Login bem-sucedido para o email: ${email}`);

    return {
      message: 'Login realizado com sucesso',
      object: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        ...data.user,
      },
    };
  }

  async register(name: string, email: string, password: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) {
      this.logger.error(`Registro falhou: ${error.message}`);
      throw new HttpException(`Erro ao registrar usuário: ${error.message}`, HttpStatus.BAD_REQUEST);
    }

    return {
      message: 'Registro realizado com sucesso',
      object: {
        accessToken: data.session?.access_token,
        refreshToken: data.session?.refresh_token,
        ...data.user,
      },
    };
  }

  async forgotPassword(email: string) {
    const supabase = this.supabaseService.getClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      throw new HttpException(`Erro ao solicitar recuperação de senha: ${error.message}`, HttpStatus.BAD_REQUEST);
    }

    return { message: 'Email de recuperação enviado.' };
  }

  async updatePassword(token: string, password: string) {
    const supabase = this.supabaseService.getClient();
    
    // Configura a sessão com o token recebido
    const { error: setSessionError } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: '',
    });
    
    if (setSessionError) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
    
    // Atualiza a senha
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      throw new HttpException(`Erro ao atualizar senha: ${error.message}`, HttpStatus.BAD_REQUEST);
    }

    return { message: 'Senha atualizada com sucesso' };
  }

  async logout(token?: string) {
    const supabase = this.supabaseService.getClient();
    // Como a API é stateless, apenas chamamos o signOut do lado do cliente do Supabase
    if (token) {
       await supabase.auth.signOut();
    }
    return { message: 'Logout realizado com sucesso' };
  }
}
