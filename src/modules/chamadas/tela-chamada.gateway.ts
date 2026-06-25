import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets'; // [1]
import { Server } from 'socket.io'; // [2]

@WebSocketGateway({ namespace: '/tela-chamada', cors: true }) // [3]
export class TelaChamadaGateway {
  @WebSocketServer() 
  server: Server; // [4]

  emitirChamadaAgendada(ticket: string, sala: number, nome: string) { // [5]
    this.server.emit('nova_chamada_agendada', { ticket, sala, nome }); 
  }

  emitirChamadaSemAgendamento(ticket: string, sala: string) { // [6]
    this.server.emit('nova_chamada_recepcao', { ticket, sala });
  }
}
