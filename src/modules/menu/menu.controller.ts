// Importa os decorators Controller, Get e Param do NestJS para manipulação de requisições HTTP
import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
// Importa o serviço do menu para obtermos os dados do menu
import { MenuService } from './menu.service';

// Define que este controller vai responder à rota base '/menu'
@ApiTags('Menu')
@Controller('menu')
export class MenuController {
  // Injeta o MenuService via construtor para poder ser utilizado nos endpoints
  constructor(private readonly menuService: MenuService) {}

  // Define um endpoint do tipo GET com um parâmetro de rota ':id'
  @ApiOperation({
    summary: 'Buscar hierarquia do menu',
    description: 'Retorna a estrutura hierárquica completa do menu baseado no ID ou role do usuário logado.'
  })
  @Get(':id')
  // Método getMenu assíncrono que recebe o id a partir da URL usando o decorator @Param
  async getMenu(@Param('id') id: string) {
    // Chama o serviço getMenu (que busca no Supabase) passando o id e retorna o resultado
    return await this.menuService.getMenu(id);
  }
}
