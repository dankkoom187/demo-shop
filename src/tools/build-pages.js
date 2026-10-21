/* Сборка сайта: node tools/build-pages.js
   partials + pages → dist/*.html (общие CSS и JS подключаются файлами).
   Главная собирается как dist/index.html — это точка входа для GitHub Pages. */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');

const read = (p) => fs.readFileSync(p, 'utf8');
const partial = (name) => read(path.join(SRC, 'partials', name));

function page(file) {
  const head = partial('head.html');
  const header = partial('header.html');
  const footer = partial('footer.html');
  const overlays = partial('overlays.html');
  const body = read(path.join(SRC, 'pages', file));

  return `<!doctype html>
${head}
  <body data-page="${path.basename(file, '.html')}">
${header}

    <main>
${body}
    </main>

${footer}

${overlays}

    <script src="data.js"></script>
    <script src="app.js"></script>
    <script src="pages.js"></script>
  </body>
</html>
`;
}

function main() {
  fs.mkdirSync(DIST, { recursive: true });
  // чистим старые страницы, чтобы не оставались файлы удалённых разделов
  fs.readdirSync(DIST)
    .filter((f) => f.endsWith('.html'))
    .forEach((f) => fs.unlinkSync(path.join(DIST, f)));

  const pages = fs.readdirSync(path.join(SRC, 'pages')).filter((f) => f.endsWith('.html'));

  pages.forEach((file) => {
    const name = file === 'home.html' ? 'index.html' : file;
    fs.writeFileSync(path.join(DIST, name), page(file));
  });

  // общие ассеты
  ['styles.css', 'app.js'].forEach((f) => fs.copyFileSync(path.join(ROOT, f), path.join(DIST, f)));
  ['data.js', 'pages.js'].forEach((f) => fs.copyFileSync(path.join(SRC, f), path.join(DIST, f)));

  console.log('Собрано страниц:', pages.length, '→', DIST);
  console.log(pages.map((p) => '  ' + (p === 'home.html' ? 'index.html' : p)).join('\n'));
}

main();
