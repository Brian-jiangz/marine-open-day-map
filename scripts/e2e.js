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
  await page.locator('.map-stage').waitFor();
  await page.waitForFunction(() => document.querySelector('#mapImage').naturalWidth > 0);

  assert.match(await page.title(), /海洋科学开放日/);
  assert.strictEqual(await page.locator('.building-tab').count(), 3);
  const initialHotspots = await page.locator('.map-hotspot').count();
  assert.ok(initialHotspots >= 40);
  assert.ok(await page.locator('.point-row').count() >= 20);
  assert.ok(await page.locator('.category-chip').count() >= 4);

  const noPageScroll = await page.evaluate(() => (
    document.documentElement.scrollHeight <= document.documentElement.clientHeight + 1
  ));
  assert.ok(noPageScroll, 'map app should use the viewport instead of a long page');

  await page.locator('#zoomIn').click();
  const zoomTransform = await page.locator('#mapStage').evaluate((node) => node.style.transform);
  assert.match(zoomTransform, /scale\((?!1\))/);
  const viewportBox = await page.locator('#mapViewport').boundingBox();
  const stageTopBefore = await page.locator('#mapStage').evaluate((node) => node.style.top);
  await page.mouse.move(viewportBox.x + viewportBox.width * 0.22, viewportBox.y + viewportBox.height * 0.72);
  await page.mouse.down();
  await page.mouse.move(viewportBox.x + viewportBox.width * 0.22, viewportBox.y + viewportBox.height * 0.6, { steps: 5 });
  await page.mouse.up();
  const stageTopAfter = await page.locator('#mapStage').evaluate((node) => node.style.top);
  assert.notStrictEqual(stageTopAfter, stageTopBefore);
  await page.locator('#zoomReset').click();

  if (viewport.width < 760) {
    await page.locator('#pointsToggle').click();
    assert.ok(await page.locator('body').evaluate((node) => node.classList.contains('drawer-open')));
    await page.waitForFunction(() => {
      const pane = document.querySelector('.directory-pane');
      return pane && pane.getBoundingClientRect().top < window.innerHeight;
    });
    await page.locator('.category-chip').nth(1).click();
    assert.ok(await page.locator('#mapViewport').evaluate((node) => node.classList.contains('is-filtering')));
    await page.locator('#drawerClose').click();
  }

  await page.locator('.building-tab[data-building="xp"]').click();
  await page.waitForFunction(() => document.querySelector('#mapImage').src.includes('ov_xp.jpg'));

  await page.locator('#searchInput').fill('台风模拟');
  await page.locator('.search-result').first().waitFor();
  await page.locator('.search-result').first().click();
  await page.locator('#spotDialog[open]').waitFor();
  assert.match(await page.locator('#spotTitle').textContent(), /台风/);
  assert.ok(await page.locator('#searchResults').evaluate((node) => node.hidden));
  await page.locator('#focusButton').click();
  await page.waitForFunction(() => !document.querySelector('#spotDialog').open);
  const focusedTransform = await page.locator('#mapStage').evaluate((node) => node.style.transform);
  assert.match(focusedTransform, /scale\((?!1\))/);

  await page.locator('#fullscreenButton').click();
  assert.ok(await page.locator('#mapViewport').evaluate((node) => node.classList.contains('is-fullscreen')));
  await page.locator('#fullscreenButton').click();
  assert.ok(!(await page.locator('#mapViewport').evaluate((node) => node.classList.contains('is-fullscreen'))));

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
    const deepContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const deepPage = await deepContext.newPage();
    await deepPage.goto(`http://127.0.0.1:${port}/?building=xp&spot=43&lang=zh`, { waitUntil: 'networkidle' });
    await deepPage.locator('#spotDialog[open]').waitFor();
    assert.match(await deepPage.locator('#spotTitle').textContent(), /台风/);
    await deepContext.close();
    console.log(JSON.stringify({ ok: true, mobile, desktop, qr: true, deepLink: true }, null, 2));
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exit(1);
});
