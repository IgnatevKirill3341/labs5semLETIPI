import { Controller, Get, Put, Body } from '@nestjs/common';
import { ExchangeService, ExchangeSettings } from './exchange.service';

@Controller('api/exchange')
export class ExchangeController {
  constructor(private readonly exchangeService: ExchangeService) {}

  @Get()
  getSettings(): ExchangeSettings {
    return this.exchangeService.getSettings();
  }

  @Put()
  updateSettings(@Body() settings: Partial<ExchangeSettings>): ExchangeSettings {
    return this.exchangeService.updateSettings(settings);
  }
}


