import { defineStore } from 'pinia';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

export interface Broker {
  id: string;
  name: string;
  initialCash: number;
}

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

export interface HoldingView {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  marketValue: number;
  profit: number;
}

export interface PortfolioView {
  brokerId: string;
  cash: number;
  holdings: HoldingView[];
  balance: number;
  currentDate?: string;
  prices?: Record<string, number>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const useTradingStore = defineStore('trading', {
  state: () => ({
    brokers: [] as Broker[],
    stocks: [] as Stock[],
    selectedBrokerId: localStorage.getItem('brokerId') || '',
    portfolio: null as PortfolioView | null,
    prices: {} as Record<string, number>,
    currentDate: '',
    loading: false,
    error: '' as string | null,
    socket: null as Socket | null,
  }),
  getters: {
    activeStocks: (state) => state.stocks.filter((s) => s.isActive),
    selectedBroker: (state) => state.brokers.find((b) => b.id === state.selectedBrokerId) || null,
  },
  actions: {
    async fetchBrokers() {
      const response = await axios.get<Broker[]>(`${API_URL}/api/brokers`);
      this.brokers = response.data;
    },
    async fetchStocks() {
      const response = await axios.get<Stock[]>(`${API_URL}/api/stocks`);
      this.stocks = response.data;
    },
    setBroker(id: string) {
      this.selectedBrokerId = id;
      localStorage.setItem('brokerId', id);
      this.refreshPortfolio();
    },
    async refreshPortfolio() {
      if (!this.selectedBrokerId) return;
      this.loading = true;
      try {
        const response = await axios.get<PortfolioView>(`${API_URL}/api/trading/brokers/${this.selectedBrokerId}/portfolio`);
        this.portfolio = response.data;
        this.prices = response.data.prices || this.prices;
        this.currentDate = response.data.currentDate || this.currentDate;
      } catch (error: any) {
        this.error = error?.message || 'Не удалось загрузить портфель';
      } finally {
        this.loading = false;
      }
    },
    async buy(symbol: string, quantity: number) {
      if (!this.selectedBrokerId) return;
      await axios.post(`${API_URL}/api/trading/brokers/${this.selectedBrokerId}/buy`, {
        symbol,
        quantity,
      });
      await this.refreshPortfolio();
    },
    async sell(symbol: string, quantity: number) {
      if (!this.selectedBrokerId) return;
      await axios.post(`${API_URL}/api/trading/brokers/${this.selectedBrokerId}/sell`, {
        symbol,
        quantity,
      });
      await this.refreshPortfolio();
    },
    connectSocket() {
      if (this.socket) return;
      const socket = io(API_URL, { transports: ['websocket'] });
      this.socket = socket;
      socket.on('trading-update', (data: { currentDate: string; prices: Record<string, number> }) => {
        this.currentDate = data.currentDate;
        this.prices = data.prices;
        if (this.portfolio) {
          this.refreshPortfolio();
        }
      });
    },
    disconnectSocket() {
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }
    },
    currentPriceFor(symbol: string) {
      return this.prices[symbol] ?? null;
    },
  },
});

