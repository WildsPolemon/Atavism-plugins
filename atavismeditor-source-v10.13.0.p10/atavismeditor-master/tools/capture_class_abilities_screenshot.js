const {chromium} = require('playwright');
const path = require('path');

const outDir = process.argv[2] || '/workspace/releases/editor_media_2026-07-04';
const baseUrl = process.argv[3] || 'http://127.0.0.1:4200';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage({viewport: {width: 1920, height: 1080}});
  page.setDefaultTimeout(120000);

  await page.goto(baseUrl, {waitUntil: 'networkidle', timeout: 120000});
  await page.waitForTimeout(5000);

  const profileDialog = page.locator('.profile-list-container');
  if (await profileDialog.count()) {
    const selectBtn = page.locator('button', {hasText: 'Select'}).first();
    if (await selectBtn.count()) {
      await selectBtn.click({timeout: 10000});
      await page.waitForTimeout(4000);
    }
  }

  const versionDialog = page.locator('.fuse-confirm-dialog-panel');
  if (await versionDialog.count()) {
    const confirmBtn = page.locator('button', {hasText: /Start|Confirm|OK/i}).first();
    if (await confirmBtn.count()) {
      await confirmBtn.click();
      await page.waitForTimeout(3000);
    }
  }

  const characterSection = page.locator('fuse-nav-vertical-collapsable', {hasText: /Character/i}).first();
  if (await characterSection.count()) {
    await characterSection.click({timeout: 10000});
    await page.waitForTimeout(800);
  }

  const tab = page.locator('fuse-nav-vertical-item', {hasText: 'Class Abilities by Level'}).first();
  if (await tab.count()) {
    await tab.click({timeout: 15000});
    await page.waitForTimeout(4000);
    await page.screenshot({
      path: path.join(outDir, 'class_abilities_by_level_editor_real.png'),
      fullPage: false,
    });
    console.log('Saved real editor screenshot: Class Abilities by Level tab');
  } else {
    await page.screenshot({
      path: path.join(outDir, 'class_abilities_by_level_editor_real.png'),
      fullPage: false,
    });
    const bodyText = await page.locator('body').innerText().catch(() => '');
    console.log('Tab not found; saved current view. Body preview:', bodyText.slice(0, 500));
  }

  await browser.close();
})();
