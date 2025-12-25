import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TradingService } from './trading.service';
export declare class TradingGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly tradingService;
    server: Server;
    constructor(tradingService: TradingService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    startTrading(): void;
    stopTrading(): void;
    getTradingStatus(): boolean;
}
