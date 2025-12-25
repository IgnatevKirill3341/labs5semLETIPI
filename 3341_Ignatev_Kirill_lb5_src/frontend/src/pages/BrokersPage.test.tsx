import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import BrokersPage from './BrokersPage';
import brokersReducer from '../store/slices/brokersSlice';
import stocksReducer from '../store/slices/stocksSlice';
import exchangeReducer from '../store/slices/exchangeSlice';

// Мокаем fetch
(window as any).fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      brokers: brokersReducer,
      stocks: stocksReducer,
      exchange: exchangeReducer,
    },
    preloadedState: initialState,
  });
};

describe('BrokersPage', () => {
  beforeEach(() => {
    ((window as any).fetch as jest.Mock).mockClear();
  });

  it('should render brokers page', () => {
    const store = createMockStore({
      brokers: {
        brokers: [],
        loading: false,
        error: null,
      },
    });

    render(
      <Provider store={store}>
        <BrokersPage />
      </Provider>
    );

    expect(screen.getByText('Управление брокерами')).toBeInTheDocument();
    expect(screen.getByText('Добавить брокера')).toBeInTheDocument();
  });

  it('should display loading state', () => {
    const store = createMockStore({
      brokers: {
        brokers: [],
        loading: true,
        error: null,
      },
    });

    render(
      <Provider store={store}>
        <BrokersPage />
      </Provider>
    );

    expect(screen.getByText('Загрузка...')).toBeInTheDocument();
  });

  it('should display empty state', () => {
    const store = createMockStore({
      brokers: {
        brokers: [],
        loading: false,
        error: null,
      },
    });

    render(
      <Provider store={store}>
        <BrokersPage />
      </Provider>
    );

    expect(screen.getByText('Нет брокеров')).toBeInTheDocument();
  });

  it('should display brokers list', () => {
    const store = createMockStore({
      brokers: {
        brokers: [
          { id: '1', name: 'Broker 1', initialCash: 10000 },
          { id: '2', name: 'Broker 2', initialCash: 20000 },
        ],
        loading: false,
        error: null,
      },
    });

    render(
      <Provider store={store}>
        <BrokersPage />
      </Provider>
    );

    expect(screen.getByText('Broker 1')).toBeInTheDocument();
    expect(screen.getByText('Broker 2')).toBeInTheDocument();
    expect(screen.getByText('$10000.00')).toBeInTheDocument();
    expect(screen.getByText('$20000.00')).toBeInTheDocument();
  });

  it('should open add broker dialog', () => {
    const store = createMockStore({
      brokers: {
        brokers: [],
        loading: false,
        error: null,
      },
    });

    render(
      <Provider store={store}>
        <BrokersPage />
      </Provider>
    );

    const addButton = screen.getByText('Добавить брокера');
    fireEvent.click(addButton);

    expect(screen.getByText('Добавить брокера')).toBeInTheDocument();
    expect(screen.getByLabelText('Имя')).toBeInTheDocument();
    expect(screen.getByLabelText('Начальный баланс')).toBeInTheDocument();
  });

  it('should open edit broker dialog', () => {
    const store = createMockStore({
      brokers: {
        brokers: [
          { id: '1', name: 'Broker 1', initialCash: 10000 },
        ],
        loading: false,
        error: null,
      },
    });

    render(
      <Provider store={store}>
        <BrokersPage />
      </Provider>
    );

    const editButtons = screen.getAllByLabelText('edit');
    fireEvent.click(editButtons[0]);

    expect(screen.getByText('Редактировать брокера')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Broker 1')).toBeInTheDocument();
  });
});

