/* Сборка сайта: node tools/build-pages.js
   partials + pages → dist/*.html, плюс SEO-обвязка: per-page meta, canonical, Open Graph,
   JSON-LD, sitemap.xml, robots.txt. */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const SITE_URL = (process.env.SITE_URL || 'https://dankkoom187.github.io/demo-shop').replace(/\/+$/, '');

const read = (p) => fs.readFileSync(p, 'utf8');
const partial = (name) => read(path.join(SRC, 'partials', name));

// Meta для каждой страницы: title до 60 символов, description до 160.
const SEO = {
  'home.html': {
    title: 'Интернет-магазин защитных плёнок и керамики — купить рулоном',
    desc: 'Защитные плёнки для кузова, оптики и стекла, керамические покрытия. Целые рулоны от 1 шт, гарантия до 10 лет, доставка по России.',
    type: 'website'
  },
  'catalog.html': {
    title: 'Каталог защитных плёнок и керамики — цены за рулон',
    desc: 'Прозрачные, матовые и цветные плёнки, для оптики и стекла, керамика. Фильтры по типу и толщине, поиск по артикулу, сортировка по цене.',
    type: 'website'
  },
  'product.html': {
    title: 'Плёнка: характеристики, варианты ширины, цена за рулон',
    desc: 'Карточка товара: характеристики, вариант ширины рулона с разной ценой, количество, доставка и гарантия.',
    type: 'product'
  },
  'compare.html': {
    title: 'Сравнение плёнок по 8 параметрам — толщина, основа, цена',
    desc: 'Сравните до четырёх плёнок: поверхность, толщина, Top Coat, основа, клей, размер рулона, срок службы и цена. Кузов, оптика, стекло, керамика.',
    type: 'website'
  },
  'guide.html': {
    title: 'Гид по выбору плёнки: статьи и разборы',
    desc: 'Как выбрать плёнку для кузова, оптики и стекла, чем отличается керамика 9H и 10H и как ухаживать за покрытием.',
    type: 'website'
  },
  'article.html': {
    title: 'Статья — гид по выбору плёнки',
    desc: 'Разборы и инструкции по выбору защитных плёнок и керамических покрытий.',
    type: 'article'
  },
  'cart.html': {
    title: 'Корзина и оформление заказа',
    desc: 'Оформление заказа: физлицо или юрлицо/ИП, доставка ТК, курьером или самовывозом, скидка 10% на первый заказ.',
    type: 'website'
  },
  'delivery.html': {
    title: 'Оплата, доставка, гарантия и возврат',
    desc: 'Оплата картой или по счёту, доставка транспортной компанией и курьером, самовывоз. Гарантия до 10 лет, возврат в течение 14 дней.',
    type: 'website'
  },
  'about.html': {
    title: 'О компании — поставщик защитных плёнок',
    desc: 'Поставщик защитных плёнок и керамических покрытий: подбор, расчёт количества рулонов, документы для юрлиц и ИП.',
    type: 'website'
  },
  'partners.html': {
    title: 'Сотрудничество: автосервисы, дилеры и оптовики',
    desc: 'Партнёрские условия для автосервисов, дилеров и оптовиков: цены, отсрочка, закрывающие документы, логистика в регионы.',
    type: 'website'
  },
  'privacy.html': {
    title: 'Политика конфиденциальности',
    desc: 'Какие персональные данные собирает сайт, зачем они нужны, как хранятся и как отозвать согласие на обработку.',
    type: 'website'
  },
  'offer.html': {
    title: 'Публичная оферта',
    desc: 'Условия продажи защитных плёнок и керамических покрытий: цены, оформление заказа, доставка, гарантия и споры.',
    type: 'website'
  },
  'refund.html': {
    title: 'Возврат и гарантия',
    desc: 'Условия возврата в течение 14 дней, гарантийные сроки на плёнки и керамику, правила эксплуатации и ухода.',
    type: 'website'
  },
  '404.html': {
    title: 'Страница не найдена — 404',
    desc: 'Такой страницы нет. Перейдите в каталог или на главную.',
    type: 'website',
    noindex: true
  }
};

