import { chromium } from 'playwright';
import path from 'path';

const OUT = '/workspace/starnet-core/docs/screenshots/starnet-core';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://127.0.0.1:5174/login', { waitUntil: 'networkidle' });
  await page.getByPlaceholder('Email').fill('admin@starnetcore.local');
  await page.getByPlaceholder('Пароль').fill('admin123');
  await page.getByRole('button', { name: 'Увійти' }).click();
  await page.waitForURL('http://127.0.0.1:5174/', { timeout: 15000 });

  await page.goto('http://127.0.0.1:5174/products', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT, 'admin-products-list.png'), fullPage: true });

  await page.getByRole('button', { name: /Категорії/ }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, 'admin-products-categories.png'), fullPage: true });

  await page.getByRole('button', { name: /Створити товар/ }).click();
  await page.waitForTimeout(600);

  await page.getByPlaceholder('Назва товару').fill('Кава Арабіка 250г');
  await page.locator('input[placeholder="SKU"]').fill('CF-250');
  await page.locator('input[placeholder="Для ваг / каси"]').fill('1001');
  await page.getByRole('button', { name: 'Випічка' }).click();
  await page.getByRole('button', { name: 'Молочні' }).click();
  await page.screenshot({ path: path.join(OUT, 'admin-products-create-general.png'), fullPage: true });

  await page.getByRole('button', { name: 'Ціни', exact: true }).click();
  await page.waitForTimeout(300);
  const priceInputs = page.locator('input[type="number"]');
  await priceInputs.nth(0).fill('120');
  await priceInputs.nth(1).fill('50');
  await priceInputs.nth(2).fill('180');
  await page.screenshot({ path: path.join(OUT, 'admin-products-create-prices.png'), fullPage: true });

  await page.getByRole('button', { name: 'Склад', exact: true }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, 'admin-products-create-warehouse.png'), fullPage: true });

  await browser.close();
  console.log('OK:', OUT);
})();
