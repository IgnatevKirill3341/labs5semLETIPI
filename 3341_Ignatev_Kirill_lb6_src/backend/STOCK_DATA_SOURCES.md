# Источники данных для акций

Система поддерживает несколько источников исторических данных о ценах акций. Вы можете выбрать источник через переменную окружения `STOCK_DATA_SOURCE`.

## Доступные источники

### 1. CSV (по умолчанию, рекомендуется)

**Преимущества:**
- Не требует API ключа
- Использует локальные CSV файлы из `backend/CSV/`
- Быстро и надежно
- Реальные данные из ваших файлов

**Формат CSV файлов:**
- Файлы должны называться `{SYMBOL}.csv` (например, `AAPL.csv`, `TSLA.csv`)
- Формат: `Date,Close/Last,Volume,Open,High,Low`
- Дата в формате `MM/DD/YYYY`

**Настройка:**
```
STOCK_DATA_SOURCE=csv
```

**Использование:**
1. Поместите CSV файлы в папку `backend/CSV/`
2. Назовите файлы по символу акции (например, `AAPL.csv`, `TSLA.csv`)
3. Вызовите endpoint для импорта:
   ```bash
   curl -X POST http://localhost:3001/api/stocks/import-csv
   ```

### 2. Alpha Vantage

**Преимущества:**
- Бесплатный API ключ
- Реальные исторические данные
- Надежный и стабильный

**Ограничения:**
- 5 запросов в минуту
- 500 запросов в день

**Настройка:**
1. Получите бесплатный API ключ: https://www.alphavantage.co/support/#api-key
2. Создайте файл `.env` в папке `backend/`:
   ```
   STOCK_DATA_SOURCE=alphavantage
   ALPHA_VANTAGE_API_KEY=ваш_ключ_здесь
   ```

### 3. Finnhub

**Преимущества:**
- Бесплатный API ключ
- Реальные исторические данные
- 60 запросов в минуту

**Настройка:**
1. Зарегистрируйтесь: https://finnhub.io/register
2. Получите API ключ
3. Создайте файл `.env` в папке `backend/`:
   ```
   STOCK_DATA_SOURCE=finnhub
   FINNHUB_API_KEY=ваш_ключ_здесь
   ```

### 4. Alternative (резервный метод)

**Преимущества:**
- Не требует API ключа
- Всегда работает
- Реалистичное случайное блуждание (±3% в день)

**Недостатки:**
- Не реальные данные (симулированные)

**Настройка:**
```
STOCK_DATA_SOURCE=alternative
```

## Использование

После настройки `.env` файла, перезапустите backend и обновите данные:

```bash
# Обновить данные для всех акций
curl -X POST http://localhost:3001/api/stocks/fetch-all-historical

# Или для конкретной акции
curl -X POST http://localhost:3001/api/stocks/AAPL/fetch-historical
```

## Пример .env файла

Создайте файл `backend/.env`:

```env
# Выберите источник данных (по умолчанию: csv)
STOCK_DATA_SOURCE=csv

# Если используете Alpha Vantage
# STOCK_DATA_SOURCE=alphavantage
# ALPHA_VANTAGE_API_KEY=ваш_ключ_здесь

# Если используете Finnhub
# STOCK_DATA_SOURCE=finnhub
# FINNHUB_API_KEY=ваш_ключ_здесь
```

## Рекомендации

- **Рекомендуется:** используйте `csv` (по умолчанию) - поместите CSV файлы в `backend/CSV/` и вызовите `/api/stocks/import-csv`
- Для онлайн данных: используйте `alphavantage` или `finnhub` с API ключами
- При проблемах с одним источником система автоматически переключится на `csv` или `alternative`

