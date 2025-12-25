import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TradingService } from './trading.service';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  },
})
export class TradingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly tradingService: TradingService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  startTrading() {
    this.tradingService.startTrading((update) => {
      this.server.emit('trading-update', update);
    });
  }

  stopTrading() {
    this.tradingService.stopTrading();
  }

  getTradingStatus() {
    return this.tradingService.isTrading();
  }
}


