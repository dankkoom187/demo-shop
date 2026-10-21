/* Плоская сборка для загрузки с телефона: node tools/flat.js
   Каждая страница — самодостаточный файл (CSS и JS встроены), все файлы в одной папке.
   Итого 14 HTML + 6 PNG без вложенностей: выделяются в файловом менеджере телефона
   и загружаются в GitHub одним нажатием.
   Папка-источник и результат задаются переменными SRC_DIR / OUT_DIR. */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = process.env.SRC_DIR ? path.resolve(process.env.SRC_DIR) : path.join(ROOT, 'dist');
const OUT = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : path.join(ROOT, 'dist-flat');

const read = (p) => fs.readFileSync(p, 'utf8');

function inline(html) {
  const css = read(path.join(DIST, 'styles.css'));
  const js = ['data.js', 'app.js', 'pages.js'].map((f) => read(path.join(DIST, f))).join('\n');
  const out = html
    .replace(/<link[^>]+href="styles\.css"[^>]*>/, () => `<style>\n${css}\n</style>`)
    .replace(/<script[^>]+src="data\.js"[^>]*><\/script>/, () => '')
    .replace(/<script[^>]+src="app\.js"[^>]*><\/script>/, () => '')
    .replace(/<script[^>]+src="pages\.js"[^>]*><\/script>/, () => `<script>\n${js}\n</script>`);

  if (/href="styles\.css"/.test(out) || /src="(data|app|pages)\.js"/.test(out)) {
    throw new Error('Сборка неполная: остались внешние ссылки на css/js');
  }
  return out;
}

function main() {
  if (!fs.existsSync(DIST)) {
    console.error('Нет папки-источника — сначала npm run build');
    process.exit(1);
  }
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const pages = fs.readdirSync(DIST).filter((f) => f.endsWith('.html'));
  pages.forEach((f) => fs.writeFileSync(path.join(OUT, f), inline(read(path.join(DIST, f)))));

  // картинки — плоско, без папки media
  const media = path.join(DIST, 'media');
  if (fs.existsSync(media)) {
    fs.readdirSync(media).forEach((f) => fs.copyFileSync(path.join(media, f), path.join(OUT, f)));
  }

  const files = fs.readdirSync(OUT);
  const total = files.reduce((s, f) => s + fs.statSync(path.join(OUT, f)).size, 0);
  console.log(`${OUT}: ${files.length} файлов, ${Math.round(total / 1024)} КБ`);
}

main();
