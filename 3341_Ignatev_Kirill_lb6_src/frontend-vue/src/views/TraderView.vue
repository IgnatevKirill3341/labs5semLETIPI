<template>
  <v-row>
    <v-col cols="12">
      <v-alert type="info" variant="tonal" class="mb-4">
        Текущая дата торгов: <strong>{{ tradingStore.currentDate || 'н/д' }}</strong>
      </v-alert>
    </v-col>

    <v-col cols="12" md="4">
      <v-card>
        <v-card-title>Баланс брокера</v-card-title>
        <v-card-text>
          <div class="text-h5 mb-2" data-testid="balance-value">${{ (portfolio?.balance ?? 0).toFixed(2) }}</div>
          <div class="text-body-2" data-testid="cash-value">Свободные средства: ${{ (portfolio?.cash ?? 0).toFixed(2) }}</div>
          <div class="text-body-2 mb-2">Брокер: <strong>{{ tradingStore.selectedBroker?.name || 'Не выбран' }}</strong></div>
          <v-divider class="my-2"></v-divider>
          <div class="text-body-2 mb-1">Начальный капитал: ${{ (tradingStore.selectedBroker?.initialCash ?? 0).toFixed(2) }}</div>
          <div class="text-body-1">
            <span :class="totalProfit >= 0 ? 'text-success' : 'text-error'">
              <strong>
                {{ totalProfit >= 0 ? '+' : '' }}${{ totalProfit.toFixed(2) }}
                ({{ totalProfitPercent >= 0 ? '+' : '' }}{{ totalProfitPercent.toFixed(2) }}%)
              </strong>
            </span>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" md="8">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span>Портфель</span>
          <v-btn size="small" variant="text" @click="tradingStore.refreshPortfolio()">Обновить</v-btn>
        </v-card-title>
        <v-data-table
          data-testid="portfolio-table"
          :headers="portfolioHeaders"
          :items="portfolio?.holdings || []"
          density="comfortable"
          class="elevation-1"
          item-key="symbol"
        >
          <template #item.profit="{ item }">
            <div>
              <div :class="item.profit >= 0 ? 'text-success' : 'text-error'">
                <strong>{{ formatCurrency(item.profit) }}</strong>
              </div>
              <div :class="item.profit >= 0 ? 'text-success' : 'text-error'" class="text-caption">
                {{ item.averagePrice > 0 ? ((item.profit / (item.averagePrice * item.quantity)) * 100).toFixed(2) : '0.00' }}%
              </div>
            </div>
          </template>
          <template #no-data>
            <div class="pa-4">Нет позиций</div>
          </template>
        </v-data-table>
      </v-card>
    </v-col>

    <v-col cols="12">
      <v-card>
        <v-card-title>Доступные акции</v-card-title>
        <v-data-table
          data-testid="stocks-table"
          :headers="stocksHeaders"
          :items="tradingStore.activeStocks"
          density="comfortable"
          class="elevation-1"
          item-key="symbol"
        >
          <template #item.currentPrice="{ item }">
            {{ formatCurrency(currentPrice(item.symbol)) }}
          </template>
          <template #item.actions="{ item }">
            <div class="d-flex ga-2">
              <v-btn size="small" variant="tonal" color="primary" @click="openChart(item)">График</v-btn>
              <v-btn
                size="small"
                variant="outlined"
                color="success"
                :data-testid="`buy-${item.symbol}`"
                @click="openTradeDialog(item, 'buy')"
              >
                Купить
              </v-btn>
              <v-btn
                size="small"
                variant="outlined"
                color="error"
                :data-testid="`sell-${item.symbol}`"
                @click="openTradeDialog(item, 'sell')"
              >
                Продать
              </v-btn>
            </div>
          </template>
        </v-data-table>
      </v-card>
    </v-col>
  </v-row>

  <v-dialog v-model="tradeDialog" max-width="480">
    <v-card>
      <v-card-title>{{ tradeMode === 'buy' ? 'Покупка' : 'Продажа' }} {{ selectedStock?.symbol }}</v-card-title>
      <v-card-text>
        <p>Текущая цена: {{ formatCurrency(currentPrice(selectedStock?.symbol)) }}</p>
          <v-text-field
            v-model.number="quantity"
            type="number"
            min="1"
            label="Количество"
            density="comfortable"
            data-testid="quantity-input"
          />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="tradeDialog = false">Отмена</v-btn>
        <v-btn color="primary" data-testid="confirm-trade" @click="submitTrade">Подтвердить</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="chartDialog" max-width="900">
    <v-card>
      <v-card-title>История цен {{ selectedStock?.symbol }}</v-card-title>
      <v-card-text>
        <div class="chart-wrapper" v-if="chartData.datasets.length">
          <Line :data="chartData" :options="chartOptions" />
        </div>
        <v-alert v-else type="info" variant="tonal">Нет данных</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="chartDialog = false">Закрыть</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useTradingStore, Stock } from '../stores/trading';
