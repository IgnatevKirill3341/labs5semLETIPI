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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import { AppDispatch, RootState } from '../store/store';
import { fetchBrokers, addBroker, updateBroker, deleteBroker } from '../store/slices/brokersSlice';
import { Broker } from '../store/slices/brokersSlice';

const BrokersPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { brokers, loading } = useSelector((state: RootState) => state.brokers);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBroker, setEditingBroker] = useState<Broker | null>(null);
  const [formData, setFormData] = useState({ name: '', initialCash: '' });

  useEffect(() => {
    dispatch(fetchBrokers());
  }, [dispatch]);

  const handleOpenDialog = (broker?: Broker) => {
    if (broker) {
      setEditingBroker(broker);
      setFormData({ 
        name: broker.name || '', 
        initialCash: broker.initialCash != null ? broker.initialCash.toString() : '0' 
      });
    } else {
      setEditingBroker(null);
      setFormData({ name: '', initialCash: '' });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingBroker(null);
    setFormData({ name: '', initialCash: '' });
  };

  const handleSubmit = () => {
    const initialCash = parseFloat(formData.initialCash) || 0;
    if (editingBroker) {
      dispatch(updateBroker({
        id: editingBroker.id,
        updates: {
          name: formData.name,
          initialCash: initialCash,
        },
      }));
    } else {
      dispatch(addBroker({
        name: formData.name,
        initialCash: initialCash,
      }));
    }
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этого брокера?')) {
      dispatch(deleteBroker(id));
    }
  };

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 },
      }}>
        <Typography variant="h4" component="h1" sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          Управление брокерами
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          fullWidth={isMobile}
          sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
        >
          Добавить брокера
        </Button>
      </Box>

      <Card>
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
          <TableContainer component={Paper} sx={{ maxHeight: '70vh', overflowX: 'auto' }}>
            <Table stickyHeader size={isMobile ? 'small' : 'medium'}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>ID</TableCell>
                  <TableCell>Имя</TableCell>
                  <TableCell align="right">Начальный баланс</TableCell>
                  <TableCell align="center">Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">Загрузка...</TableCell>
                  </TableRow>
                ) : brokers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">Нет брокеров</TableCell>
                  </TableRow>
                ) : (
                  brokers.map((broker) => (
                    <TableRow key={broker.id}>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{broker.id}</TableCell>
                      <TableCell>{broker.name || ''}</TableCell>
                      <TableCell align="right">${(broker.initialCash != null ? broker.initialCash : 0).toFixed(2)}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(broker)}
                          color="primary"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(broker.id)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingBroker ? 'Редактировать брокера' : 'Добавить брокера'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Имя"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Начальный баланс"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.initialCash}
            onChange={(e) => setFormData({ ...formData, initialCash: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingBroker ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BrokersPage;

