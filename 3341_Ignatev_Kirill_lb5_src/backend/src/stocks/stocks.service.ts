import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface StockPrice {
  date: string;
  open: string;
}

export interface Stock {
  symbol: string;
  companyName: string;
  isActive: boolean;
  historicalData: StockPrice[];
}

@Injectable()
export class StocksService {
  private readonly dataPath = path.join(__dirname, '../../data/stocks.json');
  private readonly defaultStocks: Omit<Stock, 'historicalData'>[] = [
    { symbol: 'AAPL', companyName: 'Apple, Inc.', isActive: false },
    { symbol: 'SBUX', companyName: 'Starbucks, Inc.', isActive: false },
    { symbol: 'MSFT', companyName: 'Microsoft, Inc.', isActive: false },
    { symbol: 'CSCO', companyName: 'Cisco Systems, Inc.', isActive: false },
    { symbol: 'QCOM', companyName: 'QUALCOMM Incorporated', isActive: false },
    { symbol: 'AMZN', companyName: 'Amazon.com, Inc.', isActive: false },
    { symbol: 'TSLA', companyName: 'Tesla, Inc.', isActive: false },
    { symbol: 'AMD', companyName: 'Advanced Micro Devices, Inc.', isActive: false },
  ];

  constructor() {
    this.ensureDataFile();
  }

  private ensureDataFile() {
    const dir = path.dirname(this.dataPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.dataPath)) {
      const initialStocks: Stock[] = this.defaultStocks.map(stock => ({
        ...stock,
        historicalData: this.generateSampleData(),
      }));
      fs.writeFileSync(this.dataPath, JSON.stringify(initialStocks, null, 2));
    }
  }

  private generateSampleData(): StockPrice[] {
    const data: StockPrice[] = [];
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 2);
    
    for (let i = 0; i < 730; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const price = (Math.random() * 200 + 50).toFixed(2);
      data.push({
        date: `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,
        open: `$${price}`,
      });
    }
    return data.reverse();
  }

  getAllStocks(): Stock[] {
    try {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  getStockBySymbol(symbol: string): Stock | null {
    const stocks = this.getAllStocks();
    return stocks.find(s => s.symbol === symbol) || null;
  }

  updateStock(symbol: string, updates: Partial<Stock>): Stock | null {
    const stocks = this.getAllStocks();
    const index = stocks.findIndex(s => s.symbol === symbol);
    if (index === -1) return null;
    
    stocks[index] = { ...stocks[index], ...updates };
    this.saveStocks(stocks);
    return stocks[index];
  }

  updateHistoricalData(symbol: string, historicalData: StockPrice[]): Stock | null {
    const stocks = this.getAllStocks();
    const index = stocks.findIndex(s => s.symbol === symbol);
    if (index === -1) return null;
    
    stocks[index].historicalData = historicalData;
    this.saveStocks(stocks);
    return stocks[index];
  }

  private saveStocks(stocks: Stock[]) {
    fs.writeFileSync(this.dataPath, JSON.stringify(stocks, null, 2));
  }
}


