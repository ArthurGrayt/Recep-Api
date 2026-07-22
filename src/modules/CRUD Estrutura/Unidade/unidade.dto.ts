// Importa os decorators do Swagger para documentar os campos
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// Importa os decorators de validação do class-validator
import { IsString, IsNotEmpty, IsOptional, MaxLength, IsBoolean, IsInt, Min, Matches } from 'class-validator';
// Importa Transform e Type do class-transformer para conversão de tipos antes da validação
import { Transform, Type } from 'class-transformer';

// DTO (Data Transfer Object) que define e valida o body da requisição de criação de unidade
// Baseado na estrutura real da tabela unidade_cliente do banco de dados
export class CreateUnidadeDto {
  // ── Campos obrigatórios ───────────────────────────────────────────────────────

  // Documenta o campo razao_social como obrigatório no Swagger
  @ApiProperty({
    description: 'Razão social da unidade cliente (campo obrigatório)',
    example: 'Unidade São Paulo - Matriz',
  })
  // Garante que o valor é uma string
  @IsString()
  // Garante que o campo não está vazio (NOT NULL no banco)
  @IsNotEmpty({ message: 'A razão social é obrigatória.' })
  // Limita a 255 caracteres
  @MaxLength(255, { message: 'A razão social deve ter no máximo 255 caracteres.' })
  // Mapeia para a coluna razao_social da tabela unidade_cliente
  razao_social: string;

  // Documenta o campo empresa_cliente_id como obrigatório no Swagger
  @ApiProperty({
    description: 'ID da empresa cliente à qual esta unidade pertence (FK obrigatória)',
    example: 3,
  })
  // Converte o valor para número inteiro antes de validar (evita erro quando enviado como string)
  @Type(() => Number)
  // Garante que o valor é um número inteiro
  @IsInt({ message: 'O empresa_cliente_id deve ser um número inteiro.' })
  // Garante que o ID seja positivo (IDs do banco são > 0)
  @Min(1, { message: 'O empresa_cliente_id deve ser maior que zero.' })
  // Mapeia para a FK empresa_cliente_id da tabela unidade_cliente
  empresa_cliente_id: number;

  // ── Campos opcionais ──────────────────────────────────────────────────────────

  // Documenta o campo documento como opcional no Swagger
  @ApiPropertyOptional({
    description: 'CNPJ ou outro documento da unidade (texto livre)',
    example: '98.765.432/0002-10',
  })
  // Campo opcional
  @IsOptional()
  // Converte para string antes de validar — evita erro quando enviado como número
  @Transform(({ value }) => (value !== undefined && value !== null ? String(value) : value))
  // Garante que o valor, quando presente, é uma string
  @IsString()
  // Limita a 255 caracteres
  @MaxLength(255, { message: 'O documento deve ter no máximo 255 caracteres.' })
  // Mapeia para a coluna documento da tabela unidade_cliente
  documento?: string;

  // Documenta o campo address como opcional no Swagger
  @ApiPropertyOptional({
    description: 'Endereço da unidade',
    example: 'Av. Paulista, 1000 - São Paulo/SP',
  })
  // Campo opcional
  @IsOptional()
  // Garante que o valor, quando presente, é uma string
  @IsString()
  // Limita a 500 caracteres para acomodar endereços longos
  @MaxLength(500, { message: 'O endereço deve ter no máximo 500 caracteres.' })
  // Mapeia para a coluna address da tabela unidade_cliente
  address?: string;

  // Documenta o campo complemento como opcional no Swagger
  @ApiPropertyOptional({
    description: 'Complemento do endereço da unidade',
    example: 'Andar 5, Torre Norte',
  })
  // Campo opcional
  @IsOptional()
  // Garante que o valor, quando presente, é uma string
  @IsString()
  // Limita a 255 caracteres
  @MaxLength(255, { message: 'O complemento deve ter no máximo 255 caracteres.' })
  // Mapeia para a coluna complemento da tabela unidade_cliente
  complemento?: string;

  // Documenta o campo tel como opcional no Swagger
  @ApiPropertyOptional({
    description: 'Telefone de contato da unidade. Aceita apenas dígitos, espaços, hífen, parênteses e +.',
    example: '(11) 3333-4444',
  })
  // Campo opcional
  @IsOptional()
  // Remove automaticamente qualquer letra antes da validação (máscara server-side)
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/[a-zA-Z]/g, '') : value))
  // Garante que o valor, quando presente, é uma string
  @IsString()
  // Valida que o telefone contém apenas dígitos, espaços, hífen, parênteses e + (sem letras)
  @Matches(/^[\d\s\(\)\-\+]+$/, {
    message: 'O telefone deve conter apenas números, espaços, hífen, parênteses ou +.',
  })
  // Limita a 20 caracteres (formato (XX) XXXXX-XXXX)
  @MaxLength(20, { message: 'O telefone deve ter no máximo 20 caracteres.' })
  // Mapeia para a coluna tel da tabela unidade_cliente
  tel?: string;

  // Documenta o campo status como opcional no Swagger (padrão do banco é true)
  @ApiPropertyOptional({
    description: 'Status ativo/inativo da unidade (padrão: true)',
    example: true,
    default: true,
  })
  // Campo opcional — o banco aplica default true automaticamente se não enviado
  @IsOptional()
  // Garante que o valor, quando presente, é um boolean
  @IsBoolean({ message: 'O status deve ser verdadeiro ou falso.' })
  // Mapeia para a coluna status da tabela unidade_cliente
  status?: boolean;

  // Documenta o campo force_create como opcional no Swagger
  @ApiPropertyOptional({
    description: 'Ignora o aviso de similaridade e força a criação do registro, aceitando possíveis nomes parecidos.',
    example: true,
  })
  // Campo opcional utilizado apenas na lógica da API, não vai para o banco
  @IsOptional()
  @IsBoolean({ message: 'A flag force_create deve ser um booleano.' })
  force_create?: boolean;
}
