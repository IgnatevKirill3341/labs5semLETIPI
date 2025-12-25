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
const exchange_service_1 = require("./exchange.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
describe('ExchangeService', () => {
    let service;
    let testDataPath;
    beforeEach(async () => {
        testDataPath = path.join(__dirname, '../../data/test-exchange.json');
        if (fs.existsSync(testDataPath)) {
            fs.unlinkSync(testDataPath);
        }
        const module = await testing_1.Test.createTestingModule({
            providers: [exchange_service_1.ExchangeService],
        }).compile();
        service = module.get(exchange_service_1.ExchangeService);
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
    it('should return default settings when file is empty', () => {
        const settings = service.getSettings();
        expect(settings).toBeDefined();
        expect(settings.startDate).toBeDefined();
        expect(settings.dateChangeSpeed).toBe(1);
        expect(settings.isTrading).toBe(false);
    });
    it('should update settings', () => {
        const newSettings = {
            startDate: '2023-01-01',
            dateChangeSpeed: 5,
            isTrading: true,
        };
        const updated = service.updateSettings(newSettings);
        expect(updated.startDate).toBe('2023-01-01');
        expect(updated.dateChangeSpeed).toBe(5);
        expect(updated.isTrading).toBe(true);
    });
    it('should partially update settings', () => {
        service.updateSettings({ startDate: '2023-01-01', dateChangeSpeed: 2 });
        const updated = service.updateSettings({ dateChangeSpeed: 10 });
        expect(updated.startDate).toBe('2023-01-01');
        expect(updated.dateChangeSpeed).toBe(10);
    });
});
//# sourceMappingURL=exchange.service.spec.js.map