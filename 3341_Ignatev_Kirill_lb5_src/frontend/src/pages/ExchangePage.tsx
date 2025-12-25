import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { PlayArrow, Stop } from '@mui/icons-material';
import io, { Socket } from 'socket.io-client';
import { AppDispatch, RootState } from '../store/store';
import { fetchSettings, updateSettings } from '../store/slices/exchangeSlice';
import { setCurrentPrices, setCurrentDate } from '../store/slices/exchangeSlice';
import { fetchStocks } from '../store/slices/stocksSlice';

const ExchangePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { settings, currentPrices } = useSelector((state: RootState) => state.exchange);
  const { stocks } = useSelector((state: RootState) => state.stocks);
  const [, setSocket] = useState<Socket | null>(null);
  const [formData, setFormData] = useState({
    startDate: '',
    dateChangeSpeed: '',
  });

  useEffect(() => {
    dispatch(fetchSettings());
    dispatch(fetchStocks());
  }, [dispatch]);

  useEffect(() => {
    if (settings) {
      setFormData({
        startDate: settings.startDate,
        dateChangeSpeed: settings.dateChangeSpeed.toString(),
      });
    }
  }, [settings]);

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('trading-update', (data: { currentDate: string; prices: { [symbol: string]: number } }) => {
      dispatch(setCurrentDate(data.currentDate));
      dispatch(setCurrentPrices(data.prices));
    });

    return () => {
      newSocket.close();
    };
  }, [dispatch]);

  const handleSaveSettings = () => {
    dispatch(updateSettings({
      startDate: formData.startDate,
      dateChangeSpeed: parseFloat(formData.dateChangeSpeed),
    }));
  };

  const handleStartTrading = async () => {
    try {
      await fetch('http://localhost:3001/api/trading/start', {
        method: 'POST',
      });
      dispatch(fetchSettings());
    } catch (error) {
      console.error('Failed to start trading:', error);
    }
  };

  const handleStopTrading = async () => {
    try {
      await fetch('http://localhost:3001/api/trading/stop', {
        method: 'DELETE',
      });
      dispatch(fetchSettings());
    } catch (error) {
      console.error('Failed to stop trading:', error);
    }
  };

  const activeStocks = stocks.filter(s => s.isActive);

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 3, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
        Настройки биржи
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Параметры торгов
              </Typography>
              <TextField
                fullWidth
                label="Дата начала торгов"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Скорость смены дат (секунды)"
                type="number"
                value={formData.dateChangeSpeed}
                onChange={(e) => setFormData({ ...formData, dateChangeSpeed: e.target.value })}
                margin="normal"
              />
              <Button
                variant="contained"
                onClick={handleSaveSettings}
                sx={{ mt: 2 }}
              >
                Сохранить настройки
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Управление торгами
              </Typography>
              {activeStocks.length === 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Необходимо выбрать хотя бы одну акцию для участия в торгах
                </Alert>
              )}
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<PlayArrow />}
                  onClick={handleStartTrading}
                  disabled={activeStocks.length === 0 || settings?.isTrading}
                >
                  Начало торгов
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<Stop />}
                  onClick={handleStopTrading}
                  disabled={!settings?.isTrading}
                >
                  Остановить торги
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {settings?.isTrading && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Текущее состояние торгов
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Текущая дата: <strong>{settings.currentDate || 'Н/Д'}</strong>
                </Typography>
                <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                  <Table size={isMobile ? 'small' : 'medium'}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Символ</TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Компания</TableCell>
                        <TableCell align="right">Текущая цена</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activeStocks.map((stock) => (
                        <TableRow key={stock.symbol}>
                          <TableCell><strong>{stock.symbol}</strong></TableCell>
                          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{stock.companyName}</TableCell>
                          <TableCell align="right">
                            {currentPrices[stock.symbol] ? `$${currentPrices[stock.symbol].toFixed(2)}` : 'Н/Д'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default ExchangePage;

