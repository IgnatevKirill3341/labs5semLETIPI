import { Test, TestingModule } from '@nestjs/testing';
import { StocksService, Stock } from './stocks.service';
import * as fs from 'fs';
import * as path from 'path';

describe('StocksService', () => {
  let service: StocksService;
  let testDataPath: string;

  beforeEach(async () => {
    testDataPath = path.join(__dirname, '../../data/test-stocks.json');
    
    if (fs.existsSync(testDataPath)) {
      fs.unlinkSync(testDataPath);
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [StocksService],
    }).compile();

    service = module.get<StocksService>(StocksService);
    (service as any).dataPath = testDataPath;
    (service as any).ensureDataFile();
  });

  afterEach(() => {
    if (fs.existsSync(testDataPath)) {
      fs.unlinkSync(testDataPath);
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all stocks', () => {
    const stocks = service.getAllStocks();
    expect(Array.isArray(stocks)).toBe(true);
  });

  it('should get stock by symbol', () => {
    // Создаем тестовую акцию
    const testStock: Stock = {
      symbol: 'TEST',
      companyName: 'Test Company',
      isActive: false,
      historicalData: [
        { date: '1/1/2023', open: '$100.00' },
        { date: '1/2/2023', open: '$101.00' },
      ],
    };

    // Добавляем через обновление (если файл пустой, нужно сначала создать)
    const stocks = service.getAllStocks();
    if (stocks.length === 0) {
      // Создаем файл с тестовыми данными
      fs.writeFileSync(testDataPath, JSON.stringify([testStock], null, 2));
    }

    const stock = service.getStockBySymbol('TEST');
    expect(stock).toBeDefined();
  });

  it('should return null for non-existent symbol', () => {
    const stock = service.getStockBySymbol('NONEXISTENT');
    expect(stock).toBeNull();
  });

  it('should update stock', () => {
    // Создаем тестовую акцию
    const testStock: Stock = {
      symbol: 'TEST',
      companyName: 'Test Company',
      isActive: false,
      historicalData: [],
    };
    fs.writeFileSync(testDataPath, JSON.stringify([testStock], null, 2));

    const updated = service.updateStock('TEST', { isActive: true });
    
    expect(updated).toBeDefined();
    expect(updated?.isActive).toBe(true);
  });

  it('should return null when updating non-existent stock', () => {
    const result = service.updateStock('NONEXISTENT', { isActive: true });
    expect(result).toBeNull();
  });
});

