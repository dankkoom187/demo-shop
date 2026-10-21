/* Функциональный смоук многостраничного сайта: node tools/smoke.js
   Сценарии: каталог, карточка товара с вариантами, корзина и скидка, оформление,
   сравнение, гид и статья, формы. */

const fs = require('fs');
const path = require('path');
const { launch } = require('./chrome');

const ROOT = path.resolve(__dirname, '..');
const DIST = process.env.DIST_DIR ? path.resolve(process.env.DIST_DIR) : path.join(ROOT, 'dist');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const url = (file) => 'file:///' + path.join(DIST, file).replace(/\\/g, '/');
// Intl.NumberFormat('ru-RU') разделяет разряды неразрывным пробелом (U+00A0) — приводим к обычному
const norm = (s) => String(s).replace(/ /g, ' ');

(async () => {
  if (!fs.existsSync(DIST)) {
    console.error('Нет папки dist — выполните: npm run build');
    process.exit(2);
  }
  const browser = await launch();
  const failures = [];
  const results = [];

  const check = (label, actual, expected) => {
    const ok = actual === expected;
    results.push(`${ok ? 'OK  ' : 'FAIL'} ${label}: ${actual}${ok ? '' : ` (ожидалось ${expected})`}`);
    if (!ok) failures.push(label);
  };

  const page = await browser.newPage();
  const jsErrors = [];
  page.on('pageerror', (e) => jsErrors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && jsErrors.push(m.text()));
  await page.setViewport({ width: 1440, height: 900 });

  // чистим состояние localStorage, чтобы сценарий был детерминированным
  await page.goto(url('index.html'), { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());

  // --- каталог ---
  await page.goto(url('catalog.html'), { waitUntil: 'networkidle2' });
  await wait(300);
  check('каталог: товаров в сетке', await page.$$eval('.card', (e) => e.length), 11);

  await page.click('[data-thickness="200"]');
  await wait(200);
  check('каталог: фильтр по толщине', await page.$eval('#resultCount', (e) => e.textContent), '3 товара');
  await page.click('#resetFilters');
  await wait(200);

  await page.type('#searchInput', 'CR-10H');
  await wait(250);
  check('каталог: поиск по коду', await page.$eval('#resultCount', (e) => e.textContent), '1 товар');
  await page.click('#resetFilters');
  await wait(200);

  await page.select('#sortSelect', 'price-asc');
  await wait(250);
  check(
    'каталог: сортировка по цене',
    norm(await page.$eval('.card .price', (e) => e.textContent)).startsWith('4 900'),
    true
  );

  // переход из категории на главной
  await page.goto(url('index.html'), { waitUntil: 'networkidle2' });
  await wait(300);
  await page.evaluate(() => document.querySelector('a.cat-card[href*="cat=colored"]').click());
  await wait(600);
  check('главная: переход в каталог с категорией', await page.$eval('#resultCount', (e) => e.textContent), '3 товара');

  // --- карточка товара ---
  await page.goto(url('product.html?id=cg158'), { waitUntil: 'networkidle2' });
  await wait(300);
  check(
    'карточка: заголовок товара',
    await page.$eval('#productPage h1', (e) => e.textContent),
    await page.evaluate(() => window.PP.productById('cg158').name)
  );
  await page.select('#productVariant', '1,80 м');
  await wait(200);
  check(
    'карточка: цена варианта 1,80 м',
    norm(await page.$eval('#productPrice', (e) => e.textContent)).startsWith('31 900'),
    true
  );
  await page.click('#productPlus');
  await page.click('#productAdd');
  await wait(300);
  check('карточка: позиция в корзине', await page.$eval('#cartCount', (e) => e.textContent), '2');
  check('карточка: похожие товары', await page.$$eval('#relatedGrid .card', (e) => e.length > 0), true);

  // --- корзина и оформление ---
  await page.goto(url('cart.html'), { waitUntil: 'networkidle2' });
  await wait(300);
  check('корзина: позиция с вариантом', await page.$eval('#cartPage', (e) => e.textContent.includes('1,80 м')), true);
  check('корзина: скидка 10% в итоге', norm(await page.$eval('#sumTotal', (e) => e.textContent)), '57 420 ₽');

  await page.click('#orderBuyer .seg[data-buyer="company"]');
  await wait(200);
  check('оформление: для юрлица показываем ИНН', await page.$eval('#orderCompanyFields', (e) => e.hidden), false);
  check(
    'оформление: для юрлица выбран счёт',
    await page.$eval('input[name="pay"][value="invoice"]', (e) => e.checked),
    true
  );

  await page.select('#oDelivery', 'pickup');
  await wait(150);
  check('оформление: для самовывоза скрыт адрес', await page.$eval('#orderAddressField', (e) => e.hidden), true);

  await page.click('#orderForm button[type="submit"]');
  await wait(250);
  check(
    'оформление: форма осталась открытой при ошибке',
    await page.$eval('#orderForm', (e) => e.querySelector('.invalid') !== null),
    true
  );

  // --- сравнение ---
  await page.goto(url('catalog.html'), { waitUntil: 'networkidle2' });
  await wait(300);
  await page.evaluate(() => document.querySelector('[data-compare="tr150"]').click());
  await wait(150);
  await page.evaluate(() => document.querySelector('[data-compare="cr9h"]').click());
  await wait(200);
  check('сравнение: не смешиваем группы', await page.$eval('#compareCount', (e) => e.textContent), '1');

  await page.goto(url('compare.html'), { waitUntil: 'networkidle2' });
  await wait(300);
  check('сравнение: таблица на странице', await page.$$eval('.compare-table tbody tr', (e) => e.length), 8);
  await page.evaluate(() => document.querySelector('[data-uncompare]').click());
  await wait(300);
  check(
    'сравнение: позиция удаляется',
    await page.$eval('#comparePage', (e) => e.textContent.includes('В сравнении пока пусто')),
    true
  );

  // --- гид и статья ---
  await page.goto(url('guide.html'), { waitUntil: 'networkidle2' });
  await wait(300);
  check('гид: статей в списке', await page.$$eval('#guideList .article-card', (e) => e.length), 5);
  await page.evaluate(() => document.querySelector('[data-topic="optics"]').click());
  await wait(250);
  check('гид: фильтр по теме', await page.$$eval('#guideList .article-card', (e) => e.length), 1);

  await page.goto(url('article.html?slug=film-for-optics'), { waitUntil: 'networkidle2' });
  await wait(300);
  check(
    'статья: заголовок',
    await page.$eval('#articlePage h1', (e) => e.textContent.includes('Плёнка на фары')),
    true
  );

  // --- формы ---
  await page.goto(url('partners.html'), { waitUntil: 'networkidle2' });
  await wait(300);
  await page.click('#partnerForm button[type="submit"]');
  await wait(200);
  check(
    'форма партнёров: валидация',
    await page.$eval('#partnerForm', (e) => e.querySelector('.invalid') !== null),
    true
  );
  await page.type('#pCompany', 'ООО «Пример»');
  await page.type('#pInn', '7801234567');
  await page.type('#pName', 'Иван');
  await page.type('#pPhone', '+7 900 000-00-00');
  await page.click('#pConsent');
  await page.click('#partnerForm button[type="submit"]');
  await wait(300);
  check('форма партнёров: отправка', await page.$eval('#toastWrap', (e) => e.textContent.includes('Заявка')), true);

  check('ошибок JS нет', jsErrors.length, 0);
  await page.close();
  await browser.close();

  console.log(results.join('\n'));
  console.log(
    failures.length ? `\nПРОВАЛЕНО: ${failures.length} (${failures.join(', ')})` : '\nВсе проверки пройдены.'
  );
  process.exit(failures.length ? 1 : 0);
})().catch((e) => {
  console.error('Ошибка смоук-теста:', e);
  process.exit(2);
});
