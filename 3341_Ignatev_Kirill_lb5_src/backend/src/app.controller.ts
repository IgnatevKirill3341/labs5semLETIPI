import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return { message: 'Broker Exchange API is running', version: '1.0.0' };
  }
}


