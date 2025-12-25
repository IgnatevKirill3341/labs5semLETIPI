import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface ExchangeSettings {
  startDate: string;
  dateChangeSpeed: number; // seconds
  isTrading: boolean;
  currentDate?: string;
}

@Injectable()
export class ExchangeService {
  private readonly dataPath = path.join(__dirname, '../../data/exchange.json');

  constructor() {
    this.ensureDataFile();
  }

  private ensureDataFile() {
    const dir = path.dirname(this.dataPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.dataPath)) {
      const defaultSettings: ExchangeSettings = {
        startDate: new Date().toISOString().split('T')[0],
        dateChangeSpeed: 1,
        isTrading: false,
      };
      fs.writeFileSync(this.dataPath, JSON.stringify(defaultSettings, null, 2));
    }
  }

  getSettings(): ExchangeSettings {
    try {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return {
        startDate: new Date().toISOString().split('T')[0],
        dateChangeSpeed: 1,
        isTrading: false,
      };
    }
  }

  updateSettings(settings: Partial<ExchangeSettings>): ExchangeSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    this.saveSettings(updated);
    return updated;
  }

  private saveSettings(settings: ExchangeSettings) {
    fs.writeFileSync(this.dataPath, JSON.stringify(settings, null, 2));
  }
}


