import { TradingGateway } from './trading.gateway';
export declare class TradingController {
    private readonly tradingGateway;
    constructor(tradingGateway: TradingGateway);
    startTrading(): {
        success: boolean;
    };
    stopTrading(): {
        success: boolean;
    };
    getStatus(): {
        isTrading: boolean;
    };
}
