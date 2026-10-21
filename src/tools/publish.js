/* Публикация: node tools/publish.js
   1) dist-onefile/index.html — сайт в одном файле (CSS и JS встроены)
   2) dist/media/*.png — изображения для карточки работы
   Модуль экспортирует функции: используется также обезличенной сборкой. */

const fs = require('fs');
const path = require('path');
const { launch } = require('./chrome');

const ROOT = path.resolve(__dirname, '..');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function buildSingleFile(distDir, outFile) {
  const html = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(distDir, 'styles.css'), 'utf8');
  const js = ['data.js', 'app.js', 'pages.js'].map((f) => fs.readFileSync(path.join(distDir, f), 'utf8')).join('\n');

  // замена через функцию: «$$», «$&», «$'» в коде не должны трактоваться как спецпаттерны
  const out = html
    .replace(/<link[^>]+href="styles\.css"[^>]*>/, () => `<style>\n${css}\n</style>`)
    .replace(/<script[^>]+src="data\.js"[^>]*><\/script>/, () => '')
    .replace(/<script[^>]+src="app\.js"[^>]*><\/script>/, () => '')
    .replace(/<script[^>]+src="pages\.js"[^>]*><\/script>/, () => `<script>\n${js}\n</script>`);

  if (/href="styles\.css"/.test(out) || /src="(data|app|pages)\.js"/.test(out)) {
    throw new Error('Сборка неполная: в index.html остались внешние ссылки на css/js');
  }
  if (!out.includes('site-header') || !out.includes('data-page=')) {
    throw new Error('Сборка неполная: разметка не найдена');
  }

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, out);
  return out.length;
}

async function shoot(distDir, mediaDir) {
  const browser = await launch();
  fs.mkdirSync(mediaDir, { recursive: true });
  const url = (file) => 'file:///' + path.join(distDir, file).replace(/\\/g, '/');

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  // обложка — главная
  await page.goto(url('index.html'), { waitUntil: 'networkidle2' });
  await wait(600);
  await page.screenshot({ path: path.join(mediaDir, 'cover.png') });

  // каталог
  await page.goto(url('catalog.html'), { waitUntil: 'networkidle2' });
  await wait(600);
  await page.screenshot({ path: path.join(mediaDir, 'catalog.png') });

  // карточка товара
  await page.goto(url('product.html?id=cg158'), { waitUntil: 'networkidle2' });
  await wait(600);
  await page.screenshot({ path: path.join(mediaDir, 'product.png') });

  // корзина
  await page.goto(url('cart.html'), { waitUntil: 'networkidle2' });
  await wait(400);
  await page.goto(url('product.html?id=cg158'), { waitUntil: 'networkidle2' });
  await wait(400);
  await page.evaluate(() => {
    const opt = document.getElementById('pmVariant');
    const add = document.getElementById('pmAdd');
    if (opt) opt.selectedIndex = 1;
    if (add) add.click();
  });
  await page.goto(url('cart.html'), { waitUntil: 'networkidle2' });
  await wait(500);
  await page.screenshot({ path: path.join(mediaDir, 'cart.png') });

  // сравнение
  await page.goto(url('catalog.html'), { waitUntil: 'networkidle2' });
  await wait(400);
  await page.evaluate(() => {
    document.querySelector('[data-compare="tr150"]')?.click();
    document.querySelector('[data-compare="mt180"]')?.click();
  });
  await page.goto(url('compare.html'), { waitUntil: 'networkidle2' });
  await wait(500);
  await page.screenshot({ path: path.join(mediaDir, 'compare.png') });

  // статья гида
  await page.goto(url('article.html?slug=ceramic-9h-vs-10h'), { waitUntil: 'networkidle2' });
  await wait(500);
  await page.screenshot({ path: path.join(mediaDir, 'article.png') });
  await page.close();

  // мобильный вид
  const m = await browser.newPage();
  await m.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await m.goto(url('index.html'), { waitUntil: 'networkidle2' });
  await wait(600);
  await m.screenshot({ path: path.join(mediaDir, 'mobile.png') });
  await m.close();

  await browser.close();
}

async function main() {
  const distDir = path.join(ROOT, 'dist');
  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    console.error('Нет dist/index.html — сначала выполните: npm run build');
    process.exit(1);
  }
  const size = buildSingleFile(distDir, path.join(ROOT, 'dist-onefile', 'index.html'));
  console.log(`dist-onefile/index.html — ${Math.round(size / 1024)} КБ (однофайловая версия)`);
  await shoot(distDir, path.join(distDir, 'media'));
  console.log('Скриншоты:', path.join(distDir, 'media'));
}

if (require.main === module) main();

module.exports = { buildSingleFile, shoot };
