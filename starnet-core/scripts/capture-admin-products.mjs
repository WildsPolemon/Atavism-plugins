import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const OUT = '/workspace/starnet-core/docs/screenshots/starnet-core';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://127.0.0.1:5174/login', { waitUntil: 'networkidle' });
  await page.getByPlaceholder('Email').fill('admin@starnetcore.local');
  await page.getByPlaceholder('Пароль').fill('admin123');
  await page.getByRole('button', { name: 'Увійти' }).click();
  await page.waitForURL('http://127.0.0.1:5174/', { timeout: 15000 });

  await page.goto('http://127.0.0.1:5174/products', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT, 'admin-products-list.png'), fullPage: true });

  await page.getByRole('button', { name: /Категорії/ }).click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, 'admin-products-categories.png'), fullPage: true });

  await page.getByRole('button', { name: /Створити товар/ }).click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, 'admin-products-create-general.png'), fullPage: true });

  await page.getByRole('button', { name: 'Ціни', exact: true }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, 'admin-products-create-prices.png'), fullPage: true });

  await page.getByRole('button', { name: 'Склад', exact: true }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, 'admin-products-create-warehouse.png'), fullPage: true });

  await browser.close();
  console.log('OK:', OUT);
})();
