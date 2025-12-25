import { ExchangeService, ExchangeSettings } from './exchange.service';
export declare class ExchangeController {
    private readonly exchangeService;
    constructor(exchangeService: ExchangeService);
    getSettings(): ExchangeSettings;
    updateSettings(settings: Partial<ExchangeSettings>): ExchangeSettings;
}
