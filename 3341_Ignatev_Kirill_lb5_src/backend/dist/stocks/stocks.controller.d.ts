import { StocksService, Stock, StockPrice } from './stocks.service';
export declare class StocksController {
    private readonly stocksService;
    constructor(stocksService: StocksService);
    getAllStocks(): Stock[];
    getStockBySymbol(symbol: string): Stock | null;
    updateStock(symbol: string, updates: Partial<Stock>): Stock | null;
    updateHistoricalData(symbol: string, historicalData: StockPrice[]): Stock | null;
}
