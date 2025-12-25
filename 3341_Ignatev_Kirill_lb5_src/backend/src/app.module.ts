import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { BrokersController } from './brokers/brokers.controller';
import { BrokersService } from './brokers/brokers.service';
import { StocksController } from './stocks/stocks.controller';
import { StocksService } from './stocks/stocks.service';
import { ExchangeController } from './exchange/exchange.controller';
import { ExchangeService } from './exchange/exchange.service';
import { TradingGateway } from './trading/trading.gateway';
import { TradingService } from './trading/trading.service';
import { TradingController } from './trading/trading.controller';

@Module({
  imports: [],
  controllers: [AppController, BrokersController, StocksController, ExchangeController, TradingController],
  providers: [BrokersService, StocksService, ExchangeService, TradingGateway, TradingService],
})
export class AppModule {}

