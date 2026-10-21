/* Обложка кворка: node tools/gig-cover.js
   Собирает картинку 1200×900 для раздела «Обложка кворка»: заголовок, чипы возможностей
   и три скриншота обезличенной сборки. */
const fs = require('fs');
const path = require('path');
const { launch } = require('./chrome');

const ROOT = path.resolve(__dirname, '..');
const MEDIA = path.join(ROOT, 'dist-anon', 'media');
const OUT = path.join(ROOT, 'dist', 'media');

const b64 = (f) => 'data:image/png;base64,' + fs.readFileSync(path.join(MEDIA, f)).toString('base64');

const chips = [
  'Каталог с фильтрами',
  'Поиск по артикулу',
  'Варианты с разной ценой',
  'Сравнение товаров',
  'Скидка на первый заказ',
  'Физлицо и юрлицо',
  'Оплата и CRM',
  'Адаптив 375–2560 px'
];

(async () => {
  if (!fs.existsSync(MEDIA)) {
    console.error('Нет dist-anon/media — сначала npm run anonymize');
    process.exit(1);
  }
  fs.mkdirSync(OUT, { recursive: true });

  const html = `<!doctype html><html><head><meta charset="utf-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; }
    body { width: 1200px; height: 900px; font-family: Inter, Arial, sans-serif; background: #0b0e12; color: #fff; overflow: hidden; }
    .bg { position: absolute; inset: 0;
      background:
        radial-gradient(700px 420px at 10% 0%, rgba(201,67,31,.34), transparent 62%),
        radial-gradient(600px 400px at 95% 100%, rgba(60,110,190,.20), transparent 60%),
        #0b0e12; }
    .grid { position: absolute; inset: 0; opacity: .08;
      background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px);
      background-size: 60px 60px; }
    .wrap { position: relative; padding: 72px 0 0 68px; height: 100%; }
    .left { width: 545px; }
    h1 { font-size: 58px; line-height: 1.05; letter-spacing: -.03em; font-weight: 800; }
    h1 em { font-style: normal; color: #ff8a66; }
    .sub { margin-top: 20px; font-size: 22px; color: #aab3c0; line-height: 1.45; }
    .chips { display: flex; flex-wrap: wrap; gap: 9px; margin-top: 26px; }
    .chip { border: 1px solid rgba(255,255,255,.18); background: rgba(255,255,255,.06); border-radius: 999px;
      padding: 8px 16px; font-size: 16px; color: #dbe2ea; }
    .caption { position: absolute; left: 68px; bottom: 60px; font-size: 17px; color: #7d8794; line-height: 1.5; max-width: 520px; }
    .caption b { color: #cdd5df; font-weight: 600; }
    .shots { position: absolute; inset: 0; pointer-events: none; }
    .shot { position: absolute; border-radius: 14px; overflow: hidden; border: 1px solid rgba(255,255,255,.14);
      box-shadow: 0 30px 70px rgba(0,0,0,.55); }
    .shot img { display: block; width: 100%; }
    .s1 { width: 560px; right: -30px; top: 34px; transform: rotate(-2.5deg); }
    .s2 { width: 470px; right: 16px; top: 322px; transform: rotate(1.8deg); }
    .s3 { width: 430px; right: 128px; top: 566px; transform: rotate(-1.2deg); }
    .badge { position: absolute; left: 68px; top: 0; background: #c9431f; color: #fff; border-radius: 999px;
      padding: 9px 20px; font-size: 17px; font-weight: 700; }
  </style></head><body>
    <div class="bg"></div><div class="grid"></div>
    <div class="wrap">
      <div class="left">
        <div class="badge">WordPress · WooCommerce</div>
        <h1 style="margin-top:26px">Интернет-магазин<br>с нуля: <em>от макета<br>до запуска</em></h1>
        <p class="sub">Каталог с фильтрами, карточка с вариантами, сравнение, корзина со скидкой на первый
        заказ, два сценария оформления, оплата и CRM.</p>
        <div class="chips">${chips.map((c) => `<span class="chip">${c}</span>`).join('')}</div>
      </div>
      <p class="caption"><b>Прототип: 14 страниц, адаптив 375–2560 px.</b><br>
      Проверено автотестами в браузере и аудитом доступности: 0 нарушений.</p>
    </div>
    <div class="shots">
      <div class="shot s1"><img src="${b64('cover.png')}" alt=""></div>
      <div class="shot s2"><img src="${b64('catalog.png')}" alt=""></div>
      <div class="shot s3"><img src="${b64('compare.png')}" alt=""></div>
    </div>
  </body></html>`;

  const browser = await launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 900, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 800));
  const file = path.join(OUT, 'gig-cover.png');
  await page.screenshot({ path: file });
  console.log(file, Math.round(fs.statSync(file).size / 1024) + ' КБ');
  await browser.close();
})();
