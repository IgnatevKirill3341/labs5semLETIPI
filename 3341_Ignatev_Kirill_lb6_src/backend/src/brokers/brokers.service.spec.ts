import { Test, TestingModule } from '@nestjs/testing';
import { BrokersService, Broker } from './brokers.service';
import * as fs from 'fs';
import * as path from 'path';

describe('BrokersService', () => {
  let service: BrokersService;
  let testDataPath: string;

  beforeEach(async () => {
    // Создаем временный файл для тестов
    testDataPath = path.join(__dirname, '../../data/test-brokers.json');
    
    // Очищаем тестовый файл перед каждым тестом
    if (fs.existsSync(testDataPath)) {
      fs.unlinkSync(testDataPath);
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [BrokersService],
    }).compile();

    service = module.get<BrokersService>(BrokersService);
    
    // Переопределяем путь к данным для тестов
    (service as any).dataPath = testDataPath;
    (service as any).ensureDataFile();
  });

  afterEach(() => {
    // Удаляем тестовый файл после каждого теста
    if (fs.existsSync(testDataPath)) {
      fs.unlinkSync(testDataPath);
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return empty array when no brokers exist', () => {
    const brokers = service.getAllBrokers();
    expect(brokers).toEqual([]);
  });

  it('should add a new broker', () => {
    const newBroker = {
      name: 'Test Broker',
      initialCash: 10000,
    };

    const broker = service.addBroker(newBroker);
    
    expect(broker).toBeDefined();
    expect(broker.id).toBeDefined();
    expect(broker.name).toBe('Test Broker');
    expect(broker.initialCash).toBe(10000);
  });

  it('should get all brokers', () => {
    service.addBroker({ name: 'Broker 1', initialCash: 1000 });
    service.addBroker({ name: 'Broker 2', initialCash: 2000 });

    const brokers = service.getAllBrokers();
    
    expect(brokers.length).toBe(2);
    expect(brokers[0].name).toBe('Broker 1');
    expect(brokers[1].name).toBe('Broker 2');
  });

  it('should update broker', () => {
    const broker = service.addBroker({ name: 'Original Name', initialCash: 1000 });
    
    const updated = service.updateBroker(broker.id, {
      name: 'Updated Name',
      initialCash: 5000,
    });

    expect(updated).toBeDefined();
    expect(updated?.name).toBe('Updated Name');
    expect(updated?.initialCash).toBe(5000);
  });

  it('should return null when updating non-existent broker', () => {
    const result = service.updateBroker('non-existent-id', { name: 'Test' });
    expect(result).toBeNull();
  });

  it('should delete broker', () => {
    const broker = service.addBroker({ name: 'To Delete', initialCash: 1000 });
    
    const result = service.deleteBroker(broker.id);
    
    expect(result).toBe(true);
    const brokers = service.getAllBrokers();
    expect(brokers.length).toBe(0);
  });

  it('should return false when deleting non-existent broker', () => {
    const result = service.deleteBroker('non-existent-id');
    expect(result).toBe(false);
  });

  it('should normalize invalid initialCash to 0', () => {
    const broker = service.addBroker({ name: 'Test', initialCash: null as any });
    
    expect(broker.initialCash).toBe(0);
  });

  it('should handle empty name', () => {
    const broker = service.addBroker({ name: '', initialCash: 1000 });
    
    expect(broker.name).toBe('');
  });
});

