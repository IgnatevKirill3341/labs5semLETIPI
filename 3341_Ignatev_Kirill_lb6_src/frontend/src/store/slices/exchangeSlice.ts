import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export interface ExchangeSettings {
  startDate: string;
  dateChangeSpeed: number;
  isTrading: boolean;
  currentDate?: string;
}

interface ExchangeState {
  settings: ExchangeSettings | null;
  currentPrices: { [symbol: string]: number };
  loading: boolean;
  error: string | null;
}

const initialState: ExchangeState = {
  settings: null,
  currentPrices: {},
  loading: false,
  error: null,
};

export const fetchSettings = createAsyncThunk('exchange/fetch', async () => {
  const response = await fetch('http://localhost:3001/api/exchange');
  return response.json();
});

export const updateSettings = createAsyncThunk(
  'exchange/update',
  async (settings: Partial<ExchangeSettings>) => {
    const response = await fetch('http://localhost:3001/api/exchange', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return response.json();
  }
);

const exchangeSlice = createSlice({
  name: 'exchange',
  initialState,
  reducers: {
    setCurrentPrices: (state, action) => {
      state.currentPrices = action.payload;
    },
    setCurrentDate: (state, action) => {
      if (state.settings) {
        state.settings.currentDate = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
      });
  },
});

export const { setCurrentPrices, setCurrentDate } = exchangeSlice.actions;
export default exchangeSlice.reducer;


