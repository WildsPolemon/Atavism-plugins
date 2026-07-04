const {chromium} = require('playwright');
const http = require('http');
const path = require('path');

const outDir = process.argv[2] || '/workspace/releases/editor_media_2026-07-04';
const cdpPort = process.argv[3] || '9222';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function dismissToasts(page) {
  const closeButtons = page.locator('.toast-close-button, button[aria-label="Close"]');
  const count = await closeButtons.count();
  for (let i = 0; i < Math.min(count, 12); i++) {
    await closeButtons.nth(0).click({timeout: 2000}).catch(() => {});
    await page.waitForTimeout(150);
  }
}

async function openTab(page, sectionName, tabName) {
  const section = page.locator('fuse-nav-vertical-collapsable .nav-link-title', {hasText: sectionName}).first();
  await section.scrollIntoViewIfNeeded().catch(() => {});
  await section.click({timeout: 15000});
  await page.waitForTimeout(700);

  const tab = page.locator('fuse-nav-vertical-item .nav-link-title', {hasText: tabName}).first();
  await tab.scrollIntoViewIfNeeded().catch(() => {});
  await tab.click({timeout: 15000});
  await page.waitForTimeout(3000);
}

(async () => {
  const targets = await fetchJson(`http://127.0.0.1:${cdpPort}/json/list`);
  const pageTarget = targets.find((t) => t.type === 'page' && t.url.includes('localhost:4200'));
  if (!pageTarget) {
    throw new Error('Electron page target not found');
  }

  const browser = await chromium.connect({wsEndpoint: pageTarget.webSocketDebuggerUrl});
  const context = browser.contexts()[0] || (await browser.newContext());
  const pages = context.pages();
  const page = pages.find((p) => p.url().includes('localhost:4200')) || pages[0];
  page.setDefaultTimeout(120000);

  await page.waitForTimeout(5000);
  await dismissToasts(page);
  await openTab(page, 'Character', 'Class Abilities by Level');
  await dismissToasts(page);

  await page.locator('text=Class Abilities by Level').first().waitFor({state: 'visible', timeout: 30000}).catch(() => {});

  const outFile = path.join(outDir, 'class_abilities_by_level_editor_real.png');
  await page.screenshot({path: outFile, fullPage: false});
  console.log('Saved CDP screenshot to', outFile);

  await browser.close();
})();
