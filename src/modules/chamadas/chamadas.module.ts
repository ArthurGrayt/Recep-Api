// Importa o decorator Module do NestJS
import { Module } from '@nestjs/common';
import { QuadroChamadaGateway } from './quadro-chamada.gateway'; // Import atualizado

// Importa o controller de chamadas com todos os endpoints do fluxo
import { ChamadasController } from './chamadas.controller';

// Importa o service com toda a lógica de negócio do módulo
import { ChamadasService } from './chamadas.service';

//import do websocket
import { TelaChamadaGateway } from './tela-chamada.gateway';

// Define e configura o módulo de chamadas
@Module({
  // Registra o controller para que o NestJS exponha as rotas HTTP
  controllers: [ChamadasController],

  // Registra o service como provider para injeção de dependência no controller
  providers: [ChamadasService, TelaChamadaGateway, QuadroChamadaGateway],
})
export class ChamadasModule {}

