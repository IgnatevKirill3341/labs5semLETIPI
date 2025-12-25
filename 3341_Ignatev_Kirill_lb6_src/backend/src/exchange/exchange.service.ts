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
        startDate: this.formatDate(new Date()),
        dateChangeSpeed: 1,
        isTrading: false,
      };
      fs.writeFileSync(this.dataPath, JSON.stringify(defaultSettings, null, 2));
    }
  }

  getSettings(): ExchangeSettings {
    try {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      const parsed = JSON.parse(data);
      return {
        ...parsed,
        startDate: this.normalizeDateToIso(parsed.startDate),
      };
    } catch (error) {
      return {
        startDate: this.formatDate(new Date()),
        dateChangeSpeed: 1,
        isTrading: false,
      };
    }
  }

  updateSettings(settings: Partial<ExchangeSettings>): ExchangeSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    if (updated.startDate) {
      updated.startDate = this.normalizeDateToIso(updated.startDate);
    }
    this.saveSettings(updated);
    return updated;
  }

  private saveSettings(settings: ExchangeSettings) {
    fs.writeFileSync(this.dataPath, JSON.stringify(settings, null, 2));
  }

  private formatDate(date: Date): string {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}/${day}/${date.getFullYear()}`;
  }

  // Converts "MM/DD/YYYY" or other formats to "YYYY-MM-DD" for input[type=date] compatibility
  private normalizeDateToIso(dateStr: string): string {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    // If already ISO
    if (dateStr.includes('-')) return dateStr;
    if (dateStr.includes('/')) {
      const [month, day, year] = dateStr.split('/').map(Number);
      const isoDate = new Date(year, month - 1, day || 1).toISOString().split('T')[0];
      return isoDate;
    }
    // Fallback
    try {
      return new Date(dateStr).toISOString().split('T')[0];
    } catch (e) {
      return new Date().toISOString().split('T')[0];
    }
  }
}


