const path = require('path');

const outDir = process.argv[2] || '/workspace/releases/editor_media_2026-07-04';
const profileFolder = path.resolve(__dirname, 'screenshot-setup/screenshot-profile');

async function safeCount(locator) {
  try {
    return await locator.count();
  } catch {
    return 0;
  }
}

async function dismissToasts(page) {
  const closeButtons = page.locator('.toast-close-button, button[aria-label="Close"]');
  const count = await safeCount(closeButtons);
  for (let i = 0; i < Math.min(count, 12); i++) {
    await closeButtons.nth(0).click({timeout: 2000}).catch(() => {});
    await page.waitForTimeout(150);
  }
}

async function openTab(page, sectionName, tabName) {
  const section = page.locator('fuse-nav-vertical-collapsable .nav-link-title', {hasText: sectionName}).first();
  await section.scrollIntoViewIfNeeded().catch(() => {});
  await section.click({timeout: 15000});
  await page.waitForTimeout(900);

  const tab = page.locator('fuse-nav-vertical-item .nav-link-title', {hasText: tabName}).first();
  await tab.scrollIntoViewIfNeeded().catch(() => {});
  await tab.click({timeout: 15000});
  await page.waitForTimeout(4000);
}

(async () => {
  const { _electron: electron } = require('playwright');
  const electronApp = await electron.launch({
    args: ['.', '--serve', `projectpath=${profileFolder}`],
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      DISPLAY: process.env.DISPLAY || ':1',
    },
    timeout: 180000,
  });

  const page = await electronApp.firstWindow();
  page.setDefaultTimeout(120000);
  await page.waitForLoadState('domcontentloaded', {timeout: 120000}).catch(() => {});
  await page.waitForTimeout(12000);

  if (await safeCount(page.locator('.fuse-confirm-dialog-panel'))) {
    await page.locator('button', {hasText: /Start|Confirm/i}).first().click({timeout: 5000}).catch(() => {});
    await page.waitForTimeout(2000);
  }

  await dismissToasts(page);
  await openTab(page, 'Character', 'Class Abilities by Level');
  await dismissToasts(page);

  await page.locator('text=Class Abilities by Level').first().waitFor({state: 'visible', timeout: 30000}).catch(() => {});
  await page.locator('text=Battle Stance').first().waitFor({state: 'visible', timeout: 20000}).catch(() => {});

  const outFile = path.join(outDir, 'class_abilities_by_level_editor_real.png');
  await page.screenshot({path: outFile, fullPage: false});
  console.log('Saved Electron screenshot to', outFile);

  await electronApp.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
