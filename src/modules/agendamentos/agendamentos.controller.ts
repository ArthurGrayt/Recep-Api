// Importa os decorators necessários do pacote comum do NestJS, incluindo o Query para ler parâmetros da URL
import { Controller, Get, Query, Post, Body } from '@nestjs/common';
// Importa o serviço de agendamentos responsável pela lógica de negócio
import { AgendamentosService } from './agendamentos.service';

// Define este arquivo como um controlador e especifica o prefixo da rota como 'agendamentos'
@Controller('agendamentos')
export class AgendamentosController {
  // Injeta o AgendamentosService pelo construtor
  constructor(private readonly agendamentosService: AgendamentosService) {}

  // Define um endpoint do tipo GET para a raiz da rota '/agendamentos'
  @Get()
  // Método assíncrono para lidar com a requisição de buscar agendamentos
  async findAll(
    // Extrai o parâmetro "page" da query string (ex: ?page=1)
    @Query('page') page?: number,
    // Extrai o parâmetro "limit" da query string (ex: ?limit=10)
    @Query('limit') limit?: number,
    // Extrai o parâmetro "data_inicial" da query string (ex: ?data_inicial=2026-07-03)
    @Query('data_inicial') dataInicial?: string,
    // Extrai o parâmetro "data_final" da query string (ex: ?data_final=2026-07-05)
    @Query('data_final') dataFinal?: string,
    // Extrai o parâmetro "sala" da query string (ex: ?sala=2)
    @Query('sala') sala?: string,
  ) {
    // Define valores padrão para a paginação caso não sejam fornecidos
    const pageNumber = page ? Number(page) : 1;
    const limitNumber = limit ? Number(limit) : 10;
    const salaNumber = sala ? Number(sala) : undefined;

    // Chama o método findAll do serviço repassando a paginação e os filtros de data e sala
    return this.agendamentosService.findAll(pageNumber, limitNumber, dataInicial, dataFinal, salaNumber);
  }

  // Endpoint para criação de novos agendamentos
  @Post()
  async create(
    @Body() payload: { 
      colaborador_id?: string; 
      nome_avulso?: string;
      avulso?: boolean;
      cpf?: string;
      data_nascimento?: string;
      sexo?: string;
      funcao?: string;
      setor?: string;
      unidade?: number;
      aso_qtd_cobrar?: number;
      rac_qtd_cobrar?: number;
      exames: number[];
      obs_agendamento?: string;
      observacoes?: string;
      observacoes_laboratorial?: string;
    }
  ) {
    return this.agendamentosService.create(payload);
  }
}
