export interface StockPrice {
    date: string;
    open: string;
}
export interface Stock {
    symbol: string;
    companyName: string;
    isActive: boolean;
    historicalData: StockPrice[];
}
export declare class StocksService {
    private readonly dataPath;
    private readonly defaultStocks;
    constructor();
    private ensureDataFile;
    private generateSampleData;
    getAllStocks(): Stock[];
    getStockBySymbol(symbol: string): Stock | null;
    updateStock(symbol: string, updates: Partial<Stock>): Stock | null;
    updateHistoricalData(symbol: string, historicalData: StockPrice[]): Stock | null;
    private saveStocks;
}
