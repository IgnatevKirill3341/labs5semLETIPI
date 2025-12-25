import { Controller, Post, Delete, Get } from '@nestjs/common';
import { TradingGateway } from './trading.gateway';

@Controller('api/trading')
export class TradingController {
  constructor(private readonly tradingGateway: TradingGateway) {}

  @Post('start')
  startTrading() {
    this.tradingGateway.startTrading();
    return { success: true };
  }

  @Delete('stop')
  stopTrading() {
    this.tradingGateway.stopTrading();
    return { success: true };
  }

  @Get('status')
  getStatus() {
    return { isTrading: this.tradingGateway.getTradingStatus() };
  }
}


