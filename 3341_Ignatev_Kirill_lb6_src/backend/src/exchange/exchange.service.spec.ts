import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeService, ExchangeSettings } from './exchange.service';
import * as fs from 'fs';
import * as path from 'path';

describe('ExchangeService', () => {
  let service: ExchangeService;
  let testDataPath: string;

  beforeEach(async () => {
    testDataPath = path.join(__dirname, '../../data/test-exchange.json');
    
    if (fs.existsSync(testDataPath)) {
      fs.unlinkSync(testDataPath);
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [ExchangeService],
    }).compile();

    service = module.get<ExchangeService>(ExchangeService);
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

  it('should return default settings when file is empty', () => {
    const settings = service.getSettings();
    
    expect(settings).toBeDefined();
    expect(settings.startDate).toBeDefined();
    expect(settings.dateChangeSpeed).toBe(1);
    expect(settings.isTrading).toBe(false);
  });

  it('should update settings', () => {
    const newSettings: Partial<ExchangeSettings> = {
      startDate: '2023-01-01',
      dateChangeSpeed: 5,
      isTrading: true,
    };

    const updated = service.updateSettings(newSettings);
    
    expect(updated.startDate).toBe('2023-01-01');
    expect(updated.dateChangeSpeed).toBe(5);
    expect(updated.isTrading).toBe(true);
  });

  it('should partially update settings', () => {
    service.updateSettings({ startDate: '2023-01-01', dateChangeSpeed: 2 });
    const updated = service.updateSettings({ dateChangeSpeed: 10 });
    
    expect(updated.startDate).toBe('2023-01-01');
    expect(updated.dateChangeSpeed).toBe(10);
  });
});

