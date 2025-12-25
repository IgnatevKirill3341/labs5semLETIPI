import { test, expect, request } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:3001';
const APP_URL = process.env.APP_URL || 'http://localhost:5173';
const SYMBOL = 'AAPL';

test.describe('Trader E2E', () => {
  test('login requires broker selection and persists after reload', async ({ page, request }) => {
    const brokerName = `Persist Broker ${Date.now()}`;
    const brokerRes = await request.post(`${API_URL}/api/brokers`, {
      data: { name: brokerName, initialCash: 5000 },
    });
    expect(brokerRes.ok()).toBeTruthy();

    await page.goto(`${APP_URL}/login`);
    const continueBtn = page.getByRole('button', { name: 'Продолжить' });
    await expect(continueBtn).toBeDisabled();

    await page.getByTestId('broker-select').click();
    await page.getByText(brokerName, { exact: true }).click();
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();
    await expect(page).toHaveURL(/trade/);

    // reload and ensure guard keeps us on trade due to stored brokerId
    await page.reload();
    await expect(page).toHaveURL(/trade/);
    await expect(page.getByTestId('cash-value')).toBeVisible();
  });

  test('buying and selling updates cash and positions', async ({ page }) => {
    // Prepare backend state
    const api = await request.newContext({ baseURL: API_URL });
    const brokerName = `Test Broker ${Date.now()}`;
    const brokerRes = await api.post('/api/brokers', {
      data: { name: brokerName, initialCash: 10000 },
    });
    expect(brokerRes.ok()).toBeTruthy();
    const broker = await brokerRes.json();

    await api.put(`/api/stocks/${SYMBOL}`, { data: { isActive: true } });

    // Open app and login
    await page.goto(`${APP_URL}/login`);
    await page.getByTestId('broker-select').click();
    await page.getByText(brokerName, { exact: true }).click();
    await page.getByRole('button', { name: 'Продолжить' }).click();

    await expect(page).toHaveURL(/trade/);

    const cashLocator = page.getByTestId('cash-value');
    const balanceBefore = await cashLocator.innerText();
    const buyButton = page.getByTestId(`buy-${SYMBOL}`);
    await buyButton.click();
    await page.getByTestId('quantity-input').getByRole('spinbutton').fill('2');
    await page.getByTestId('confirm-trade').click();

    await expect(page.getByTestId('portfolio-table').getByRole('row', { name: new RegExp(`^${SYMBOL}`) })).toBeVisible();
    await expect(cashLocator).not.toHaveText(balanceBefore);
    const balanceAfterBuy = await cashLocator.innerText();

    const sellButton = page.getByTestId(`sell-${SYMBOL}`);
    await sellButton.click();
    await page.getByTestId('quantity-input').getByRole('spinbutton').fill('1');
    await page.getByTestId('confirm-trade').click();

    await expect(cashLocator).not.toHaveText(balanceAfterBuy);
    const balanceAfterSell = await cashLocator.innerText();
    expect(balanceAfterSell).not.toBe(balanceAfterBuy);
  });
});

