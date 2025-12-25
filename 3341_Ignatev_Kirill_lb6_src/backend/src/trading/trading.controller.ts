import { Controller, Post, Delete, Get, Body, Param } from '@nestjs/common';
import { TradingGateway } from './trading.gateway';
import { TradingService } from './trading.service';

@Controller('api/trading')
export class TradingController {
  constructor(
    private readonly tradingGateway: TradingGateway,
    private readonly tradingService: TradingService,
  ) {}

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

  @Get('brokers/:brokerId/portfolio')
  getPortfolio(@Param('brokerId') brokerId: string) {
    return this.tradingService.getPortfolio(brokerId);
  }

  @Post('brokers/:brokerId/buy')
  buy(
    @Param('brokerId') brokerId: string,
    @Body() body: { symbol: string; quantity: number },
  ) {
    return this.tradingService.buyStock(brokerId, body.symbol, Number(body.quantity));
  }

  @Post('brokers/:brokerId/sell')
  sell(
    @Param('brokerId') brokerId: string,
    @Body() body: { symbol: string; quantity: number },
  ) {
    return this.tradingService.sellStock(brokerId, body.symbol, Number(body.quantity));
  }
}


