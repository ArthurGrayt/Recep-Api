// Importa o decorator Module do NestJS, usado para organizar a estrutura da aplicação
import { Module } from '@nestjs/common';
// Importa o MenuController que acabamos de criar
import { MenuController } from './menu.controller';
// Importa o MenuService que acabamos de criar
import { MenuService } from './menu.service';

// Utiliza o decorator Module para declarar o novo módulo MenuModule
@Module({
  // Registra o MenuController para lidar com as rotas
  controllers: [MenuController],
  // Registra o MenuService para lidar com as regras de negócio
  providers: [MenuService],
})
// Exporta a classe do módulo para ser importada no módulo principal da aplicação
export class MenuModule {}
