import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { StocksService } from '../stocks/stocks.service';
import { ExchangeService } from '../exchange/exchange.service';
import { PortfolioService } from './portfolio.service';
import { BrokersService } from '../brokers/brokers.service';

export interface TradingUpdate {
  currentDate: string;
  prices: { [symbol: string]: number };
}

@Injectable()
export class TradingService {
  private tradingInterval: NodeJS.Timeout | null = null;
  private currentDateIndex: number = 0;
  private allDates: string[] = [];
  private latestPrices: Record<string, number> = {};

  constructor(
    private readonly stocksService: StocksService,
    private readonly exchangeService: ExchangeService,
    private readonly portfolioService: PortfolioService,
    private readonly brokersService: BrokersService,
  ) {}

  startTrading(onUpdate: (update: TradingUpdate) => void) {
    if (this.tradingInterval) {
      this.stopTrading();
    }
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

    this.latestPrices = prices;
    this.exchangeService.updateSettings({ currentDate });
    onUpdate({ currentDate, prices });
  }

  private parseDate(dateStr: string): Date {
    if (!dateStr) return new Date();
    if (dateStr.includes('/')) {
      const [month, day, year] = dateStr.split('/').map(Number);
      return new Date(year, month - 1, day);
    }
    // Fallback for ISO-like format (YYYY-MM-DD)
    if (dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, (month || 1) - 1, day || 1);
    }
    return new Date(dateStr);
  }

  isTrading(): boolean {
    return this.exchangeService.getSettings().isTrading;
  }

  getLatestPrices(): Record<string, number> {
    return this.latestPrices;
  }

  getCurrentDate(): string | undefined {
    return this.exchangeService.getSettings().currentDate;
  }

  private getPriceForSymbol(symbol: string): number {
    if (this.latestPrices[symbol] != null) {
      return this.latestPrices[symbol];
    }

    const currentDate = this.getCurrentDate();
    const stock = this.stocksService.getStockBySymbol(symbol);
    if (!stock) {
      throw new NotFoundException('Stock not found');
    }

    if (currentDate) {
      const dataPoint = stock.historicalData.find(d => d.date === currentDate);
      if (dataPoint) {
        return parseFloat(dataPoint.open.replace('$', ''));
      }
    }

    const lastPoint = stock.historicalData[stock.historicalData.length - 1];
    if (!lastPoint) {
      throw new BadRequestException('No price data available');
    }
    return parseFloat(lastPoint.open.replace('$', ''));
  }

  getPortfolio(brokerId: string) {
    const broker = this.brokersService.getAllBrokers().find(b => b.id === brokerId);
    if (!broker) {
      throw new NotFoundException('Broker not found');
    }
    const portfolio = this.portfolioService.getPortfolio(brokerId, broker.initialCash);
    return this.buildPortfolioView(portfolio);
  }

  buyStock(brokerId: string, symbol: string, quantity: number) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }
    const price = this.getPriceForSymbol(symbol);
    const total = price * quantity;

    const broker = this.brokersService.getAllBrokers().find(b => b.id === brokerId);
    if (!broker) {
      throw new NotFoundException('Broker not found');
    }

    const updated = this.portfolioService.updatePortfolio(brokerId, broker.initialCash, (portfolio) => {
      if (portfolio.cash < total) {
        throw new BadRequestException('Not enough cash to complete purchase');
      }

      const holdings = [...portfolio.holdings];
      const index = holdings.findIndex(h => h.symbol === symbol);
      if (index === -1) {
        holdings.push({ symbol, quantity, averagePrice: price });
      } else {
        const existing = holdings[index];
        const newQuantity = existing.quantity + quantity;
        const newAvg = ((existing.averagePrice * existing.quantity) + total) / newQuantity;
        holdings[index] = { ...existing, quantity: newQuantity, averagePrice: newAvg };
      }

      return { ...portfolio, cash: portfolio.cash - total, holdings };
    });

    return this.buildPortfolioView(updated);
  }

  sellStock(brokerId: string, symbol: string, quantity: number) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }
    const price = this.getPriceForSymbol(symbol);
    const broker = this.brokersService.getAllBrokers().find(b => b.id === brokerId);
    if (!broker) {
      throw new NotFoundException('Broker not found');
    }

    const updated = this.portfolioService.updatePortfolio(brokerId, broker.initialCash, (portfolio) => {
      const holdings = [...portfolio.holdings];
      const index = holdings.findIndex(h => h.symbol === symbol);
      if (index === -1 || holdings[index].quantity < quantity) {
        throw new BadRequestException('Not enough shares to sell');
      }

      const current = holdings[index];
      const remaining = current.quantity - quantity;
      if (remaining === 0) {
        holdings.splice(index, 1);
      } else {
        holdings[index] = { ...current, quantity: remaining };
      }

      return { ...portfolio, cash: portfolio.cash + price * quantity, holdings };
    });

    return this.buildPortfolioView(updated);
  }

  private buildPortfolioView(portfolio: { brokerId: string; cash: number; holdings: { symbol: string; quantity: number; averagePrice: number; }[]; }) {
    const latestPrices = this.getLatestPrices();
    let holdingsValue = 0;

    const holdings = portfolio.holdings.map((h) => {
      const currentPrice = latestPrices[h.symbol] ?? this.getPriceForSymbol(h.symbol);
      const marketValue = currentPrice * h.quantity;
      const profit = (currentPrice - h.averagePrice) * h.quantity;
      holdingsValue += marketValue;
      return {
        ...h,
        currentPrice,
        marketValue,
        profit,
      };
    });

    return {
      brokerId: portfolio.brokerId,
      cash: portfolio.cash,
      holdings,
      balance: portfolio.cash + holdingsValue,
      currentDate: this.getCurrentDate(),
      prices: latestPrices,
    };
  }
}


