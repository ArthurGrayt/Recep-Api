import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Formato de e-mail inválido.' })
  email: string;
}
