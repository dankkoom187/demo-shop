/* Обезличенная сборка для портфолио: node tools/anonymize.js
   Убирает бренд, реальные контакты и узнаваемые названия товаров.
   Источник: dist/ → результат: dist-anon/ (+ однофайловая версия и скриншоты). */

const fs = require('fs');
const path = require('path');
const { buildSingleFile, shoot } = require('./publish');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'dist');
const OUT = path.join(ROOT, 'dist-anon');
const ONEFILE = path.join(ROOT, 'dist-anon-onefile');

// точные замены: бренд, контакты, названия товаров, коды, цвета
const DICT = [
  // бренд
  ['ПЛЁНКА ПРО', 'Магазин плёнок'],
  ['ПЛЁНКА<em>ПРО</em>', 'Плёнки'],
  ['«Магазин плёнок» — поставщик', 'Мы — поставщик'],
  ['ПЛЁНКА', 'Плёнки'],
  // контакты
  ['8 800 555-35-35', '+7 900 000-00-00'],
  ['sales@example.ru', 'mail@example.ru'],
  // названия товаров
  ['X Gloss 1,80', 'Плёнка глянцевая 1,80'],
  ['X Gloss 1,58', 'Плёнка глянцевая 1,58'],
  ['Transparent 200', 'Плёнка прозрачная 200'],
  ['PPF Transparent 150', 'Плёнка прозрачная 150'],
  ['PPF Transparent 200', 'Плёнка прозрачная 200'],
  ['Matte Guard 180', 'Плёнка матовая 180'],
  ['X Gloss 1,58', 'Плёнка глянцевая 1,58'],
  ['Chameleon Shift', 'Плёнка переливная 220'],
  ['Satin White', 'Плёнка сатиновая 160'],
  ['Optical Clear 100', 'Плёнка для оптики 100'],
  ['Optical Smoke 150', 'Плёнка для оптики дымчатая 150'],
  ['Windshield Pro 200', 'Плёнка для стекла 200'],
  ['Ceramic Shield 9H', 'Керамика 9H'],
  ['Ceramic Pro 10H', 'Керамика 10H'],
  // артикулы
  ['TR-150', 'PF-150'],
  ['TR-200', 'PF-200'],
  ['MT-180', 'PF-180'],
  ['CG-158', 'GL-158'],
  ['CH-220', 'PR-220'],
  ['SW-160', 'ST-160'],
  ['WS-200', 'GC-200'],
  // цвета
  ['Obsidian Black', 'Графит'],
  ['Sakura Pink', 'Пудровый'],
  ['Satin White', 'Белый'],
  ['цветная · сакура', 'цветная · пудровый'],
  ['цветная · обсидиан', 'цветная · графит'],
  // числа из ТЗ заказчика
  [
    '104 товарные позиции: 20 защитных плёнок, 79 цветных плёнок и 5 керамических покрытий.',
    '100+ товарных позиций: прозрачные, матовые и цветные плёнки, плёнки для оптики и стекла, керамические покрытия.'
  ],
  ['104 позиции в наличии', '100+ позиций в наличии'],
  ['104 товаров в наличии', '100+ товаров в наличии'],
  ['Весь каталог — 104 товара', 'Весь каталог — 100+ товаров'],
  ['104</b> позиций в наличии', '100+</b> позиций в наличии'],
  // подписи
  [
    '© 2026 Магазин плёнок. Демо-прототип, не публичный сайт.',
    '© 2026. Демонстрационный проект: товары, цены и контакты вымышлены.'
  ],
  [
    'Защитные плёнки и керамические покрытия. Санкт-Петербург, отгрузка по России.',
    'Защитные плёнки и керамические покрытия. Отгрузка по России.'
  ]
];

// регулярки: логотип, title, meta, ссылки на бренд
const RE = [
  [
    /<span class="logo-mark"[^>]*>П<\/span>/g,
    '<span class="logo-mark" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="8" width="24" height="16" rx="3"/><circle cx="11" cy="16" r="3.2"/><circle cx="21" cy="16" r="3.2"/></svg></span>'
  ],
  [/<title>[^<]*<\/title>/g, '<title>Интернет-магазин защитных плёнок и керамических покрытий</title>'],
  [
    /(<meta\s+name="description"\s+content=")[^"]*(")/g,
    '$1Интернет-магазин защитных плёнок и керамических покрытий: каталог с фильтрами, карточки товаров, сравнение, корзина и оформление заказа. Демонстрационный проект.$2'
  ],
  [/(document\.title = `\$\{[^}]+\} — )[^`]*(`)/g, '$1интернет-магазин$2'],
  [/<span class="logo-text">Плёнки<em>ПРО<\/em><\/span>/g, '<span class="logo-text">Плёнки</span>']
];

function anonText(text) {
  let out = text;
  DICT.forEach(([from, to]) => {
    out = out.split(from).join(to);
  });
  RE.forEach(([re, to]) => {
    out = out.replace(re, to);
  });
  return out;
}

function main() {
  if (!fs.existsSync(SRC)) {
    console.error('Нет dist — сначала npm run build');
    process.exit(1);
  }
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const files = fs.readdirSync(SRC, { recursive: true });
  let touched = 0;
  files.forEach((rel) => {
    const from = path.join(SRC, rel);
    if (fs.statSync(from).isDirectory()) return;
    const to = path.join(OUT, rel);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    if (/\.(html|js|css|json|md)$/i.test(rel)) {
      fs.writeFileSync(to, anonText(fs.readFileSync(from, 'utf8')));
      touched += 1;
    } else {
      fs.copyFileSync(from, to);
    }
  });

  // проверяем, что бренд не остался
  const leftover = [];
  const scan = (dir) => {
    fs.readdirSync(dir, { recursive: true }).forEach((rel) => {
      const f = path.join(dir, rel);
      if (fs.statSync(f).isDirectory()) return scan(f);
      if (!/\.(html|js|css|md)$/i.test(f)) return;
      const text = fs.readFileSync(f, 'utf8');
      [
        'ПЛЁНКА',
        '8 800 555',
        'sales@example',
        'PPF Transparent',
        'Matte Guard',
        'X Gloss',
        'Chameleon',
        'Obsidian',
        'Satin White',
        'Optical ',
        'Windshield',
        'Ceramic '
      ].forEach((needle) => {
        if (text.includes(needle)) leftover.push(`${path.basename(f)} → ${needle}`);
      });
    });
  };
  scan(OUT);

  console.log(`Обезличено файлов: ${touched}`);
  console.log(
    leftover.length ? 'ОСТАЛИСЬ БРЕНДОВЫЕ СТРОКИ:\n  ' + leftover.join('\n  ') : 'Брендовых строк не осталось'
  );
  return leftover.length === 0;
}

(async () => {
  const clean = main();
  if (!clean) process.exit(1);

  // однофайловая версия и скриншоты обезличенной версии
  fs.mkdirSync(ONEFILE, { recursive: true });
  const size = buildSingleFile(OUT, path.join(ONEFILE, 'index.html'));
  console.log(`dist-anon-onefile/index.html — ${Math.round(size / 1024)} КБ`);
  await shoot(OUT, path.join(OUT, 'media'));
  console.log('Скриншоты:', path.join(OUT, 'media'));
})();
