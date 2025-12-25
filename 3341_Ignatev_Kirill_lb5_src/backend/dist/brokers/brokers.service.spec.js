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
const brokers_service_1 = require("./brokers.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
describe('BrokersService', () => {
    let service;
    let testDataPath;
    beforeEach(async () => {
        testDataPath = path.join(__dirname, '../../data/test-brokers.json');
        if (fs.existsSync(testDataPath)) {
            fs.unlinkSync(testDataPath);
        }
        const module = await testing_1.Test.createTestingModule({
            providers: [brokers_service_1.BrokersService],
        }).compile();
        service = module.get(brokers_service_1.BrokersService);
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
    it('should return empty array when no brokers exist', () => {
        const brokers = service.getAllBrokers();
        expect(brokers).toEqual([]);
    });
    it('should add a new broker', () => {
        const newBroker = {
            name: 'Test Broker',
            initialCash: 10000,
        };
        const broker = service.addBroker(newBroker);
        expect(broker).toBeDefined();
        expect(broker.id).toBeDefined();
        expect(broker.name).toBe('Test Broker');
        expect(broker.initialCash).toBe(10000);
    });
    it('should get all brokers', () => {
        service.addBroker({ name: 'Broker 1', initialCash: 1000 });
        service.addBroker({ name: 'Broker 2', initialCash: 2000 });
        const brokers = service.getAllBrokers();
        expect(brokers.length).toBe(2);
        expect(brokers[0].name).toBe('Broker 1');
        expect(brokers[1].name).toBe('Broker 2');
    });
    it('should update broker', () => {
        const broker = service.addBroker({ name: 'Original Name', initialCash: 1000 });
        const updated = service.updateBroker(broker.id, {
            name: 'Updated Name',
            initialCash: 5000,
        });
        expect(updated).toBeDefined();
        expect(updated?.name).toBe('Updated Name');
        expect(updated?.initialCash).toBe(5000);
    });
    it('should return null when updating non-existent broker', () => {
        const result = service.updateBroker('non-existent-id', { name: 'Test' });
        expect(result).toBeNull();
    });
    it('should delete broker', () => {
        const broker = service.addBroker({ name: 'To Delete', initialCash: 1000 });
        const result = service.deleteBroker(broker.id);
        expect(result).toBe(true);
        const brokers = service.getAllBrokers();
        expect(brokers.length).toBe(0);
    });
    it('should return false when deleting non-existent broker', () => {
        const result = service.deleteBroker('non-existent-id');
        expect(result).toBe(false);
    });
    it('should normalize invalid initialCash to 0', () => {
        const broker = service.addBroker({ name: 'Test', initialCash: null });
        expect(broker.initialCash).toBe(0);
    });
    it('should handle empty name', () => {
        const broker = service.addBroker({ name: '', initialCash: 1000 });
        expect(broker.name).toBe('');
    });
});
//# sourceMappingURL=brokers.service.spec.js.map