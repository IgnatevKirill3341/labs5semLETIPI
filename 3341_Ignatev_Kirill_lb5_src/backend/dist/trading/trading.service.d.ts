import { StocksService } from '../stocks/stocks.service';
import { ExchangeService } from '../exchange/exchange.service';
export interface TradingUpdate {
    currentDate: string;
    prices: {
        [symbol: string]: number;
    };
}
export declare class TradingService {
    private readonly stocksService;
    private readonly exchangeService;
    private tradingInterval;
    private currentDateIndex;
    private allDates;
    constructor(stocksService: StocksService, exchangeService: ExchangeService);
    startTrading(onUpdate: (update: TradingUpdate) => void): void;
    stopTrading(): void;
    private sendUpdate;
    private parseDate;
    isTrading(): boolean;
}
