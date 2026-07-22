// Importa os decorators do Swagger para documentar os campos no Swagger UI
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// Importa os decorators de validação do class-validator
import { IsString, IsNotEmpty, IsOptional, MaxLength, IsEmail, IsBoolean, Matches } from 'class-validator';
// Importa Transform do class-transformer para converter tipos antes da validação
import { Transform } from 'class-transformer';

// DTO (Data Transfer Object) que define e valida o body da requisição de criação de empresa
// Baseado na estrutura real da tabela empresa_cliente do banco de dados
export class CreateEmpresaDto {
  // ── Campo obrigatório ────────────────────────────────────────────────────────

  // Documenta o campo razao_social como obrigatório no Swagger
  @ApiProperty({
    description: 'Razão social da empresa cliente (campo obrigatório)',
    example: 'Empresa Exemplo Ltda',
  })
  // Garante que o valor é uma string
  @IsString()
  // Garante que o campo não está vazio (NOT NULL no banco)
  @IsNotEmpty({ message: 'A razão social é obrigatória.' })
  // Limita a 255 caracteres para evitar overflow
  @MaxLength(255, { message: 'A razão social deve ter no máximo 255 caracteres.' })
  // Mapeia diretamente para a coluna razao_social da tabela empresa_cliente
  razao_social: string;

  // ── Campos opcionais ─────────────────────────────────────────────────────────

  // Documenta o campo documento como opcional no Swagger
  @ApiPropertyOptional({
    description: 'CNPJ ou outro documento da empresa (texto livre)',
    example: '12.345.678/0001-95',
  })
  // Campo opcional — não lança erro se ausente
  @IsOptional()
  // Converte o valor para string antes de validar — evita erro quando enviado como número (ex: CNPJ sem aspas)
  @Transform(({ value }) => (value !== undefined && value !== null ? String(value) : value))
  // Garante que o valor, quando presente, é uma string
  @IsString()
  // Limita a 255 caracteres
  @MaxLength(255, { message: 'O documento deve ter no máximo 255 caracteres.' })
  // Mapeia para a coluna documento da tabela empresa_cliente
  documento?: string;

  // Documenta o campo address como opcional no Swagger
  @ApiPropertyOptional({
    description: 'Endereço da empresa',
    example: 'Rua das Flores, 123 - São Paulo/SP',
  })
  // Campo opcional
  @IsOptional()
  // Garante que o valor, quando presente, é uma string
  @IsString()
  // Limita a 500 caracteres para acomodar endereços longos
  @MaxLength(500, { message: 'O endereço deve ter no máximo 500 caracteres.' })
  // Mapeia para a coluna address da tabela empresa_cliente
  address?: string;

  // Documenta o campo complemento como opcional no Swagger
  @ApiPropertyOptional({
    description: 'Complemento do endereço',
    example: 'Sala 302, Bloco B',
  })
  // Campo opcional
  @IsOptional()
  // Garante que o valor, quando presente, é uma string
  @IsString()
  // Limita a 255 caracteres
  @MaxLength(255, { message: 'O complemento deve ter no máximo 255 caracteres.' })
  // Mapeia para a coluna complemento da tabela empresa_cliente
  complemento?: string;

  // Documenta o campo email como opcional no Swagger
  @ApiPropertyOptional({
    description: 'E-mail de contato da empresa',
    example: 'contato@empresa.com.br',
  })
  // Campo opcional
  @IsOptional()
  // Valida se o valor, quando presente, é um e-mail válido
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  // Limita a 255 caracteres
  @MaxLength(255, { message: 'O e-mail deve ter no máximo 255 caracteres.' })
  // Mapeia para a coluna email da tabela empresa_cliente
  email?: string;

  // Documenta o campo tel como opcional no Swagger
  @ApiPropertyOptional({
    description: 'Telefone de contato da empresa. Aceita apenas dígitos, espaços, hífen, parênteses e +.',
    example: '(11) 98765-4321',
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
  // Mapeia para a coluna tel da tabela empresa_cliente
  tel?: string;

  // Documenta o campo status como opcional no Swagger (padrão do banco é true)
  @ApiPropertyOptional({
    description: 'Status ativo/inativo da empresa (padrão: true)',
    example: true,
    default: true,
  })
  // Campo opcional — o banco aplica default true automaticamente se não enviado
  @IsOptional()
  // Garante que o valor, quando presente, é um boolean
  @IsBoolean({ message: 'O status deve ser verdadeiro ou falso.' })
  // Mapeia para a coluna status da tabela empresa_cliente
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
