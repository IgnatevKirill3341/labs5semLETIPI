import { Controller, Get, Put, Body, Param } from '@nestjs/common';
import { StocksService, Stock, StockPrice } from './stocks.service';

@Controller('api/stocks')
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Get()
  getAllStocks(): Stock[] {
    return this.stocksService.getAllStocks();
  }

  @Get(':symbol')
  getStockBySymbol(@Param('symbol') symbol: string): Stock | null {
    return this.stocksService.getStockBySymbol(symbol);
  }

  @Put(':symbol')
  updateStock(@Param('symbol') symbol: string, @Body() updates: Partial<Stock>): Stock | null {
    return this.stocksService.updateStock(symbol, updates);
  }

  @Put(':symbol/historical')
  updateHistoricalData(@Param('symbol') symbol: string, @Body() historicalData: StockPrice[]): Stock | null {
    return this.stocksService.updateHistoricalData(symbol, historicalData);
  }
}


