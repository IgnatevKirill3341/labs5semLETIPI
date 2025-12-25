import { BrokersService, Broker } from './brokers.service';
export declare class BrokersController {
    private readonly brokersService;
    constructor(brokersService: BrokersService);
    getAllBrokers(): Broker[];
    addBroker(broker: Omit<Broker, 'id'>): Broker;
    updateBroker(id: string, updates: Partial<Broker>): Broker | null;
    deleteBroker(id: string): {
        success: boolean;
    };
}
