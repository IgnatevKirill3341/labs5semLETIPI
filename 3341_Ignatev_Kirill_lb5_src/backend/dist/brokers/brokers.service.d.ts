export interface Broker {
    id: string;
    name: string;
    initialCash: number;
}
export declare class BrokersService {
    private readonly dataPath;
    constructor();
    private ensureDataFile;
    getAllBrokers(): Broker[];
    addBroker(broker: Omit<Broker, 'id'>): Broker;
    updateBroker(id: string, updates: Partial<Broker>): Broker | null;
    deleteBroker(id: string): boolean;
    private saveBrokers;
}
