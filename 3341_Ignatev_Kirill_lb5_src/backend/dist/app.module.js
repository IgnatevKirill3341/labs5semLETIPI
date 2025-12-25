"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const brokers_controller_1 = require("./brokers/brokers.controller");
const brokers_service_1 = require("./brokers/brokers.service");
const stocks_controller_1 = require("./stocks/stocks.controller");
const stocks_service_1 = require("./stocks/stocks.service");
const exchange_controller_1 = require("./exchange/exchange.controller");
const exchange_service_1 = require("./exchange/exchange.service");
const trading_gateway_1 = require("./trading/trading.gateway");
const trading_service_1 = require("./trading/trading.service");
const trading_controller_1 = require("./trading/trading.controller");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [],
        controllers: [app_controller_1.AppController, brokers_controller_1.BrokersController, stocks_controller_1.StocksController, exchange_controller_1.ExchangeController, trading_controller_1.TradingController],
        providers: [brokers_service_1.BrokersService, stocks_service_1.StocksService, exchange_service_1.ExchangeService, trading_gateway_1.TradingGateway, trading_service_1.TradingService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map