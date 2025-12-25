import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface Broker {
  id: string;
  name: string;
  initialCash: number;
}

@Injectable()
export class BrokersService {
  private readonly dataPath = path.join(__dirname, '../../data/brokers.json');

  constructor() {
    this.ensureDataFile();
  }

  private ensureDataFile() {
    const dir = path.dirname(this.dataPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.dataPath)) {
      fs.writeFileSync(this.dataPath, JSON.stringify([], null, 2));
    }
  }

  getAllBrokers(): Broker[] {
    try {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      const brokers = JSON.parse(data);
      // Валидация и нормализация данных
      return brokers.map((broker: any) => ({
        ...broker,
        initialCash: typeof broker.initialCash === 'number' ? broker.initialCash : 0,
        name: broker.name || '',
      }));
    } catch (error) {
      return [];
    }
  }

  addBroker(broker: Omit<Broker, 'id'>): Broker {
    const brokers = this.getAllBrokers();
    const newBroker: Broker = {
      name: broker.name || '',
      initialCash: typeof broker.initialCash === 'number' ? broker.initialCash : 0,
      id: Date.now().toString(),
    };
    brokers.push(newBroker);
    this.saveBrokers(brokers);
    return newBroker;
  }

  updateBroker(id: string, updates: Partial<Broker>): Broker | null {
    const brokers = this.getAllBrokers();
    const index = brokers.findIndex(b => b.id === id);
    if (index === -1) return null;
    
    const updatedBroker: Broker = {
      ...brokers[index],
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.initialCash !== undefined && { 
        initialCash: typeof updates.initialCash === 'number' ? updates.initialCash : brokers[index].initialCash 
      }),
    };
    brokers[index] = updatedBroker;
    this.saveBrokers(brokers);
    return brokers[index];
  }

  deleteBroker(id: string): boolean {
    const brokers = this.getAllBrokers();
    const filtered = brokers.filter(b => b.id !== id);
    if (filtered.length === brokers.length) return false;
    
    this.saveBrokers(filtered);
    return true;
  }

  private saveBrokers(brokers: Broker[]) {
    fs.writeFileSync(this.dataPath, JSON.stringify(brokers, null, 2));
  }
}

