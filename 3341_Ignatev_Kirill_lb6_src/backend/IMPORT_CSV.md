# Импорт данных из CSV файлов

После обновления CSV файлов в папке `backend/CSV/` необходимо переимпортировать данные.

## Способ 1: Импорт всех акций (рекомендуется)

```bash
curl -X POST http://localhost:3001/api/stocks/import-csv
```

Это обновит данные для всех акций, для которых есть CSV файлы в папке `backend/CSV/`.

## Способ 2: Импорт конкретной акции

```bash
# Например, для AAPL
curl -X POST http://localhost:3001/api/stocks/AAPL/import-csv
```

## Проверка результата

После импорта проверьте количество данных:

```bash
# Проверить количество точек данных для AAPL
curl http://localhost:3001/api/stocks/AAPL | jq '.historicalData | length'
```

## Формат CSV файлов

CSV файлы должны:
- Называться `{SYMBOL}.csv` (например, `AAPL.csv`, `TSLA.csv`)
- Иметь заголовок: `Date,Close/Last,Volume,Open,High,Low`
- Дата в формате `MM/DD/YYYY`
- Цена Open в формате `$XXX.XX` или `XXX.XX`

## Примечание

После импорта данные сохраняются в `backend/data/stocks.json`. Если данные не отображаются на фронтенде:
1. Убедитесь, что backend перезапущен
2. Обновите страницу в браузере
3. Проверьте консоль браузера на наличие ошибок



