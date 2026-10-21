/* Проверка всех собранных страниц: node tools/check-pages.js
   Для каждой страницы: ошибки JS, горизонтальное переполнение на 375 и 1440,
   битые внутренние ссылки, наличие ключевых элементов. */

const fs = require('fs');
const path = require('path');
const { launch } = require('./chrome');

const ROOT = path.resolve(__dirname, '..');
const DIST = process.env.DIST_DIR ? path.resolve(process.env.DIST_DIR) : path.join(ROOT, 'dist');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const url = (file) => 'file:///' + path.join(DIST, file).replace(/\\/g, '/');

const EXPECT = {
  'index.html': ['.hero', '#featuredGrid', '.site-footer'],
  'catalog.html': ['#productGrid', '#catFilters', '#searchInput', '#sortSelect'],
  'product.html': ['#productPage .product-layout', '#productAdd', '.product-specs'],
  'compare.html': ['#comparePage'],
  'guide.html': ['#guideList', '#guideTopics'],
  'article.html': ['#articlePage h1'],
  'cart.html': ['#cartPage', '#orderForm', '#cartSummary'],
  'delivery.html': ['#warranty', '.ship-grid'],
  'about.html': ['#contactForm', '.about-grid'],
  'partners.html': ['#partnerForm'],
  'privacy.html': ['.prose'],
  'offer.html': ['.prose'],
  'refund.html': ['.prose'],
  '404.html': ['.error-code', '#featuredGrid']
};

(async () => {
  if (!fs.existsSync(DIST)) {
    console.error('Нет папки dist — выполните: npm run build');
    process.exit(2);
  }
  const files = fs.readdirSync(DIST).filter((f) => f.endsWith('.html'));
  const browser = await launch();
  const failures = [];

  for (const file of files) {
    const errors = [];
    const page = await browser.newPage();
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

    const overflow = [];
    for (const width of [375, 1440]) {
      await page.setViewport({ width, height: 900 });
      await page.goto(url(file), { waitUntil: 'networkidle2' });
      await wait(250);
      const m = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const bad = [];
        document.querySelectorAll('body *').forEach((el) => {
          const st = getComputedStyle(el);
          if (st.position === 'fixed' || st.display === 'none' || st.visibility === 'hidden') return;
          const r = el.getBoundingClientRect();
          if (r.width > vw + 1 || r.right > vw + 1) {
            const cls = typeof el.className === 'string' ? el.className : '';
            bad.push(`${el.tagName}.${cls.split(' ').filter(Boolean).join('.')}`);
          }
        });
        return { vw, sw: document.documentElement.scrollWidth, bad: bad.slice(0, 5) };
      });
      if (m.sw > m.vw + 1) overflow.push(`${width}px: sw=${m.sw} vw=${m.vw} ${m.bad.join(', ')}`);
    }

    // внутренние ссылки
    await page.goto(url(file), { waitUntil: 'networkidle2' });
    const links = await page.$$eval('a[href]', (els) => els.map((e) => e.getAttribute('href')));
    const broken = [];
    links.forEach((href) => {
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('http') ||
        href.startsWith('mailto') ||
        href.startsWith('tel')
      )
        return;
      const [target] = href.split('#');
      const [base] = target.split('?');
      if (!base) return;
      if (!fs.existsSync(path.join(DIST, base))) broken.push(href);
    });

    // ключевые элементы
    const missing = [];
    for (const sel of EXPECT[file] || []) {
      const found = await page.$(sel);
      if (!found) missing.push(sel);
    }

    const problems = [];
    if (errors.length) problems.push(`ошибки JS: ${errors.slice(0, 3).join(' | ')}`);
    if (overflow.length) problems.push(`переполнение: ${overflow.join(' | ')}`);
    if (broken.length) problems.push(`битые ссылки: ${[...new Set(broken)].join(', ')}`);
    if (missing.length) problems.push(`нет элементов: ${missing.join(', ')}`);

    console.log(`${problems.length ? 'FAIL' : 'OK  '} ${file}${problems.length ? ' → ' + problems.join('; ') : ''}`);
    if (problems.length) failures.push(file);
    await page.close();
  }

  await browser.close();
  console.log(
    failures.length ? `\nПРОВАЛЕНО: ${failures.length} (${failures.join(', ')})` : '\nВсе страницы в порядке.'
  );
  process.exit(failures.length ? 1 : 0);
})().catch((e) => {
  console.error('Ошибка проверки страниц:', e);
  process.exit(2);
});