import { useRouter } from 'vue-router';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const tradingStore = useTradingStore();
const router = useRouter();

const tradeDialog = ref(false);
const chartDialog = ref(false);
const selectedStock = ref<Stock | null>(null);
const tradeMode = ref<'buy' | 'sell'>('buy');
const quantity = ref(1);

onMounted(async () => {
  if (!tradingStore.selectedBrokerId) {
    router.push('/login');
    return;
  }
  // Загружаем брокеров, чтобы получить имя и начальный капитал
  if (!tradingStore.brokers.length) {
    await tradingStore.fetchBrokers();
  }
  await Promise.all([tradingStore.fetchStocks(), tradingStore.refreshPortfolio()]);
  tradingStore.connectSocket();
});

const portfolio = computed(() => tradingStore.portfolio);

// Рассчитываем общую прибыль/убыток
const totalProfit = computed(() => {
  if (!portfolio.value || !tradingStore.selectedBroker) return 0;
  const initialCash = tradingStore.selectedBroker.initialCash;
  const currentBalance = portfolio.value.balance;
  return currentBalance - initialCash;
});

// Рассчитываем процент прибыли/убытка
const totalProfitPercent = computed(() => {
  if (!tradingStore.selectedBroker || !tradingStore.selectedBroker.initialCash) return 0;
  const initialCash = tradingStore.selectedBroker.initialCash;
  if (initialCash === 0) return 0;
  return (totalProfit.value / initialCash) * 100;
});

const portfolioHeaders = [
  { title: 'Акция', key: 'symbol' },
  { title: 'Количество', key: 'quantity', align: 'end' },
  { title: 'Средняя цена', key: 'averagePrice', align: 'end' },
  { title: 'Текущая цена', key: 'currentPrice', align: 'end' },
  { title: 'Стоимость', key: 'marketValue', align: 'end' },
  { title: 'Прибыль/убыток', key: 'profit', align: 'end' },
];

const stocksHeaders = [
  { title: 'Символ', key: 'symbol' },
  { title: 'Компания', key: 'companyName' },
  { title: 'Текущая цена', key: 'currentPrice', align: 'end' },
  { title: 'Действия', key: 'actions', sortable: false },
];

const formatCurrency = (value?: number | null) => {
  if (value == null || isNaN(value)) return '—';
  return `$${value.toFixed(2)}`;
};

const currentPrice = (symbol?: string | null) => {
  if (!symbol) return 0;
  return tradingStore.currentPriceFor(symbol) || 0;
};

const openChart = (stock: Stock) => {
  selectedStock.value = stock;
  chartDialog.value = true;
  prepareChart(stock);
};

const openTradeDialog = (stock: Stock, mode: 'buy' | 'sell') => {
  selectedStock.value = stock;
  tradeMode.value = mode;
  quantity.value = 1;
  tradeDialog.value = true;
};

