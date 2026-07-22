// Importa os decorators do NestJS necessários para definir a rota e extrair o body
import { Controller, Post, Body, UsePipes, ValidationPipe, HttpCode, HttpStatus } from '@nestjs/common';
// Importa os decorators do Swagger para documentação automática da API
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiCreatedResponse } from '@nestjs/swagger';
// Importa o service responsável pela lógica de criação de empresa
import { EmpresaService } from './empresa.service';
// Importa o DTO que define e valida os dados do body da requisição
import { CreateEmpresaDto } from './empresa.dto';

// Agrupa este controller na categoria "CRUD - Empresa" na documentação do Swagger
@ApiTags('CRUD - Empresa')
// Define o prefixo base da rota: todas as rotas deste controller começam com /criar/empresa
@Controller('criar/empresa')
export class EmpresaController {
  // Injeta o EmpresaService via construtor para delegar a lógica de negócio
  constructor(private readonly empresaService: EmpresaService) {}

  // Documenta a operação no Swagger UI com descrição clara do endpoint
  @ApiOperation({
    summary: 'Criar nova empresa',
    description:
      'Cria uma nova empresa cliente na tabela empresa_cliente. ' +
      'O campo razao_social é obrigatório. ' +
      'O CNPJ, quando informado, deve conter apenas números (14 dígitos) e deve ser único no sistema. ' +
      'O nome_fantasia é opcional.',
  })
  // Documenta o corpo esperado da requisição no Swagger com exemplo
  @ApiBody({ type: CreateEmpresaDto })
  // Documenta a resposta de sucesso (HTTP 201 Created) com os campos reais da tabela
  @ApiCreatedResponse({
    description: 'Empresa criada com sucesso.',
    schema: {
      example: {
        message: 'Empresa criada com sucesso.',
        data: {
          id: 42,
          razao_social: 'Empresa Exemplo Ltda',
          documento: '12.345.678/0001-95',
          address: 'Rua das Flores, 123 - São Paulo/SP',
          complemento: 'Sala 302, Bloco B',
          email: 'contato@empresa.com.br',
          tel: '(11) 98765-4321',
          status: true,
        },
      },
    },
  })
  // Documenta a resposta de erro de validação (HTTP 400 Bad Request)
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos — campos obrigatórios ausentes ou com formato incorreto.',
  })
  // Documenta a resposta de conflito (HTTP 409 Conflict)
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Já existe uma empresa com o CNPJ informado.',
  })
  // Define a rota como POST em /crud/empresa
  @Post()
  // Garante que a resposta bem-sucedida retorna HTTP 201 Created
  @HttpCode(HttpStatus.CREATED)
  // Aplica o ValidationPipe: valida o body, remove campos desconhecidos e transforma tipos via @Transform
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  // Método assíncrono que recebe e valida o body e delega a criação ao service
  async criar(
    // Extrai e injeta o body da requisição já validado pelo DTO
    @Body() dto: CreateEmpresaDto,
  ) {
    // Chama o método criar do service e retorna o resultado para o cliente da API
    return this.empresaService.criar(dto);
  }
}
