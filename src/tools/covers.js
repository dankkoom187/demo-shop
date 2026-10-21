/* Обложки кворков: node tools/covers.js
   Собирает 1200×900 под каждый кворк из обезличенных скриншотов: магазин, лендинг, доработка. */
const fs = require('fs');
const path = require('path');
const { launch } = require('./chrome');

const ROOT = path.resolve(__dirname, '..');
const MEDIA = path.join(ROOT, 'dist-anon', 'media');
const OUT = path.join(ROOT, 'dist', 'media');
const b64 = (f) => 'data:image/png;base64,' + fs.readFileSync(path.join(MEDIA, f)).toString('base64');

const COVERS = [
  {
    name: 'gig-cover-store',
    badge: 'WordPress · WooCommerce',
    h1: 'Интернет-магазин<br>с нуля: <em>от макета<br>до запуска</em>',
    sub: 'Каталог с фильтрами, карточка с вариантами, сравнение, корзина со скидкой на первый заказ, два сценария оформления, оплата и CRM.',
    chips: [
      'Каталог с фильтрами',
      'Поиск по артикулу',
      'Варианты с разной ценой',
      'Сравнение товаров',
      'Скидка на первый заказ',
      'Физлицо и юрлицо',
      'Оплата и CRM',
      'Адаптив 375–2560 px'
    ],
    caption:
      '<b>Прототип: 14 страниц, адаптив 375–2560 px.</b><br>Проверено автотестами в браузере и аудитом доступности: 0 нарушений.',
    shots: [
      { file: 'cover.png', cls: 's1' },
      { file: 'catalog.png', cls: 's2' },
      { file: 'compare.png', cls: 's3' }
    ]
  },
  {
    name: 'gig-cover-landing',
    badge: 'Лендинг под ключ',
    h1: 'Лендинг, который<br><em>продаёт</em> и не тормозит',
    sub: 'Промо, корпоративный или для SaaS: сборка по макету, адаптив под телефон, формы с заявками, SEO и аналитика.',
    chips: [
      'Сборка по макету',
      'Адаптив под 3+ ширины',
      'Формы и заявки в CRM',
      'Быстрая загрузка',
      'SEO-мета и sitemap',
      'Яндекс Метрика',
      'Промо и SaaS',
      'Домен и HTTPS'
    ],
    caption:
      '<b>Пример: главная страница прототипа магазина.</b><br>Проверено автотестами: нет горизонтального переполнения, ноль ошибок в консоли.',
    shots: [
      { file: 'cover.png', cls: 's1' },
      { file: 'article.png', cls: 's2' },
      { file: 'mobile.png', cls: 's3' }
    ]
  },
  {
    name: 'gig-cover-fixes',
    badge: 'WordPress · доработка',
    h1: 'Доработка сайта:<br><em>правки, вёрстка, новые блоки</em>',
    sub: 'Работаю с существующими сайтами: вёрстка по макету, баги, новые блоки и разделы, формы, скорость, SEO-мета.',
    chips: [
      'Вёрстка по макету',
      'Исправление багов',
      'Новые блоки и разделы',
      'Формы и валидация',
      'Скорость и кэш',
      'Обновление плагинов',
      'Резервные копии',
      'Правки по мелочам'
    ],
    caption:
      '<b>Формат: до 3 часов работы, сроки и объём фиксируем до начала.</b><br>Правки по ходу — в рамках согласованного объёма.',
    shots: [
      { file: 'catalog.png', cls: 's1' },
      { file: 'product.png', cls: 's2' }
    ]
  }
];

const html = (c) => `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 900px; font-family: Inter, Arial, sans-serif; background: #0b0e12; color: #fff; overflow: hidden; }
  .bg { position: absolute; inset: 0;
    background: radial-gradient(700px 420px at 10% 0%, rgba(201,67,31,.34), transparent 62%),
                radial-gradient(600px 400px at 95% 100%, rgba(60,110,190,.20), transparent 60%), #0b0e12; }
  .grid { position: absolute; inset: 0; opacity: .08;
    background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px);
    background-size: 60px 60px; }
  .wrap { position: relative; padding: 72px 0 0 68px; height: 100%; }
  .left { width: 545px; }
  h1 { font-size: 56px; line-height: 1.06; letter-spacing: -.03em; font-weight: 800; }
  h1 em { font-style: normal; color: #ff8a66; }
  .sub { margin-top: 20px; font-size: 21px; color: #aab3c0; line-height: 1.45; }
  .chips { display: flex; flex-wrap: wrap; gap: 9px; margin-top: 26px; }
  .chip { border: 1px solid rgba(255,255,255,.18); background: rgba(255,255,255,.06); border-radius: 999px;
    padding: 8px 15px; font-size: 15.5px; color: #dbe2ea; }
  .caption { position: absolute; left: 68px; bottom: 58px; font-size: 17px; color: #7d8794; line-height: 1.5; max-width: 520px; }
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
    <div class="badge">${c.badge}</div>
    <h1 style="margin-top:26px">${c.h1}</h1>
    <p class="sub">${c.sub}</p>
    <div class="chips">${c.chips.map((x) => `<span class="chip">${x}</span>`).join('')}</div>
  </div>
  <p class="caption">${c.caption}</p>
</div>
<div class="shots">
  ${c.shots.map((s) => `<div class="shot ${s.cls}"><img src="${b64(s.file)}" alt=""></div>`).join('')}
</div>
</body></html>`;

(async () => {
  if (!fs.existsSync(MEDIA)) {
    console.error('Нет dist-anon/media — сначала npm run anonymize');
    process.exit(1);
  }
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await launch();
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(20000);
  for (const c of COVERS) {
    await page.setViewport({ width: 1200, height: 900, deviceScaleFactor: 1 });
    // шрифт из сети может не отвечать — ждём dom, а не сеть
    await page.setContent(html(c), { waitUntil: 'domcontentloaded' }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1200));
    const file = path.join(OUT, `${c.name}.png`);
    await page.screenshot({ path: file });
    console.log(`${c.name}.png  ${Math.round(fs.statSync(file).size / 1024)} КБ`);
  }
  await browser.close();
})();
