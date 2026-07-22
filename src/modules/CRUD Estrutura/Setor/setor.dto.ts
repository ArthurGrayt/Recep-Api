// Importa os decorators do Swagger para documentar os campos
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// Importa os decorators de validação do class-validator
import { IsString, IsNotEmpty, IsOptional, MaxLength, IsBoolean, IsInt, Min } from 'class-validator';
// Importa Type do class-transformer para conversão de tipos antes da validação
import { Type } from 'class-transformer';

// DTO (Data Transfer Object) que define e valida o body da requisição de criação de setor
// O setor é uma entidade global no banco — a FK com empresa é via unidade_setor
export class CreateSetorDto {
  // ── Campos obrigatórios ───────────────────────────────────────────────────────

  // Documenta o campo nome como obrigatório no Swagger
  @ApiProperty({
    description: 'Nome do setor (campo obrigatório)',
    example: 'Operacional',
  })
  // Garante que o valor é uma string
  @IsString()
  // Garante que o campo não está vazio (NOT NULL no banco)
  @IsNotEmpty({ message: 'O nome do setor é obrigatório.' })
  // Limita a 255 caracteres para evitar overflow
  @MaxLength(255, { message: 'O nome do setor deve ter no máximo 255 caracteres.' })
  // Mapeia para a coluna nome da tabela setor
  nome: string;

  // Documenta o campo empresa_cliente_id como obrigatório no Swagger
  @ApiProperty({
    description:
      'ID da empresa cliente usada como escopo da verificação de duplicata. ' +
      'A rota verifica se já existe um setor com o mesmo nome vinculado a alguma unidade desta empresa.',
    example: 3,
  })
  // Converte para número inteiro antes de validar (evita erro quando enviado como string)
  @Type(() => Number)
  // Garante que o valor é um número inteiro
  @IsInt({ message: 'O empresa_cliente_id deve ser um número inteiro.' })
  // Garante que o ID seja positivo (IDs do banco são sempre > 0)
  @Min(1, { message: 'O empresa_cliente_id deve ser maior que zero.' })
  // Usado somente para verificação de duplicata — NÃO é inserido na tabela setor
  empresa_cliente_id: number;

  // ── Campo opcional ────────────────────────────────────────────────────────────

  // Documenta o campo status como opcional no Swagger
  @ApiPropertyOptional({
    description: 'Status ativo/inativo do setor (padrão: true aplicado pelo banco)',
    example: true,
    default: true,
  })
  // Campo opcional — o banco aplica default true automaticamente se não enviado
  @IsOptional()
  // Garante que o valor, quando presente, é um boolean
  @IsBoolean({ message: 'O status deve ser verdadeiro ou falso.' })
  // Mapeia para a coluna status da tabela setor
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
