// Importa o decorator Module do NestJS
import { Module } from '@nestjs/common';

// Importa o controller de chamadas com todos os endpoints do fluxo
import { ChamadasController } from './chamadas.controller';

// Importa o service com toda a lógica de negócio do módulo
import { ChamadasService } from './chamadas.service';

// Define e configura o módulo de chamadas
@Module({
  // Registra o controller para que o NestJS exponha as rotas HTTP
  controllers: [ChamadasController],

  // Registra o service como provider para injeção de dependência no controller
  providers: [ChamadasService],
})
export class ChamadasModule {}
