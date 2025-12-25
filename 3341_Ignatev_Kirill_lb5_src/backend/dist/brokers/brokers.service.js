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
exports.BrokersService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let BrokersService = class BrokersService {
    constructor() {
        this.dataPath = path.join(__dirname, '../../data/brokers.json');
        this.ensureDataFile();
    }
    ensureDataFile() {
        const dir = path.dirname(this.dataPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (!fs.existsSync(this.dataPath)) {
            fs.writeFileSync(this.dataPath, JSON.stringify([], null, 2));
        }
    }
    getAllBrokers() {
        try {
            const data = fs.readFileSync(this.dataPath, 'utf8');
            const brokers = JSON.parse(data);
            return brokers.map((broker) => ({
                ...broker,
                initialCash: typeof broker.initialCash === 'number' ? broker.initialCash : 0,
                name: broker.name || '',
            }));
        }
        catch (error) {
            return [];
        }
    }
    addBroker(broker) {
        const brokers = this.getAllBrokers();
        const newBroker = {
            name: broker.name || '',
            initialCash: typeof broker.initialCash === 'number' ? broker.initialCash : 0,
            id: Date.now().toString(),
        };
        brokers.push(newBroker);
        this.saveBrokers(brokers);
        return newBroker;
    }
    updateBroker(id, updates) {
        const brokers = this.getAllBrokers();
        const index = brokers.findIndex(b => b.id === id);
        if (index === -1)
            return null;
        const updatedBroker = {
            ...brokers[index],
            ...(updates.name !== undefined && { name: updates.name }),
            ...(updates.initialCash !== undefined && {
                initialCash: typeof updates.initialCash === 'number' ? updates.initialCash : brokers[index].initialCash
            }),
        };
        brokers[index] = updatedBroker;
        this.saveBrokers(brokers);
        return brokers[index];
    }
    deleteBroker(id) {
        const brokers = this.getAllBrokers();
        const filtered = brokers.filter(b => b.id !== id);
        if (filtered.length === brokers.length)
            return false;
        this.saveBrokers(filtered);
        return true;
    }
    saveBrokers(brokers) {
        fs.writeFileSync(this.dataPath, JSON.stringify(brokers, null, 2));
    }
};
exports.BrokersService = BrokersService;
exports.BrokersService = BrokersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], BrokersService);
//# sourceMappingURL=brokers.service.js.map