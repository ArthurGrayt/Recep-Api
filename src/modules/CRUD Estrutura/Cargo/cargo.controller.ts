// Importa os decorators do NestJS necessários para definir a rota e extrair o body
import { Controller, Post, Body, UsePipes, ValidationPipe, HttpCode, HttpStatus } from '@nestjs/common';
// Importa os decorators do Swagger para documentação automática da API
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiCreatedResponse } from '@nestjs/swagger';
// Importa o service responsável pela lógica de criação de cargo
import { CargoService } from './cargo.service';
// Importa o DTO que define e valida os dados do body
import { CreateCargoDto } from './cargo.dto';

// Agrupa este controller na categoria "CRUD - Cargo" na documentação do Swagger
@ApiTags('CRUD - Cargo')
// Define o prefixo base da rota
@Controller('criar/cargo')
export class CargoController {
  // Injeta o CargoService
  constructor(private readonly cargoService: CargoService) {}

  @ApiOperation({
    summary: 'Criar novo cargo',
    description:
      'Cria um novo cargo na tabela `cargo`. ' +
      'O campo `nome` é obrigatório. ' +
      'O campo `empresa_cliente_id` é usado apenas para escopo da verificação de duplicata: ' +
      'a rota verifica se já existe um cargo com o mesmo nome (case-insensitive) vinculado ' +
      'a alguma unidade desta empresa (via cargo_setor_unidade → unidade_setor → unidade_cliente). ' +
      'O `empresa_cliente_id` NÃO é inserido na tabela cargo.',
  })
  @ApiBody({ type: CreateCargoDto })
  @ApiCreatedResponse({
    description: 'Cargo criado com sucesso.',
    schema: {
      example: {
        message: 'Cargo criado com sucesso.',
        data: {
          id: 12,
          nome: 'Gerente de Vendas',
          status: true,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos — campos obrigatórios ausentes ou com formato incorreto.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'A empresa informada (empresa_cliente_id) não existe no banco de dados.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Já existe um cargo com esse nome vinculado a uma unidade desta empresa (verificação case-insensitive).',
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  async criar(@Body() dto: CreateCargoDto) {
    return this.cargoService.criar(dto);
  }
}
