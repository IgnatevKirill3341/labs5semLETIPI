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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StocksController = void 0;
const common_1 = require("@nestjs/common");
const stocks_service_1 = require("./stocks.service");
let StocksController = class StocksController {
    constructor(stocksService) {
        this.stocksService = stocksService;
    }
    getAllStocks() {
        return this.stocksService.getAllStocks();
    }
    getStockBySymbol(symbol) {
        return this.stocksService.getStockBySymbol(symbol);
    }
    updateStock(symbol, updates) {
        return this.stocksService.updateStock(symbol, updates);
    }
    updateHistoricalData(symbol, historicalData) {
        return this.stocksService.updateHistoricalData(symbol, historicalData);
    }
};
exports.StocksController = StocksController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Array)
], StocksController.prototype, "getAllStocks", null);
__decorate([
    (0, common_1.Get)(':symbol'),
    __param(0, (0, common_1.Param)('symbol')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Object)
], StocksController.prototype, "getStockBySymbol", null);
__decorate([
    (0, common_1.Put)(':symbol'),
    __param(0, (0, common_1.Param)('symbol')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Object)
], StocksController.prototype, "updateStock", null);
__decorate([
    (0, common_1.Put)(':symbol/historical'),
    __param(0, (0, common_1.Param)('symbol')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", Object)
], StocksController.prototype, "updateHistoricalData", null);
exports.StocksController = StocksController = __decorate([
    (0, common_1.Controller)('api/stocks'),
    __metadata("design:paramtypes", [stocks_service_1.StocksService])
], StocksController);
//# sourceMappingURL=stocks.controller.js.map