const submitTrade = async () => {
  if (!selectedStock.value || !quantity.value) return;
  if (tradeMode.value === 'buy') {
    await tradingStore.buy(selectedStock.value.symbol, quantity.value);
  } else {
    await tradingStore.sell(selectedStock.value.symbol, quantity.value);
  }
  tradeDialog.value = false;
};

const chartData = reactive({
  labels: [] as string[],
  datasets: [] as any[],
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index' as const,
  },
  plugins: {
    legend: { position: 'top' as const },
    title: { display: true, text: 'История цены' },
    tooltip: {
      enabled: true,
      callbacks: {
        title: (context: any) => {
          return context[0].label || '';
        },
        label: (context: any) => {
          return `Цена: $${context.parsed.y.toFixed(2)}`;
        },
      },
    },
  },
  scales: {
    x: {
      type: 'category' as const,
      ticks: {
        maxRotation: 45,
        minRotation: 45,
        autoSkip: true,
        maxTicksLimit: 30, // Увеличиваем количество меток на оси X
        callback: function(value: any, index: number, ticks: any[]) {
          // Показываем каждую N-ю метку для читаемости
          const skip = Math.ceil(ticks.length / 30);
          return index % skip === 0 ? this.getLabelForValue(value) : '';
        },
      },
      grid: {
        display: true,
      },
    },
    y: {
      beginAtZero: false,
      ticks: {
        callback: function(value: any) {
          return '$' + value.toFixed(0);
        },
      },
    },
  },
  elements: {
    point: {
      radius: 0, // Скрываем точки для производительности
      hoverRadius: 4,
      hoverBorderWidth: 2,
    },
    line: {
      borderWidth: 1.5,
      tension: 0.1,
    },
  },
  animation: {
    duration: 0, // Отключаем анимацию для больших данных
  },
};

const parseDate = (dateStr: string): Date => {
  // Формат: MM/DD/YYYY
  if (dateStr.includes('/')) {
    const [month, day, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  }
  // Формат: YYYY-MM-DD
  if (dateStr.includes('-')) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(dateStr);
};

const prepareChart = (stock: Stock) => {
  if (!stock.historicalData || stock.historicalData.length === 0) {
    chartData.labels = [];
    chartData.datasets = [];
    return;
  }

  // Фильтруем и валидируем данные
  const validData = stock.historicalData
    .filter((d) => {
      const price = parseFloat(d.open.replace('$', ''));
      return !isNaN(price) && price > 0 && d.date;
    })
    .map((d) => ({
      ...d,
      price: parseFloat(d.open.replace('$', '')),
      dateObj: parseDate(d.date),
    }))
    .filter((d) => !isNaN(d.dateObj.getTime()));

  if (validData.length === 0) {
    chartData.labels = [];
    chartData.datasets = [];
    return;
  }

  // Сортируем по дате по возрастанию (от старых к новым)
  validData.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  // Используем все данные - Chart.js может обработать до 10k+ точек
  // Для очень больших объемов (>5000) можно использовать выборку, но для 5 лет это не нужно
  const data = validData;
  
  console.log(`Preparing chart with ${data.length} data points for ${stock.symbol}`);

  chartData.labels = data.map((d) => d.date);
  chartData.datasets = [
    {
      label: stock.symbol,
      data: data.map((d) => d.price),
      borderColor: '#1976d2',
      backgroundColor: 'rgba(25, 118, 210, 0.2)',
      tension: 0.1,
      pointRadius: 0, // Скрываем точки для производительности
      pointHoverRadius: 4,
      borderWidth: 1.5,
    },
  ];
};

watch(
  () => tradingStore.prices,
  () => {
    if (selectedStock.value) {
      prepareChart(selectedStock.value);
    }
  },
);
</script>

<style scoped>
.chart-wrapper {
  min-height: 500px;
  width: 100%;
}
</style>

