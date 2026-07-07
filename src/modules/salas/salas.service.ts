import { Injectable } from '@nestjs/common';

@Injectable()
export class SalasService {
  getMapeamentoCategorias() {
    return {
      60: 2, // EXAMES AVULSOS -> Sala 2 (Consultório)
      61: 2, // FICHAS CLINICAS -> Sala 2 (Consultório)
      54: 3, // VISUAL -> Sala 3 (Exames)
      56: 3, // PSICOLÓGICO -> Sala 3 (Exames)
      59: 3, // ELETRO -> Sala 3 (Exames)
      57: 4, // TOXICOLÓGICO -> Sala 4 (Coleta)
      21: 4, // LABORATORIAL -> Sala 4 (Coleta)
      55: 5, // AUDITIVO -> Sala 5 (Audiometria)
      58: 6, // RAIO-X -> Sala 6 (Raio-X)
    };
  }
}