const ORG_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Интернет-магазин защитных плёнок',
  url: SITE_URL + '/',
  logo: SITE_URL + '/media/cover.png',
  contactPoint: { '@type': 'ContactPoint', telephone: '+7-900-000-00-00', contactType: 'sales' }
};

const WEBSITE_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Интернет-магазин защитных плёнок',
  url: SITE_URL + '/'
};

function metaBlock(file, seo) {
  const canonical = SITE_URL + '/' + (file === 'home.html' ? '' : file);
  const image = SITE_URL + '/media/cover.png';
  const robots = seo.noindex ? '\n    <meta name="robots" content="noindex, follow" />' : '';
  const jsonld =
    file === 'home.html'
      ? `\n    <script type="application/ld+json">${JSON.stringify(ORG_JSONLD)}</script>\n    <script type="application/ld+json">${JSON.stringify(WEBSITE_JSONLD)}</script>`
      : '';

  return `    <title>${seo.title}</title>
    <meta name="description" content="${seo.desc}" />${robots}
    <link rel="canonical" href="${canonical}" />
    <meta property="og:type" content="${seo.type}" />
    <meta property="og:title" content="${seo.title}" />
    <meta property="og:description" content="${seo.desc}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:site_name" content="Интернет-магазин защитных плёнок" />
    <meta name="twitter:card" content="summary_large_image" />${jsonld}`;
}

function page(file) {
  const seo = SEO[file] || { title: 'Интернет-магазин защитных плёнок', desc: '', type: 'website' };
  const head = partial('head.html')
    .replace(/<title>[^<]*<\/title>/, () => metaBlock(file, seo))
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/>/, () => '');

  return `<!doctype html>
${head}
  <body data-page="${path.basename(file, '.html')}">
${partial('header.html')}

    <main>
${read(path.join(SRC, 'pages', file))}
    </main>

${partial('footer.html')}

${partial('overlays.html')}

    <script src="data.js"></script>
    <script src="app.js"></script>
    <script src="pages.js"></script>
  </body>
</html>
`;
}

function writeSitemap(files) {
  // 404 и корзину не отдаём в индекс — они не должны попадать в поиск
  const indexed = files.filter((f) => f !== '404.html' && f !== 'cart.html');
  const pages = indexed.map((f) => `  <url><loc>${SITE_URL}/${f === 'home.html' ? '' : f}</loc></url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages}
</urlset>
`;
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), xml);
  fs.writeFileSync(
    path.join(DIST, 'robots.txt'),
    `User-agent: *
Allow: /
Disallow: /404.html
Disallow: /cart.html

Sitemap: ${SITE_URL}/sitemap.xml
`
  );
  return indexed.length;
}

function main() {
  fs.mkdirSync(DIST, { recursive: true });
  fs.readdirSync(DIST)
    .filter((f) => f.endsWith('.html'))
    .forEach((f) => fs.unlinkSync(path.join(DIST, f)));

  const pages = fs.readdirSync(path.join(SRC, 'pages')).filter((f) => f.endsWith('.html'));
  pages.forEach((file) => {
    fs.writeFileSync(path.join(DIST, file === 'home.html' ? 'index.html' : file), page(file));
  });

  ['styles.css', 'app.js'].forEach((f) => fs.copyFileSync(path.join(ROOT, f), path.join(DIST, f)));
  ['data.js', 'pages.js'].forEach((f) => fs.copyFileSync(path.join(SRC, f), path.join(DIST, f)));

  const inSitemap = writeSitemap(pages);
  console.log('Собрано страниц:', pages.length, '| в sitemap:', inSitemap, '| SITE_URL:', SITE_URL);
  console.log(pages.map((p) => '  ' + (p === 'home.html' ? 'index.html' : p)).join('\n'));
}

main();
