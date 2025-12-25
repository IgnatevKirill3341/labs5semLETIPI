import { configureStore } from '@reduxjs/toolkit';
import brokersReducer, { fetchBrokers, addBroker, updateBroker, deleteBroker, Broker } from './brokersSlice';
import { RootState } from '../store';

// Мокаем fetch
(window as any).fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('brokersSlice', () => {
  let store: ReturnType<typeof configureStore<{ brokers: RootState['brokers'] }>>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        brokers: brokersReducer,
      },
    });
    ((window as any).fetch as jest.Mock).mockClear();
  });

  it('should have initial state', () => {
    const state = store.getState();
    expect(state.brokers.brokers).toEqual([]);
    expect(state.brokers.loading).toBe(false);
    expect(state.brokers.error).toBeNull();
  });

  it('should handle fetchBrokers.pending', () => {
    store.dispatch({ type: 'brokers/fetch/pending' });
    const state = store.getState();
    expect(state.brokers.loading).toBe(true);
  });

  it('should handle fetchBrokers.fulfilled', async () => {
    const mockBrokers: Broker[] = [
      { id: '1', name: 'Broker 1', initialCash: 10000 },
      { id: '2', name: 'Broker 2', initialCash: 20000 },
    ];

    ((window as any).fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockBrokers,
    });

    await store.dispatch(fetchBrokers() as any);
    const state = store.getState();
    
    expect(state.brokers.brokers).toEqual(mockBrokers);
    expect(state.brokers.loading).toBe(false);
  });

  it('should handle addBroker.fulfilled', async () => {
    const newBroker = { name: 'New Broker', initialCash: 5000 };
    const createdBroker: Broker = { ...newBroker, id: '1' };

    ((window as any).fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => createdBroker,
    });

    await store.dispatch(addBroker(newBroker) as any);
    const state = store.getState();
    
    expect(state.brokers.brokers).toContainEqual(createdBroker);
  });

  it('should handle updateBroker.fulfilled', async () => {
    // Сначала добавляем брокера
    const broker: Broker = { id: '1', name: 'Original', initialCash: 1000 };
    store.dispatch({ type: 'brokers/fetch/fulfilled', payload: [broker] });

    const updatedBroker = { ...broker, name: 'Updated' };
    ((window as any).fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => updatedBroker,
    });

    await store.dispatch(updateBroker({ id: '1', updates: { name: 'Updated' } }) as any);
    const state = store.getState();
    
    expect(state.brokers.brokers[0].name).toBe('Updated');
  });

  it('should handle deleteBroker.fulfilled', async () => {
    const broker: Broker = { id: '1', name: 'To Delete', initialCash: 1000 };
    store.dispatch({ type: 'brokers/fetch/fulfilled', payload: [broker] });

    ((window as any).fetch as jest.Mock).mockResolvedValueOnce({});

    await store.dispatch(deleteBroker('1') as any);
    const state = store.getState();
    
    expect(state.brokers.brokers).not.toContainEqual(broker);
  });
});

