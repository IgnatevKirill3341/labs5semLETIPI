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
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const stocks_service_1 = require("./stocks.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
describe('StocksService', () => {
    let service;
    let testDataPath;
    beforeEach(async () => {
        testDataPath = path.join(__dirname, '../../data/test-stocks.json');
        if (fs.existsSync(testDataPath)) {
            fs.unlinkSync(testDataPath);
        }
        const module = await testing_1.Test.createTestingModule({
            providers: [stocks_service_1.StocksService],
        }).compile();
        service = module.get(stocks_service_1.StocksService);
        service.dataPath = testDataPath;
        service.ensureDataFile();
    });
    afterEach(() => {
        if (fs.existsSync(testDataPath)) {
            fs.unlinkSync(testDataPath);
        }
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    it('should return all stocks', () => {
        const stocks = service.getAllStocks();
        expect(Array.isArray(stocks)).toBe(true);
    });
    it('should get stock by symbol', () => {
        const testStock = {
            symbol: 'TEST',
            companyName: 'Test Company',
            isActive: false,
            historicalData: [
                { date: '1/1/2023', open: '$100.00' },
                { date: '1/2/2023', open: '$101.00' },
            ],
        };
        const stocks = service.getAllStocks();
        if (stocks.length === 0) {
            fs.writeFileSync(testDataPath, JSON.stringify([testStock], null, 2));
        }
        const stock = service.getStockBySymbol('TEST');
        expect(stock).toBeDefined();
    });
    it('should return null for non-existent symbol', () => {
        const stock = service.getStockBySymbol('NONEXISTENT');
        expect(stock).toBeNull();
    });
    it('should update stock', () => {
        const testStock = {
            symbol: 'TEST',
            companyName: 'Test Company',
            isActive: false,
            historicalData: [],
        };
        fs.writeFileSync(testDataPath, JSON.stringify([testStock], null, 2));
        const updated = service.updateStock('TEST', { isActive: true });
        expect(updated).toBeDefined();
        expect(updated?.isActive).toBe(true);
    });
    it('should return null when updating non-existent stock', () => {
        const result = service.updateStock('NONEXISTENT', { isActive: true });
        expect(result).toBeNull();
    });
});
//# sourceMappingURL=stocks.service.spec.js.map