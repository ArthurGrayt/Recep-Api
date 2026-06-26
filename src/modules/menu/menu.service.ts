// Importa o decorator Injectable do NestJS, usado para indicar que essa classe pode ser injetada como dependência
import { Injectable } from '@nestjs/common';

// Decora a classe como um serviço que pode ser utilizado em outros lugares do módulo
@Injectable()
export class MenuService {
  // Cria um método getMenu que recebe o id do menu e retorna o objeto esperado
  getMenu(id: string) {
    // Retorna o objeto JSON formatado conforme a interface ApiResponse e MenuItem
    return {
      // Propriedade success indica que a requisição foi bem sucedida
      success: true,
      // Propriedade status contendo o código HTTP 200
      status: 200,
      // Propriedade message com uma mensagem descritiva
      message: 'Menus carregados com sucesso',
      // Propriedade object contendo um array de menus (MenuItems)
      object: [
        {
          // id do primeiro menu
          id: '1',
          // label do primeiro menu
          label: 'Início',
          // ícone exato da biblioteca lucide-react em PascalCase
          icon: 'House',
          // rota para a qual o link vai apontar
          path: '/home',
          // order para ordenar os menus
          order: 1,
        },
        {
          // id do segundo menu
          id: '2',
          // label do segundo menu
          label: 'Configurações',
          // ícone exato da biblioteca lucide-react em PascalCase
          icon: 'Settings',
          // rota base deste menu
          path: '/config',
          // order para ordenar os menus
          order: 2,
          // Propriedade children que é um array contendo os sub-menus
          children: [
            {
              // id do sub-menu
              id: '2-1',
              // label do sub-menu
              label: 'Perfil',
              // ícone do sub-menu
              icon: 'User',
              // rota específica do sub-menu
              path: '/config/perfil',
            },
          ],
        },
      ],
    };
  }
}
