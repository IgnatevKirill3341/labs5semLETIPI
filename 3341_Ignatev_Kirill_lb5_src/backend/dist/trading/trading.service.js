"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradingService = void 0;
const common_1 = require("@nestjs/common");
const stocks_service_1 = require("../stocks/stocks.service");
const exchange_service_1 = require("../exchange/exchange.service");
let TradingService = class TradingService {
    constructor(stocksService, exchangeService) {
        this.stocksService = stocksService;
        this.exchangeService = exchangeService;
        this.tradingInterval = null;
        this.currentDateIndex = 0;
        this.allDates = [];
    }
    startTrading(onUpdate) {
        const settings = this.exchangeService.getSettings();
        const stocks = this.stocksService.getAllStocks().filter(s => s.isActive);
        if (stocks.length === 0) {
            throw new Error('No active stocks selected');
        }
        const dateSet = new Set();
        stocks.forEach(stock => {
            stock.historicalData.forEach(data => {
                dateSet.add(data.date);
            });
        });
        this.allDates = Array.from(dateSet).sort((a, b) => {
            const dateA = this.parseDate(a);
            const dateB = this.parseDate(b);
            return dateA.getTime() - dateB.getTime();
        });
        const startDate = this.parseDate(settings.startDate);
        this.currentDateIndex = this.allDates.findIndex(date => {
            const d = this.parseDate(date);
            return d >= startDate;
        });
        if (this.currentDateIndex === -1) {
            this.currentDateIndex = 0;
        }
        this.exchangeService.updateSettings({ isTrading: true });
        this.sendUpdate(onUpdate);
        this.tradingInterval = setInterval(() => {
            this.currentDateIndex++;
            if (this.currentDateIndex >= this.allDates.length) {
                this.stopTrading();
                return;
            }
            this.sendUpdate(onUpdate);
        }, settings.dateChangeSpeed * 1000);
    }
    stopTrading() {
        if (this.tradingInterval) {
            clearInterval(this.tradingInterval);
            this.tradingInterval = null;
        }
        this.exchangeService.updateSettings({ isTrading: false });
    }
    sendUpdate(onUpdate) {
        if (this.currentDateIndex >= this.allDates.length) {
            return;
        }
        const currentDate = this.allDates[this.currentDateIndex];
        const stocks = this.stocksService.getAllStocks().filter(s => s.isActive);
        const prices = {};
        stocks.forEach(stock => {
            const dataPoint = stock.historicalData.find(d => d.date === currentDate);
            if (dataPoint) {
                const price = parseFloat(dataPoint.open.replace('$', ''));
                prices[stock.symbol] = price;
            }
        });
        this.exchangeService.updateSettings({ currentDate });
        onUpdate({ currentDate, prices });
    }
    parseDate(dateStr) {
        const [month, day, year] = dateStr.split('/').map(Number);
        return new Date(year, month - 1, day);
    }
    isTrading() {
        return this.exchangeService.getSettings().isTrading;
    }
};
exports.TradingService = TradingService;
exports.TradingService = TradingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [stocks_service_1.StocksService,
        exchange_service_1.ExchangeService])
], TradingService);
//# sourceMappingURL=trading.service.js.map