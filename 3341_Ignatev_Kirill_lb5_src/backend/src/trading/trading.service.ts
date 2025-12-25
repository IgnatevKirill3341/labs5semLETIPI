import { Injectable } from '@nestjs/common';
import { StocksService } from '../stocks/stocks.service';
import { ExchangeService } from '../exchange/exchange.service';

export interface TradingUpdate {
  currentDate: string;
  prices: { [symbol: string]: number };
}

@Injectable()
export class TradingService {
  private tradingInterval: NodeJS.Timeout | null = null;
  private currentDateIndex: number = 0;
  private allDates: string[] = [];

  constructor(
    private readonly stocksService: StocksService,
    private readonly exchangeService: ExchangeService,
  ) {}

  startTrading(onUpdate: (update: TradingUpdate) => void) {
    const settings = this.exchangeService.getSettings();
    const stocks = this.stocksService.getAllStocks().filter(s => s.isActive);
    
    if (stocks.length === 0) {
      throw new Error('No active stocks selected');
    }

    // Collect all unique dates from active stocks
    const dateSet = new Set<string>();
    stocks.forEach(stock => {
      stock.historicalData.forEach(data => {
        dateSet.add(data.date);
      });
    });
    
    this.allDates = Array.from(dateSet).sort((a, b) => {
      const dateA = this.parseDate(a);
      const dateB = this.parseDate(b);
      return dateA.getTime() - dateB.getTime();
    });

    // Find start date index
    const startDate = this.parseDate(settings.startDate);
    this.currentDateIndex = this.allDates.findIndex(date => {
      const d = this.parseDate(date);
      return d >= startDate;
    });
    
    if (this.currentDateIndex === -1) {
      this.currentDateIndex = 0;
    }

    this.exchangeService.updateSettings({ isTrading: true });
    this.sendUpdate(onUpdate);
    
    this.tradingInterval = setInterval(() => {
      this.currentDateIndex++;
      if (this.currentDateIndex >= this.allDates.length) {
        this.stopTrading();
        return;
      }
      this.sendUpdate(onUpdate);
    }, settings.dateChangeSpeed * 1000);
  }

  stopTrading() {
    if (this.tradingInterval) {
      clearInterval(this.tradingInterval);
      this.tradingInterval = null;
    }
    this.exchangeService.updateSettings({ isTrading: false });
  }

  private sendUpdate(onUpdate: (update: TradingUpdate) => void) {
    if (this.currentDateIndex >= this.allDates.length) {
      return;
    }

    const currentDate = this.allDates[this.currentDateIndex];
    const stocks = this.stocksService.getAllStocks().filter(s => s.isActive);
    const prices: { [symbol: string]: number } = {};

    stocks.forEach(stock => {
      const dataPoint = stock.historicalData.find(d => d.date === currentDate);
      if (dataPoint) {
        const price = parseFloat(dataPoint.open.replace('$', ''));
        prices[stock.symbol] = price;
      }
    });

    this.exchangeService.updateSettings({ currentDate });
    onUpdate({ currentDate, prices });
  }

  private parseDate(dateStr: string): Date {
    const [month, day, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  }

  isTrading(): boolean {
    return this.exchangeService.getSettings().isTrading;
  }
}


