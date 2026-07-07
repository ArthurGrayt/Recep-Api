import { Module } from '@nestjs/common';
// Importa o serviço de agendamentos
import { AgendamentosService } from './agendamentos.service';
// Importa o controlador de agendamentos
import { AgendamentosController } from './agendamentos.controller';
import { SalasModule } from '../salas/salas.module';

// Define as configurações do módulo usando o decorator
@Module({
  imports: [SalasModule],
  // Declara os controladores que fazem parte deste módulo
  controllers: [AgendamentosController],
  // Declara os provedores (serviços) que fazem parte deste módulo
  providers: [AgendamentosService],
})
// Exporta a classe do módulo para poder ser importada no módulo principal
export class AgendamentosModule {}
