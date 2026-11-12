#!/usr/bin/env node
'use strict';
const assert = require('assert');
const path = require('path');
const { chromium } = require('playwright-core');
const { startServer } = require('./serve');

async function inspectViewport(browser, baseUrl, viewport, name) {
  const context = await browser.newContext({viewport, deviceScaleFactor:1});
  const page = await context.newPage();
  const errors = [], requests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => requests.push({url:request.url(), method:request.method()}));
  await page.goto(baseUrl, {waitUntil:'networkidle'});
  await page.waitForFunction(() => document.querySelector('#mapImage').naturalWidth > 0);
  assert.equal(await page.locator('.building-tab').count(),4);
  assert.match(await page.locator('#mapImage').getAttribute('src'),/ov_campus.jpg/);
  assert.equal(await page.locator('.security-post').count(),6);
  assert.equal(await page.locator('.campus-hot').count(),3);
  assert.equal(await page.locator('.music-card').count(),3);
  assert.equal(await page.locator('#pointsToggle').isVisible(),false);
  const ratio = await page.locator('#mapStage').evaluate(node=>node.offsetWidth/node.offsetHeight);
  assert.ok(Math.abs(ratio-845/590)<.01,'campus image keeps original proportions');
  // Match the reference at the first screen, with vertical scrolling for supporting content.
  await page.screenshot({path:path.join(__dirname,'..',`screenshots-${name}.png`), fullPage:true});
  await page.locator('.campus-hot[aria-label="周隆泉楼"]').click();
  await page.waitForFunction(()=>document.querySelector('#mapImage').src.includes('ov_zlq.jpg') && document.querySelector('#mapImage').complete);
  assert.equal(await page.locator('.security-post').count(),3);
  assert.equal(await page.locator('.medical').count(),1);
  assert.ok(await page.locator('.map-hotspot').count()>=40);
  const stage = await page.locator('#mapStage').boundingBox();
  const map = await page.locator('#mapViewport').boundingBox();
  assert.ok(Math.abs(stage.height/map.height-1)<.01,'building map fills its natural-height card');
  await page.locator('.category-chip').nth(1).click();
  assert.ok(await page.locator('#mapViewport').evaluate(node=>node.classList.contains('is-filtering')));
  assert.ok(await page.locator('.point-row').first().isVisible());
  await page.locator('.category-chip').first().click();
  assert.ok(!await page.locator('#mapViewport').evaluate(node=>node.classList.contains('is-filtering')));
  await page.locator('#pointsToggle').click();
  assert.equal(await page.locator('#pointsToggle').getAttribute('aria-expanded'),'true');
  assert.ok(await page.locator('.point-row').first().isVisible());
  await page.locator('.building-tab[data-building="xp"]').click();
  assert.equal(await page.locator('.security-post').count(),1);
  assert.equal(await page.locator('.medical').count(),0);
  assert.equal(await page.locator('.label-fix').count(),2);
  await page.locator('.building-tab[data-building="jq"]').click();
  assert.equal(await page.locator('.security-post').count(),2);
  await page.locator('#searchInput').fill('台风模拟');
  await page.locator('.search-result').first().click();
  await page.locator('#spotDialog[open]').waitFor();
  assert.match(await page.locator('#spotTitle').textContent(),/台风/);
  assert.match(await page.locator('#mapImage').getAttribute('src'),/ov_xp.jpg/);
  await page.locator('#focusButton').click();
  await page.waitForFunction(()=>document.querySelector('#mapViewport').classList.contains('is-fullscreen'));
  await page.waitForFunction(()=>document.querySelector('#mapStage').style.transform==='scale(2.5)');
  await page.locator('#zoomReset').click();
  await page.locator('#zoomIn').click();
  await page.locator('#zoomIn').click();
  await page.locator('#zoomIn').click();
  const transform = await page.locator('#mapStage').getAttribute('style');
  await page.mouse.move(viewport.width-4,viewport.height*.5);
  await page.mouse.down(); await page.mouse.move(viewport.width-4,viewport.height*.4,{steps:5}); await page.mouse.up();
  assert.notEqual(await page.locator('#mapStage').getAttribute('style'),transform,`fullscreen can pan (${name}, before=${transform}, after=${await page.locator('#mapStage').getAttribute('style')})`);
  await page.locator('#zoomReset').click();
  await page.locator('#zoomIn').click();
  assert.match(await page.locator('#mapStage').evaluate(node=>node.style.transform),/scale\(1.25\)/);
  await page.keyboard.press('Escape');
  assert.ok(!await page.locator('#mapViewport').evaluate(node=>node.classList.contains('is-fullscreen')));
  await page.locator('#searchInput').fill('NO_SUCH_STATION');
  assert.ok(await page.locator('.search-empty').isVisible());
  await page.locator('#clearSearch').click();
  await page.locator('#careButton').click();
  assert.equal(await page.locator('#careButton').getAttribute('aria-pressed'),'true');
  await page.locator('#languageButton').click();
  assert.equal(await page.locator('html').getAttribute('lang'),'en');
  assert.match(await page.locator('h1').textContent(),/Marine Science Open Day/);
  assert.equal(await page.locator('#languageButton').textContent(),'中');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  assert.ok(overflow<=1,`horizontal overflow ${overflow}`);
  assert.equal(await page.evaluate(()=>localStorage.length),0,'visitor preferences stay in page memory');
  assert.deepEqual(errors,[]);
  assert.ok(requests.every(request=>request.url.startsWith(baseUrl) && request.method==='GET'),'only local public resources requested');
  await context.close();
  return {viewport, errors:errors.length, securityPosts:12, medical:true, search:true, zoom:true, languages:true};
}

