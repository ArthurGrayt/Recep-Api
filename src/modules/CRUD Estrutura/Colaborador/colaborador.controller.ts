import { Controller, Post, Patch, Body, Param, UsePipes, ValidationPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { ColaboradorService } from './colaborador.service';
import { CreateColaboradorDto, AlocarColaboradorDto } from './colaborador.dto';

@ApiTags('CRUD - Colaborador')
@Controller('criar/colaborador')
export class ColaboradorController {
  constructor(private readonly colaboradorService: ColaboradorService) {}

  @ApiOperation({
    summary: 'Criar novo colaborador',
    description: 'Cria um novo colaborador na tabela `colaboradores`.'
  })
  @ApiBody({ type: CreateColaboradorDto })
  @ApiCreatedResponse({
    description: 'Colaborador criado com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos.',
  })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  @Post()
  async criar(@Body() dto: CreateColaboradorDto) {
    return this.colaboradorService.criar(dto);
  }

  @ApiOperation({
    summary: 'Alocar colaborador a uma unidade, setor e cargo',
    description: 'Cria os vínculos necessários nas tabelas relacionais para que o colaborador faça parte da unidade.'
  })
  @ApiBody({ type: AlocarColaboradorDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Colaborador alocado com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos.',
  })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  @Patch(':id/alocar')
  async alocar(@Param('id') id: string, @Body() dto: AlocarColaboradorDto) {
    return this.colaboradorService.alocar(id, dto);
  }
}
