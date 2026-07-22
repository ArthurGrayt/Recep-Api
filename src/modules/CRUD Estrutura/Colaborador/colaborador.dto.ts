import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';

export class CreateColaboradorDto {
  @ApiProperty({ description: 'Nome completo do colaborador', example: 'João da Silva' })
  @IsString({ message: 'O nome deve ser um texto.' })
  @IsNotEmpty({ message: 'O nome é obrigatório.' })
  @MaxLength(255, { message: 'O nome não pode ter mais de 255 caracteres.' })
  nome: string;

  @ApiPropertyOptional({ description: 'CPF do colaborador', example: '123.456.789-00' })
  @IsOptional()
  @IsString({ message: 'O CPF deve ser um texto.' })
  @MaxLength(20, { message: 'O CPF não pode ter mais de 20 caracteres.' })
  cpf?: string;

  @ApiPropertyOptional({ description: 'Data de nascimento no formato YYYY-MM-DD', example: '1990-01-01' })
  @IsOptional()
  @IsString({ message: 'A data de nascimento deve ser um texto.' })
  data_nascimento?: string;

  @ApiPropertyOptional({ description: 'Sexo do colaborador (ex: M, F)', example: 'M' })
  @IsOptional()
  @IsString({ message: 'O sexo deve ser um texto.' })
  @MaxLength(10, { message: 'O sexo não pode ter mais de 10 caracteres.' })
  sexo?: string;
  
  @ApiPropertyOptional({ description: 'Status de atividade do colaborador', default: true })
  @IsOptional()
  @IsBoolean({ message: 'O status deve ser um booleano (true ou false).' })
  status?: boolean;

  @ApiPropertyOptional({ description: 'ID da unidade para alocação inicial', example: 1 })
  @IsOptional()
  @IsInt({ message: 'A unidade_id deve ser um número inteiro.' })
  @Min(1, { message: 'A unidade_id deve ser maior que zero.' })
  unidade_id?: number;

  @ApiPropertyOptional({ description: 'ID do setor para alocação inicial', example: 1 })
  @IsOptional()
  @IsInt({ message: 'O setor_id deve ser um número inteiro.' })
  @Min(1, { message: 'O setor_id deve ser maior que zero.' })
  setor_id?: number;

  @ApiPropertyOptional({ description: 'ID do cargo para alocação inicial', example: 1 })
  @IsOptional()
  @IsInt({ message: 'O cargo_id deve ser um número inteiro.' })
  @Min(1, { message: 'O cargo_id deve ser maior que zero.' })
  cargo_id?: number;
}

export class AlocarColaboradorDto {
  @ApiProperty({ description: 'ID da unidade', example: 1 })
  @IsInt({ message: 'A unidade_id deve ser um número inteiro.' })
  @Min(1, { message: 'A unidade_id deve ser maior que zero.' })
  unidade_id: number;

  @ApiProperty({ description: 'ID do setor', example: 1 })
  @IsInt({ message: 'O setor_id deve ser um número inteiro.' })
  @Min(1, { message: 'O setor_id deve ser maior que zero.' })
  setor_id: number;

  @ApiProperty({ description: 'ID do cargo', example: 1 })
  @IsInt({ message: 'O cargo_id deve ser um número inteiro.' })
  @Min(1, { message: 'O cargo_id deve ser maior que zero.' })
  cargo_id: number;
}
