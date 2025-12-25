import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

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

interface StocksState {
  stocks: Stock[];
  loading: boolean;
  error: string | null;
}

const initialState: StocksState = {
  stocks: [],
  loading: false,
  error: null,
};

export const fetchStocks = createAsyncThunk('stocks/fetch', async () => {
  const response = await fetch('http://localhost:3001/api/stocks');
  return response.json();
});

export const updateStock = createAsyncThunk(
  'stocks/update',
  async ({ symbol, updates }: { symbol: string; updates: Partial<Stock> }) => {
    const response = await fetch(`http://localhost:3001/api/stocks/${symbol}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return response.json();
  }
);

const stocksSlice = createSlice({
  name: 'stocks',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStocks.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStocks.fulfilled, (state, action) => {
        state.loading = false;
        state.stocks = action.payload;
      })
      .addCase(updateStock.fulfilled, (state, action) => {
        const index = state.stocks.findIndex(s => s.symbol === action.payload.symbol);
        if (index !== -1) {
          state.stocks[index] = action.payload;
        }
      });
  },
});

export default stocksSlice.reducer;


