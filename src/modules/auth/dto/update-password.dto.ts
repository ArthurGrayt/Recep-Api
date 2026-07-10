import { IsString, MinLength, IsOptional } from 'class-validator';

export class UpdatePasswordDto {
  @IsOptional()
  @IsString()
  token?: string;

  @IsString({ message: 'A senha deve ser uma string.' })
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres.' })
  password: string;
}
