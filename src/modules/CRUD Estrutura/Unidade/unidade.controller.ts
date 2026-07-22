// Importa os decorators do NestJS necessários para definir a rota e extrair o body
import { Controller, Post, Body, UsePipes, ValidationPipe, HttpCode, HttpStatus } from '@nestjs/common';
// Importa os decorators do Swagger para documentação automática da API
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiCreatedResponse } from '@nestjs/swagger';
// Importa o service responsável pela lógica de criação de unidade
import { UnidadeService } from './unidade.service';
// Importa o DTO que define e valida os dados do body da requisição
import { CreateUnidadeDto } from './unidade.dto';

// Agrupa este controller na categoria "CRUD - Unidade" na documentação do Swagger
@ApiTags('CRUD - Unidade')
// Define o prefixo base da rota: todas as rotas deste controller começam com /criar/unidade
@Controller('criar/unidade')
export class UnidadeController {
  // Injeta o UnidadeService via construtor para delegar a lógica de negócio
  constructor(private readonly unidadeService: UnidadeService) {}

  // Documenta a operação no Swagger UI com descrição detalhada do endpoint
  @ApiOperation({
    summary: 'Criar nova unidade',
    description:
      'Cria uma nova unidade cliente vinculada a uma empresa existente. ' +
      'Os campos razao_social e empresa_cliente_id são obrigatórios. ' +
      'A razão social é verificada de forma case-insensitive dentro da mesma empresa — ' +
      'se já existir uma unidade com o mesmo nome (independente de maiúsculas/minúsculas), ' +
      'a requisição é rejeitada com HTTP 409. ' +
      'Se a empresa informada não existir, retorna HTTP 404.',
  })
  // Documenta o corpo esperado da requisição no Swagger
  @ApiBody({ type: CreateUnidadeDto })
  // Documenta a resposta de sucesso (HTTP 201 Created) com exemplo real dos campos
  @ApiCreatedResponse({
    description: 'Unidade criada com sucesso.',
    schema: {
      example: {
        message: 'Unidade criada com sucesso.',
        data: {
          id: 15,
          razao_social: 'Unidade São Paulo - Matriz',
          documento: '98.765.432/0002-10',
          address: 'Av. Paulista, 1000 - São Paulo/SP',
          complemento: 'Andar 5, Torre Norte',
          tel: '(11) 3333-4444',
          status: true,
          empresa_cliente_id: 3,
        },
      },
    },
  })
  // Documenta a resposta de erro de validação (HTTP 400)
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos — campos obrigatórios ausentes ou com formato incorreto.',
  })
  // Documenta a resposta de conflito (HTTP 409)
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Já existe uma unidade com essa razão social nesta empresa (verificação case-insensitive).',
  })
  // Documenta a resposta de empresa não encontrada (HTTP 404)
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'A empresa informada (empresa_cliente_id) não existe no banco de dados.',
  })
  // Define a rota como POST em /criar/unidade
  @Post()
  // Garante que a resposta bem-sucedida retorna HTTP 201 Created
  @HttpCode(HttpStatus.CREATED)
  // Aplica o ValidationPipe: valida o body, remove campos desconhecidos e transforma tipos via @Transform/@Type
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  // Método assíncrono que recebe o body validado e delega a criação ao service
  async criar(
    // Extrai e injeta o body da requisição já validado e transformado pelo DTO
    @Body() dto: CreateUnidadeDto,
  ) {
    // Chama o método criar do service e retorna o resultado ao cliente da API
    return this.unidadeService.criar(dto);
  }
}
