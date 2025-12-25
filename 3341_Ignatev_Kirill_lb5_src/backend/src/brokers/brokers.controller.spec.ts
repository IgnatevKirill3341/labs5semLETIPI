import { Test, TestingModule } from '@nestjs/testing';
import { BrokersController } from './brokers.controller';
import { BrokersService } from './brokers.service';

describe('BrokersController', () => {
  let controller: BrokersController;
  let service: BrokersService;

  const mockBroker = {
    id: '1',
    name: 'Test Broker',
    initialCash: 10000,
  };

  const mockBrokersService = {
    getAllBrokers: jest.fn(() => [mockBroker]),
    addBroker: jest.fn((broker) => ({ ...broker, id: '1' })),
    updateBroker: jest.fn((id, updates) => ({ ...mockBroker, ...updates })),
    deleteBroker: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BrokersController],
      providers: [
        {
          provide: BrokersService,
          useValue: mockBrokersService,
        },
      ],
    }).compile();

    controller = module.get<BrokersController>(BrokersController);
    service = module.get<BrokersService>(BrokersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get all brokers', () => {
    const result = controller.getAllBrokers();
    expect(service.getAllBrokers).toHaveBeenCalled();
    expect(result).toEqual([mockBroker]);
  });

  it('should add a broker', () => {
    const newBroker = { name: 'New Broker', initialCash: 5000 };
    const result = controller.addBroker(newBroker);
    
    expect(service.addBroker).toHaveBeenCalledWith(newBroker);
    expect(result).toEqual({ ...newBroker, id: '1' });
  });

  it('should update a broker', () => {
    const updates = { name: 'Updated Name' };
    const result = controller.updateBroker('1', updates);
    
    expect(service.updateBroker).toHaveBeenCalledWith('1', updates);
    expect(result).toEqual({ ...mockBroker, ...updates });
  });

  it('should delete a broker', () => {
    const result = controller.deleteBroker('1');
    
    expect(service.deleteBroker).toHaveBeenCalledWith('1');
    expect(result).toEqual({ success: true });
  });
});

