import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  Card,
  CardContent,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material';
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
import { Line } from 'react-chartjs-2';
import { AppDispatch, RootState } from '../store/store';
import { fetchStocks, updateStock } from '../store/slices/stocksSlice';
import { Stock, StockPrice } from '../store/slices/stocksSlice';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const StocksPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { stocks, loading } = useSelector((state: RootState) => state.stocks);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [chartDialogOpen, setChartDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    dispatch(fetchStocks());
  }, [dispatch]);

  const handleToggleActive = (stock: Stock) => {
    dispatch(updateStock({
      symbol: stock.symbol,
      updates: { isActive: !stock.isActive },
    }));
  };

  const handleViewHistory = (stock: Stock) => {
    setSelectedStock(stock);
    setChartDialogOpen(true);
  };

  const prepareChartData = (historicalData: StockPrice[]) => {
    const lastYear = historicalData.slice(-365);
    const labels = lastYear.map(d => {
      const [month, day, year] = d.date.split('/');
      return `${day}.${month}.${year}`;
    });
    const data = lastYear.map(d => parseFloat(d.open.replace('$', '')));

    return {
      labels,
      datasets: [
        {
          label: 'Цена открытия',
          data,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Исторические данные по курсу акций',
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 3, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
        Управление акциями
      </Typography>

      <Card>
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
          <TableContainer component={Paper} sx={{ maxHeight: '70vh', overflowX: 'auto' }}>
            <Table stickyHeader size={isMobile ? 'small' : 'medium'}>
              <TableHead>
                <TableRow>
                  <TableCell>Обозначение</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Название компании</TableCell>
                  <TableCell align="center">Участвует в торгах</TableCell>
                  <TableCell align="center">Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">Загрузка...</TableCell>
                  </TableRow>
                ) : stocks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">Нет акций</TableCell>
                  </TableRow>
                ) : (
                  stocks.map((stock) => (
                    <TableRow key={stock.symbol}>
                      <TableCell><strong>{stock.symbol}</strong></TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{stock.companyName}</TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={stock.isActive}
                          onChange={() => handleToggleActive(stock)}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleViewHistory(stock)}
                        >
                          История
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog
        open={chartDialogOpen}
        onClose={() => setChartDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
          {selectedStock && `${selectedStock.symbol} - ${selectedStock.companyName}`}
        </DialogTitle>
        <DialogContent>
          {selectedStock && (
            <Box>
              <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
                <Tab label="График" />
                <Tab label="Таблица" />
              </Tabs>
              {tabValue === 0 && (
                <Box sx={{ height: { xs: '300px', sm: '400px' }, mt: 2 }}>
                  <Line data={prepareChartData(selectedStock.historicalData)} options={chartOptions} />
                </Box>
              )}
              {tabValue === 1 && (
                <TableContainer sx={{ maxHeight: { xs: '300px', sm: '400px' }, mt: 2, overflowX: 'auto' }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Дата</TableCell>
                        <TableCell align="right">Цена открытия</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedStock.historicalData.slice(-365).reverse().map((data, index) => (
                        <TableRow key={index}>
                          <TableCell>{data.date}</TableCell>
                          <TableCell align="right">{data.open}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default StocksPage;

