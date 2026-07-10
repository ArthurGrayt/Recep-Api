import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString({ message: 'O nome deve ser uma string.' })
  @MinLength(3, { message: 'O nome deve ter no mínimo 3 caracteres.' })
  name: string;

  @IsEmail({}, { message: 'Formato de e-mail inválido.' })
  email: string;

  @IsString({ message: 'A senha deve ser uma string.' })
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres.' })
  password: string;
}
