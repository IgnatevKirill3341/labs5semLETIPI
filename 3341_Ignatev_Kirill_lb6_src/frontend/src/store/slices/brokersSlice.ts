import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export interface Broker {
  id: string;
  name: string;
  initialCash: number;
}

interface BrokersState {
  brokers: Broker[];
  loading: boolean;
  error: string | null;
}

const initialState: BrokersState = {
  brokers: [],
  loading: false,
  error: null,
};

export const fetchBrokers = createAsyncThunk('brokers/fetch', async () => {
  const response = await fetch('http://localhost:3001/api/brokers');
  return response.json();
});

export const addBroker = createAsyncThunk('brokers/add', async (broker: Omit<Broker, 'id'>) => {
  const response = await fetch('http://localhost:3001/api/brokers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(broker),
  });
  return response.json();
});

export const updateBroker = createAsyncThunk(
  'brokers/update',
  async ({ id, updates }: { id: string; updates: Partial<Broker> }) => {
    const response = await fetch(`http://localhost:3001/api/brokers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return response.json();
  }
);

export const deleteBroker = createAsyncThunk('brokers/delete', async (id: string) => {
  await fetch(`http://localhost:3001/api/brokers/${id}`, {
    method: 'DELETE',
  });
  return id;
});

const brokersSlice = createSlice({
  name: 'brokers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBrokers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBrokers.fulfilled, (state, action) => {
        state.loading = false;
        state.brokers = action.payload;
      })
      .addCase(addBroker.fulfilled, (state, action) => {
        state.brokers.push(action.payload);
      })
      .addCase(updateBroker.fulfilled, (state, action) => {
        const index = state.brokers.findIndex(b => b.id === action.payload.id);
        if (index !== -1) {
          state.brokers[index] = action.payload;
        }
      })
      .addCase(deleteBroker.fulfilled, (state, action) => {
        state.brokers = state.brokers.filter(b => b.id !== action.payload);
      });
  },
});

export default brokersSlice.reducer;

