// Importa os decorators Controller, Get e Param do NestJS para manipulação de requisições HTTP
import { Controller, Get, Param } from '@nestjs/common';
// Importa o serviço do menu para obtermos os dados do menu
import { MenuService } from './menu.service';

// Define que este controller vai responder à rota base '/menu'
@Controller('menu')
export class MenuController {
  // Injeta o MenuService via construtor para poder ser utilizado nos endpoints
  constructor(private readonly menuService: MenuService) {}

  // Define um endpoint do tipo GET com um parâmetro de rota ':id'
  @Get(':id')
  // Método getMenu recebe o id a partir da URL usando o decorator @Param
  getMenu(@Param('id') id: string) {
    // Chama o serviço getMenu passando o id e retorna o resultado formatado como JSON
    return this.menuService.getMenu(id);
  }
}
