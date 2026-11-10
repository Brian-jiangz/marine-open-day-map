#!/usr/bin/env node
'use strict';

const assert = require('assert');
const path = require('path');
const { chromium } = require('playwright-core');
const { startServer } = require('./serve');

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function inspectViewport(browser, baseUrl, viewport, name) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    reducedMotion: 'no-preference',
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.locator('.map-frame.is-ready').waitFor();
  assert.match(await page.title(), /海洋科学开放日/);
  assert.strictEqual(await page.locator('.building-tab').count(), 3);
  const initialHotspots = await page.locator('.map-hotspot').count();
  assert.ok(initialHotspots >= 40);
  assert.ok(await page.locator('.category-chip').count() >= 4);
  assert.ok(await page.locator('.point-row').count() >= 20);

  await page.locator('.building-tab[data-building="xp"]').click();
  await page.waitForFunction(() => document.querySelector('#mapImage').src.includes('ov_xp.jpg'));

  await page.locator('#searchInput').fill('台风模拟');
  await page.locator('.search-result').first().waitFor();
  await page.locator('.search-result').first().click();
  await page.locator('#spotDialog[open]').waitFor();
  assert.match(await page.locator('#spotTitle').textContent(), /台风/);
  await page.locator('#dialogClose').click();
  assert.ok(await page.locator('#searchResults').evaluate((node) => node.hidden));

  const languageWidth = await page.locator('#languageButton').evaluate((node) => node.getBoundingClientRect().width);
  const careWidth = await page.locator('#careButton').evaluate((node) => node.getBoundingClientRect().width);
  const languageBottom = await page.locator('#languageButton').evaluate((node) => node.getBoundingClientRect().bottom);
  const careTop = await page.locator('#careButton').evaluate((node) => node.getBoundingClientRect().top);
  assert.ok(Math.abs(languageWidth - careWidth) <= 1);
  assert.ok(careTop > languageBottom);

  await page.locator('#careButton').click();
  assert.ok(await page.locator('body').evaluate((node) => node.classList.contains('care-mode')));

  await page.locator('#languageButton').click();
  await page.waitForFunction(() => document.documentElement.lang === 'en');
  assert.match(await page.locator('.brand-lockup strong').textContent(), /Marine Science Open Day/);
  assert.strictEqual(await page.locator('#languageButton').textContent(), '中');

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `horizontal overflow: ${overflow}px`);
  assert.deepStrictEqual(consoleErrors, []);

  await page.screenshot({
    path: path.join(__dirname, '..', `screenshots-${name}.png`),
    fullPage: false,
  });
  await context.close();
  return {
    viewport,
    hotspots: initialHotspots,
    consoleErrors: consoleErrors.length,
  };
}

async function main() {
  const server = await startServer(0);
  const port = server.address().port;
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--disable-gpu'],
  });
  try {
    const mobile = await inspectViewport(browser, `http://127.0.0.1:${port}/`, { width: 390, height: 844 }, 'mobile');
    const desktop = await inspectViewport(browser, `http://127.0.0.1:${port}/`, { width: 1280, height: 900 }, 'desktop');
    const qrContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const qrPage = await qrContext.newPage();
    await qrPage.goto(`http://127.0.0.1:${port}/qr.html`, { waitUntil: 'networkidle' });
    assert.ok(await qrPage.locator('img[src="qr-code.png"]').evaluate((node) => node.complete && node.naturalWidth > 0));
    await qrContext.close();
    console.log(JSON.stringify({ ok: true, mobile, desktop, qr: true }, null, 2));
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exit(1);
});