async function main(){
  const server=await startServer(0);
  const baseUrl=`http://127.0.0.1:${server.address().port}/`;
  const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--disable-gpu']});
  try {
    const results=[];
    for(const [name,width,height] of [['mobile',390,844],['small-mobile',320,740],['tablet',768,1024],['desktop',1280,900]]){
      results.push(await inspectViewport(browser,baseUrl,{width,height},name));
    }
    const page=await browser.newPage({viewport:{width:390,height:844}});
    await page.goto(baseUrl+'?building=xp&spot=43&lang=zh',{waitUntil:'networkidle'});
    await page.locator('#spotDialog[open]').waitFor();
    assert.match(await page.locator('#spotTitle').textContent(),/台风/);
    await page.locator('#dialogClose').click();
    await page.clock.install({time:new Date('2026-11-14T10:56:00+08:00')});
    await page.reload({waitUntil:'networkidle'});
    await page.locator('.music-card').first().click();
    assert.ok(await page.locator('#musicOpen').isVisible());
    await page.locator('#musicOpen').click();
    assert.match(await page.locator('#musicDetailTitle').textContent(),/中西合鸣/);
    await page.locator('#musicLocate').click();
    await page.waitForFunction(()=>document.querySelector('#mapViewport').classList.contains('is-fullscreen'));
    assert.match(await page.locator('#mapImage').getAttribute('src'),/ov_zlq.jpg/);
    await page.keyboard.press('Escape');
    await page.locator('.building-tab[data-building="campus"]').click();
    await page.locator('#mapHotspots').click({position:{x:10,y:120}});
    await page.waitForFunction(()=>document.querySelector('#mapViewport').classList.contains('is-fullscreen'));
    assert.equal(await page.locator('.security-post').count(),6);
    await page.keyboard.press('Escape');
    await page.goto(baseUrl+'qr.html');
    assert.ok(await page.locator('img[src="qr-code.png"]').evaluate(node=>node.complete&&node.naturalWidth>0));
    console.log(JSON.stringify({ok:true,results,deepLink:true,musicTiming:true,qr:true},null,2));
  } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{console.error(error.stack||error);process.exit(1)});
