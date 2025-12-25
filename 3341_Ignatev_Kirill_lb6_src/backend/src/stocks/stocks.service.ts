import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

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
  private readonly logger = new Logger(StocksService.name);
  private readonly dataPath = path.join(__dirname, '../../data/stocks.json');
  private readonly alphaVantageApiKey = process.env.ALPHA_VANTAGE_API_KEY;
  private readonly finnhubApiKey = process.env.FINNHUB_API_KEY;
  private readonly dataSource = process.env.STOCK_DATA_SOURCE || 'csv'; // 'csv', 'alphavantage', 'finnhub', 'alternative'
  private readonly csvPath = path.join(__dirname, '../../CSV');
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
      // При первом создании файла используем случайные данные
      // Реальные данные можно загрузить через endpoint POST /api/stocks/fetch-all-historical
      const initialStocks: Stock[] = this.defaultStocks.map(stock => ({
        ...stock,
        historicalData: this.generateSampleData(),
      }));
      fs.writeFileSync(this.dataPath, JSON.stringify(initialStocks, null, 2));
      this.logger.log('Initial stocks file created with sample data. Use POST /api/stocks/fetch-all-historical to load real data.');
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

  /**
   * Правильный парсинг CSV строки с учетом кавычек
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }


  /**
   * Получает данные из локальных CSV файлов (backend/CSV/{SYMBOL}.csv)
   * Формат: Date,Close/Last,Volume,Open,High,Low
   */
  private fetchHistoricalDataFromCsv(symbol: string): StockPrice[] {
    // Ищем файл без учета регистра
    if (!fs.existsSync(this.csvPath)) {
      this.logger.warn(`CSV folder not found: ${this.csvPath}`);
      return [];
    }

    const files = fs.readdirSync(this.csvPath);
    const fileName = files.find(f => f.toLowerCase() === `${symbol.toLowerCase()}.csv`);
    if (!fileName) {
      this.logger.warn(`CSV for ${symbol} not found in ${this.csvPath}`);
      return [];
    }

    const filePath = path.join(this.csvPath, fileName);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split('\n').filter(Boolean);
    if (lines.length < 2) {
      this.logger.warn(`CSV for ${symbol} has no data`);
      return [];
    }

    const prices: StockPrice[] = [];
    // Первая строка — заголовок
    for (let i = 1; i < lines.length; i++) {
      const columns = this.parseCSVLine(lines[i]);
      // Ожидаем минимум столбцы: Date,Close/Last,Volume,Open,High,Low
      if (columns.length < 4) continue;

      const dateStr = columns[0].trim();
      const openStr = columns[3].replace(/[$,\s"]/g, '');
      const openPrice = parseFloat(openStr);

      if (!dateStr || isNaN(openPrice) || openPrice <= 0) continue;

      prices.push({
        date: dateStr, // уже в формате MM/DD/YYYY
        open: `$${openPrice.toFixed(2)}`,
      });
    }

    // Сортируем по дате (от старых к новым)
    prices.sort((a, b) => {
      const dateA = this.parseDate(a.date);
      const dateB = this.parseDate(b.date);
      return dateA.getTime() - dateB.getTime();
    });

    this.logger.log(`Loaded ${prices.length} points for ${symbol} from CSV`);
    return prices;
  }

  /**
   * Обновляет исторические данные для акции из CSV
   */
  updateHistoricalDataFromCsv(symbol: string): Stock | null {
    const data = this.fetchHistoricalDataFromCsv(symbol);
    if (!data.length) {
      return null;
    }
    return this.updateHistoricalData(symbol, data);
  }

  /**
   * Обновляет исторические данные для всех акций из CSV
   */
  updateAllHistoricalDataFromCsv(): { updated: number; skipped: string[] } {
    const stocks = this.getAllStocks();
    let updated = 0;
    const skipped: string[] = [];

    stocks.forEach(stock => {
      const result = this.updateHistoricalDataFromCsv(stock.symbol);
      if (result) {
        updated += 1;
      } else {
        skipped.push(stock.symbol);
      }
    });

    this.logger.log(`CSV import: updated=${updated}, skipped=${skipped.length}`);
    return { updated, skipped };
  }

  /**
   * Получает данные через Alpha Vantage API (бесплатный, нужен ключ)
   * Получить ключ: https://www.alphavantage.co/support/#api-key
   */
  private async fetchHistoricalDataFromAlphaVantage(symbol: string, period: number = 730): Promise<StockPrice[]> {
    try {
      const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${this.alphaVantageApiKey}&outputsize=full`;
      
      return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
          hostname: urlObj.hostname,
          path: urlObj.pathname + urlObj.search,
          method: 'GET',
        };
        
        const req = https.request(options, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              
              if (json['Error Message'] || json['Note']) {
                this.logger.warn(`Alpha Vantage error for ${symbol}: ${json['Error Message'] || json['Note']}`);
                this.fetchHistoricalDataAlternative(symbol, period)
                  .then(resolve)
                  .catch(reject);
                return;
              }
              
              const timeSeries = json['Time Series (Daily)'];
              if (!timeSeries) {
                throw new Error('No time series data in response');
              }
              
              const prices: StockPrice[] = [];
              const dates = Object.keys(timeSeries).sort();
              
              // Берем последние N дней
              const recentDates = dates.slice(-period);
              
              for (const dateStr of recentDates) {
                const dayData = timeSeries[dateStr];
                const openPrice = parseFloat(dayData['1. open']);
                
                if (!isNaN(openPrice) && openPrice > 0) {
                  // Конвертируем дату из YYYY-MM-DD в MM/DD/YYYY
                  const [year, month, day] = dateStr.split('-');
                  const formattedDate = `${month}/${day}/${year}`;
                  
                  prices.push({
                    date: formattedDate,
                    open: `$${openPrice.toFixed(2)}`,
                  });
                }
              }
              
              if (prices.length === 0) {
                throw new Error('No valid price data found');
              }
              
              this.logger.log(`Fetched ${prices.length} data points from Alpha Vantage for ${symbol}`);
              resolve(prices);
            } catch (error) {
              this.logger.error(`Error parsing Alpha Vantage response for ${symbol}:`, error);
              this.fetchHistoricalDataAlternative(symbol, period)
                .then(resolve)
                .catch(reject);
            }
          });
        });
        
        req.on('error', (error) => {
          this.logger.error(`Error fetching from Alpha Vantage for ${symbol}:`, error);
          this.fetchHistoricalDataAlternative(symbol, period)
            .then(resolve)
            .catch(reject);
        });
        
        req.setTimeout(10000, () => {
          req.destroy();
          this.fetchHistoricalDataAlternative(symbol, period)
            .then(resolve)
            .catch(reject);
        });
        
        req.end();
      });
    } catch (error) {
      this.logger.error(`Error in fetchHistoricalDataFromAlphaVantage for ${symbol}:`, error);
      return this.fetchHistoricalDataAlternative(symbol, period);
    }
  }

  /**
   * Получает данные через Finnhub API (бесплатный, нужен ключ)
   * Получить ключ: https://finnhub.io/register
   */
  private async fetchHistoricalDataFromFinnhub(symbol: string, period: number = 730): Promise<StockPrice[]> {
    try {
      const endDate = Math.floor(Date.now() / 1000);
      const startDate = Math.floor((Date.now() - period * 24 * 60 * 60 * 1000) / 1000);
      const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${startDate}&to=${endDate}&token=${this.finnhubApiKey}`;
      
      return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
          hostname: urlObj.hostname,
          path: urlObj.pathname + urlObj.search,
          method: 'GET',
        };
        
        const req = https.request(options, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              
              if (json.s !== 'ok' || !json.c || json.c.length === 0) {
                this.logger.warn(`Finnhub error for ${symbol}: ${json.s || 'No data'}`);
                this.fetchHistoricalDataAlternative(symbol, period)
                  .then(resolve)
                  .catch(reject);
                return;
              }
              
              const prices: StockPrice[] = [];
              const timestamps = json.t;
              const opens = json.o;
              
              for (let i = 0; i < timestamps.length; i++) {
                const timestamp = timestamps[i];
                const openPrice = opens[i];
                
                if (!isNaN(openPrice) && openPrice > 0) {
                  const date = new Date(timestamp * 1000);
                  const month = (date.getMonth() + 1).toString().padStart(2, '0');
                  const day = date.getDate().toString().padStart(2, '0');
                  const year = date.getFullYear();
                  const formattedDate = `${month}/${day}/${year}`;
                  
                  prices.push({
                    date: formattedDate,
                    open: `$${openPrice.toFixed(2)}`,
                  });
                }
              }
              
              if (prices.length === 0) {
                throw new Error('No valid price data found');
              }
              
              // Сортируем по дате
              prices.sort((a, b) => {
                const dateA = this.parseDate(a.date);
                const dateB = this.parseDate(b.date);
                return dateA.getTime() - dateB.getTime();
              });
              
              this.logger.log(`Fetched ${prices.length} data points from Finnhub for ${symbol}`);
              resolve(prices);
            } catch (error) {
              this.logger.error(`Error parsing Finnhub response for ${symbol}:`, error);
              this.fetchHistoricalDataAlternative(symbol, period)
                .then(resolve)
                .catch(reject);
            }
          });
        });
        
        req.on('error', (error) => {
          this.logger.error(`Error fetching from Finnhub for ${symbol}:`, error);
          this.fetchHistoricalDataAlternative(symbol, period)
            .then(resolve)
            .catch(reject);
        });
        
        req.setTimeout(10000, () => {
          req.destroy();
          this.fetchHistoricalDataAlternative(symbol, period)
            .then(resolve)
            .catch(reject);
        });
        
        req.end();
      });
    } catch (error) {
      this.logger.error(`Error in fetchHistoricalDataFromFinnhub for ${symbol}:`, error);
      return this.fetchHistoricalDataAlternative(symbol, period);
    }
  }


  /**
   * Альтернативный метод получения данных - генерирует реалистичные данные на основе случайного блуждания
   */
  private async fetchHistoricalDataAlternative(symbol: string, period: number = 730): Promise<StockPrice[]> {
    this.logger.log(`Using alternative data generation for ${symbol}`);
    
    // Базовые цены для разных акций (примерные реальные значения)
    const basePrices: Record<string, number> = {
      AAPL: 150,
      SBUX: 100,
      MSFT: 350,
      CSCO: 50,
      QCOM: 120,
      AMZN: 140,
      TSLA: 250,
      AMD: 120,
    };
    
    const basePrice = basePrices[symbol] || 100;
    const prices: StockPrice[] = [];
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - Math.floor(period / 365));
    
    let currentPrice = basePrice;
    
    for (let i = 0; i < period; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Случайное блуждание с ограниченным изменением (более реалистично)
      // Изменение цены от -3% до +3% в день
      const changePercent = (Math.random() * 6 - 3) / 100;
      currentPrice = currentPrice * (1 + changePercent);
      
      // Ограничиваем разумными пределами (не меньше 50% и не больше 200% от базовой)
      currentPrice = Math.max(basePrice * 0.5, Math.min(basePrice * 2, currentPrice));
      
      prices.push({
        date: `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,
        open: `$${currentPrice.toFixed(2)}`,
      });
    }
    
    return prices;
  }

  /**
   * Обновляет исторические данные для акции из реального источника
   */
  async updateHistoricalDataFromSource(symbol: string): Promise<Stock | null> {
    try {
      let historicalData: StockPrice[];
      
      // Выбираем источник данных в зависимости от настроек
      switch (this.dataSource) {
        case 'csv': {
          const csvData = this.fetchHistoricalDataFromCsv(symbol);
          if (csvData.length > 0) {
            historicalData = csvData;
          } else {
            this.logger.warn(`CSV file not found for ${symbol}, falling back to alternative`);
            historicalData = await this.fetchHistoricalDataAlternative(symbol);
          }
          break;
        }
        case 'alphavantage':
          if (!this.alphaVantageApiKey) {
            this.logger.warn('Alpha Vantage API key not set, falling back to CSV');
            const csvFallback = this.fetchHistoricalDataFromCsv(symbol);
            historicalData = csvFallback.length > 0 ? csvFallback : await this.fetchHistoricalDataAlternative(symbol);
          } else {
            historicalData = await this.fetchHistoricalDataFromAlphaVantage(symbol);
          }
          break;
        case 'finnhub':
          if (!this.finnhubApiKey) {
            this.logger.warn('Finnhub API key not set, falling back to CSV');
            const csvFallback = this.fetchHistoricalDataFromCsv(symbol);
            historicalData = csvFallback.length > 0 ? csvFallback : await this.fetchHistoricalDataAlternative(symbol);
          } else {
            historicalData = await this.fetchHistoricalDataFromFinnhub(symbol);
          }
          break;
        default: {
          // По умолчанию пробуем CSV, затем alternative
          const csvData = this.fetchHistoricalDataFromCsv(symbol);
          historicalData = csvData.length > 0 ? csvData : await this.fetchHistoricalDataAlternative(symbol);
          break;
        }
      }
      
      return this.updateHistoricalData(symbol, historicalData);
    } catch (error) {
      this.logger.error(`Failed to update historical data for ${symbol}:`, error);
      // В случае ошибки используем альтернативный метод
      try {
        const fallbackData = await this.fetchHistoricalDataAlternative(symbol);
        return this.updateHistoricalData(symbol, fallbackData);
      } catch (fallbackError) {
        this.logger.error(`Fallback also failed for ${symbol}:`, fallbackError);
        return null;
      }
    }
  }

  /**
   * Обновляет исторические данные для всех акций
   */
  async updateAllHistoricalData(): Promise<void> {
    const stocks = this.getAllStocks();
    this.logger.log(`Updating historical data for ${stocks.length} stocks...`);
    
    for (const stock of stocks) {
      try {
        await this.updateHistoricalDataFromSource(stock.symbol);
        // Небольшая задержка между запросами, чтобы не перегрузить API
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        this.logger.error(`Failed to update ${stock.symbol}:`, error);
      }
    }
    
    this.logger.log('Historical data update completed');
  }

  private parseDate(dateStr: string): Date {
    if (!dateStr) return new Date();
    if (dateStr.includes('/')) {
      const [month, day, year] = dateStr.split('/').map(Number);
      return new Date(year, month - 1, day);
    }
    if (dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date(dateStr);
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


