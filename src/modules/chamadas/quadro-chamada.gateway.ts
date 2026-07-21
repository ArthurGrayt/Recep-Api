import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

// O decorator WebSocketGateway abre a porta para a conexão. 
// O cors: { origin: '*' } permite que o frontend se conecte sem problemas de CORS.
@WebSocketGateway({ cors: { origin: '*' } })
export class QuadroChamadaGateway implements OnGatewayConnection, OnGatewayDisconnect {
  
  // Instância do servidor Socket.io
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Cliente conectado no WebSocket do Quadro de Chamadas: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
  }

  // Função para emitir um evento para todos os clientes conectados
  notificarAtualizacaoFila(acao: string, detalhes?: any) {
    // Emite o evento 'fila_atualizada' genérico, enviando qual foi a ação
    this.server.emit('fila_atualizada', { acao, detalhes });
  }
}
