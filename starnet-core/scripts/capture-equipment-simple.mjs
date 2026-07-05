import { chromium } from 'playwright';
import path from 'path';

const OUT = '/workspace/starnet-core/docs/screenshots/starnet-core';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://127.0.0.1:5175/login', { waitUntil: 'networkidle' });
  await page.getByPlaceholder('Email').fill('cashier@starnetcore.local');
  await page.getByPlaceholder('Пароль').fill('cashier123');
  await page.getByRole('button', { name: 'увійти', exact: true }).click();
  await page.waitForTimeout(2000);

  await page.getByRole('button', { name: /Меню/i }).click();
  await page.waitForTimeout(500);
  await page.getByText('Налаштування').click();
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: 'Обладнання' }).click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, 'pos-settings-equipment-simple.png'), fullPage: true });

  await browser.close();
  console.log('OK');
})();
