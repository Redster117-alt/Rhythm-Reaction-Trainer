const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const runtimeErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') runtimeErrors.push(`console:${msg.text()}`);
  });
  page.on('pageerror', (error) => runtimeErrors.push(`pageerror:${error.message}`));

  await page.goto('http://127.0.0.1:8000/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  await page.evaluate(() => {
    localStorage.clear();
    document.getElementById('settings-btn').click();
  });

  await page.setInputFiles('#bg-music-file', 'docs/kahbeeewm.mp3');
  await page.check('#bg-music-toggle');
  await page.click('#save-settings-btn');
  await page.waitForTimeout(1000);

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('rtr-audio-settings-v1') || '{}'));
  if (!saved.customBackgroundMusicDataUrl || !saved.customBackgroundMusicUrl) {
    throw new Error(`Audio settings were not persisted: ${JSON.stringify(saved)}`);
  }

  await page.click('#start-btn');
  await page.waitForTimeout(1200);
  await page.click('#stop-btn');
  await page.waitForTimeout(500);

  if (runtimeErrors.length > 0) {
    throw new Error(runtimeErrors.join('\n'));
  }

  console.log('PASS custom audio settings persisted and the start/stop flow completed without runtime errors.');
  await browser.close();
})();
