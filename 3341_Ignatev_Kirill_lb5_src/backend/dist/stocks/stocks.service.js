"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StocksService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let StocksService = class StocksService {
    constructor() {
        this.dataPath = path.join(__dirname, '../../data/stocks.json');
        this.defaultStocks = [
            { symbol: 'AAPL', companyName: 'Apple, Inc.', isActive: false },
            { symbol: 'SBUX', companyName: 'Starbucks, Inc.', isActive: false },
            { symbol: 'MSFT', companyName: 'Microsoft, Inc.', isActive: false },
            { symbol: 'CSCO', companyName: 'Cisco Systems, Inc.', isActive: false },
            { symbol: 'QCOM', companyName: 'QUALCOMM Incorporated', isActive: false },
            { symbol: 'AMZN', companyName: 'Amazon.com, Inc.', isActive: false },
            { symbol: 'TSLA', companyName: 'Tesla, Inc.', isActive: false },
            { symbol: 'AMD', companyName: 'Advanced Micro Devices, Inc.', isActive: false },
        ];
        this.ensureDataFile();
    }
    ensureDataFile() {
        const dir = path.dirname(this.dataPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (!fs.existsSync(this.dataPath)) {
            const initialStocks = this.defaultStocks.map(stock => ({
                ...stock,
                historicalData: this.generateSampleData(),
            }));
            fs.writeFileSync(this.dataPath, JSON.stringify(initialStocks, null, 2));
        }
    }
    generateSampleData() {
        const data = [];
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 2);
        for (let i = 0; i < 730; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const price = (Math.random() * 200 + 50).toFixed(2);
            data.push({
                date: `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,
                open: `$${price}`,
            });
        }
        return data.reverse();
    }
    getAllStocks() {
        try {
            const data = fs.readFileSync(this.dataPath, 'utf8');
            return JSON.parse(data);
        }
        catch (error) {
            return [];
        }
    }
    getStockBySymbol(symbol) {
        const stocks = this.getAllStocks();
        return stocks.find(s => s.symbol === symbol) || null;
    }
    updateStock(symbol, updates) {
        const stocks = this.getAllStocks();
        const index = stocks.findIndex(s => s.symbol === symbol);
        if (index === -1)
            return null;
        stocks[index] = { ...stocks[index], ...updates };
        this.saveStocks(stocks);
        return stocks[index];
    }
    updateHistoricalData(symbol, historicalData) {
        const stocks = this.getAllStocks();
        const index = stocks.findIndex(s => s.symbol === symbol);
        if (index === -1)
            return null;
        stocks[index].historicalData = historicalData;
        this.saveStocks(stocks);
        return stocks[index];
    }
    saveStocks(stocks) {
        fs.writeFileSync(this.dataPath, JSON.stringify(stocks, null, 2));
    }
};
exports.StocksService = StocksService;
exports.StocksService = StocksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], StocksService);
//# sourceMappingURL=stocks.service.js.map