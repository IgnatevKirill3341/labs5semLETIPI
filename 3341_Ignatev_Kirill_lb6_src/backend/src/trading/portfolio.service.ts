import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface Holding {
  symbol: string;
  quantity: number;
  averagePrice: number;
}

export interface Portfolio {
  brokerId: string;
  cash: number;
  holdings: Holding[];
}

@Injectable()
export class PortfolioService {
  private readonly dataPath = path.join(__dirname, '../../data/portfolios.json');

  constructor() {
    this.ensureDataFile();
  }

  private ensureDataFile() {
    const dir = path.dirname(this.dataPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.dataPath)) {
      fs.writeFileSync(this.dataPath, JSON.stringify({}, null, 2));
    }
  }

  private readAll(): Record<string, Portfolio> {
    try {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return {};
    }
  }

  private saveAll(data: Record<string, Portfolio>) {
    fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
  }

  getPortfolio(brokerId: string, initialCash: number): Portfolio {
    const all = this.readAll();
    if (!all[brokerId]) {
      all[brokerId] = {
        brokerId,
        cash: initialCash,
        holdings: [],
      };
      this.saveAll(all);
    }
    return all[brokerId];
  }

  updatePortfolio(
    brokerId: string,
    initialCash: number,
    updater: (portfolio: Portfolio) => Portfolio,
  ): Portfolio {
    const all = this.readAll();
    const current = all[brokerId] || {
      brokerId,
      cash: initialCash,
      holdings: [],
    };

    const updated = updater({ ...current, holdings: [...current.holdings] });
    all[brokerId] = updated;
    this.saveAll(all);
    return updated;
  }
}


