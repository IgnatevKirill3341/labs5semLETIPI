import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { BrokersService, Broker } from './brokers.service';

@Controller('api/brokers')
export class BrokersController {
  constructor(private readonly brokersService: BrokersService) {}

  @Get()
  getAllBrokers(): Broker[] {
    return this.brokersService.getAllBrokers();
  }

  @Post()
  addBroker(@Body() broker: Omit<Broker, 'id'>): Broker {
    return this.brokersService.addBroker(broker);
  }

  @Put(':id')
  updateBroker(@Param('id') id: string, @Body() updates: Partial<Broker>): Broker | null {
    return this.brokersService.updateBroker(id, updates);
  }

  @Delete(':id')
  deleteBroker(@Param('id') id: string): { success: boolean } {
    const success = this.brokersService.deleteBroker(id);
    return { success };
  }
}


