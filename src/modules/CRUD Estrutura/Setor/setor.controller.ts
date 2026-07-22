// Importa os decorators do NestJS necessários para definir a rota e extrair o body
import { Controller, Post, Body, UsePipes, ValidationPipe, HttpCode, HttpStatus } from '@nestjs/common';
// Importa os decorators do Swagger para documentação automática da API
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiCreatedResponse } from '@nestjs/swagger';
// Importa o service responsável pela lógica de criação de setor
import { SetorService } from './setor.service';
// Importa o DTO que define e valida os dados do body da requisição
import { CreateSetorDto } from './setor.dto';

// Agrupa este controller na categoria "CRUD -Setor" na documentação do Swagger
@ApiTags('CRUD -Setor')
// Define o prefixo base da rota: todas as rotas deste controller começam com /criar/setor
@Controller('criar/setor')
export class SetorController {
  // Injeta o SetorService via construtor para delegar a lógica de negócio
  constructor(private readonly setorService: SetorService) {}

  // Documenta a operação no Swagger UI com descrição detalhada do endpoint
  @ApiOperation({
    summary: 'Criar novo setor',
    description:
      'Cria um novo setor na tabela `setor`. ' +
      'O campo `nome` é obrigatório. ' +
      'O campo `empresa_cliente_id` é usado apenas para escopo da verificação de duplicata: ' +
      'a rota verifica se já existe um setor com o mesmo nome (case-insensitive) vinculado ' +
      'a alguma unidade desta empresa (via unidade_setor → unidade_cliente). ' +
      'O `empresa_cliente_id` NÃO é inserido na tabela setor — ' +
      'a vinculação com unidades é feita na tabela `unidade_setor`.',
  })
  // Documenta o corpo esperado da requisição no Swagger
  @ApiBody({ type: CreateSetorDto })
  // Documenta a resposta de sucesso (HTTP 201 Created)
  @ApiCreatedResponse({
    description: 'Setor criado com sucesso.',
    schema: {
      example: {
        message: 'Setor criado com sucesso.',
        data: {
          id: 8,
          nome: 'Operacional',
          status: true,
        },
      },
    },
  })
  // Documenta a resposta de erro de validação (HTTP 400)
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos — campos obrigatórios ausentes ou com formato incorreto.',
  })
  // Documenta a resposta de empresa não encontrada (HTTP 404)
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'A empresa informada (empresa_cliente_id) não existe no banco de dados.',
  })
  // Documenta a resposta de conflito (HTTP 409)
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Já existe um setor com esse nome vinculado a uma unidade desta empresa (verificação case-insensitive).',
  })
  // Define a rota como POST em /criar/setor
  @Post()
  // Garante que a resposta bem-sucedida retorna HTTP 201 Created
  @HttpCode(HttpStatus.CREATED)
  // Aplica o ValidationPipe: valida o body, remove campos desconhecidos e transforma tipos via @Type
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  // Método assíncrono que recebe o body validado e delega a criação ao service
  async criar(
    // Extrai e injeta o body da requisição já validado e transformado pelo DTO
    @Body() dto: CreateSetorDto,
  ) {
    // Chama o método criar do service e retorna o resultado ao cliente da API
    return this.setorService.criar(dto);
  }
}
