/* Скриншоты прототипа на разных брейкпоинтах: npm run shots -> shots/ */
const fs = require('fs');
const path = require('path');
const { launch } = require('./chrome');

const DIST = path.resolve(__dirname, '..', 'dist');
const OUT = path.resolve(__dirname, '..', 'shots');
const url = (file) => 'file:///' + path.join(DIST, file).replace(/\\/g, '/');

const VIEWPORTS = [
  { name: 'mobile-375', width: 375, height: 812, file: 'index.html' },
  { name: 'tablet-768', width: 768, height: 1024, file: 'catalog.html' },
  { name: 'desktop-1440', width: 1440, height: 900, file: 'index.html' },
  { name: 'wide-2560', width: 2560, height: 1400, file: 'index.html' }
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await launch();
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    // dsf=1: полностраничный снимок длиннее ~16k px иначе Chrome дублирует контент
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });
    await page.goto(url(vp.file), { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 500));
    const file = path.join(OUT, `${vp.name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log(file);
    await page.close();
  }
  await browser.close();
})();
