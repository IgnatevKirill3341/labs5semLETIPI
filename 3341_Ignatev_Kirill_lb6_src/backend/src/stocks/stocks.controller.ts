import { Controller, Get, Put, Body, Param, Post } from '@nestjs/common';
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

  @Post(':symbol/fetch-historical')
  async fetchHistoricalData(@Param('symbol') symbol: string): Promise<Stock | null> {
    return this.stocksService.updateHistoricalDataFromSource(symbol);
  }

  @Post('fetch-all-historical')
  async fetchAllHistoricalData(): Promise<{ message: string }> {
    await this.stocksService.updateAllHistoricalData();
    return { message: 'Historical data update initiated' };
  }

  @Post(':symbol/import-csv')
  importCsvForSymbol(@Param('symbol') symbol: string): Stock | null {
    return this.stocksService.updateHistoricalDataFromCsv(symbol);
  }

  @Post('import-csv')
  importCsvForAll(): { updated: number; skipped: string[] } {
    return this.stocksService.updateAllHistoricalDataFromCsv();
  }
}


