/* Подготовка репозитория для GitHub Pages: npm run pages
   Кладёт собранный сайт в корень репо (Pages отдаёт его по /), исходники — в /src. */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DIST = process.env.SRC_DIR ? path.resolve(process.env.SRC_DIR) : path.join(ROOT, 'dist');
const TARGET = process.env.PAGES_DIR || path.resolve(ROOT, '..', 'tilda-films-site');
const README_SRC = process.env.README_SRC || path.join(__dirname, 'pages-readme.md');

function copyFile(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

function copyDir(from, to, filter) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from, { withFileTypes: true }).forEach((entry) => {
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dst, filter);
    else if (!filter || filter(entry.name)) copyFile(src, dst);
  });
}

function main() {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    console.error('Нет dist/index.html — сначала выполните: npm run build');
    process.exit(1);
  }

  // чистим старое содержимое сайта (кроме .git)
  if (fs.existsSync(TARGET)) {
    fs.readdirSync(TARGET)
      .filter((f) => f !== '.git')
      .forEach((f) => fs.rmSync(path.join(TARGET, f), { recursive: true, force: true }));
  }
  fs.mkdirSync(TARGET, { recursive: true });

  // сайт в корне — GitHub Pages отдаст его по https://<user>.github.io/<repo>/
  fs.readdirSync(DIST).forEach((f) => {
    const src = path.join(DIST, f);
    if (fs.statSync(src).isDirectory()) copyDir(src, path.join(TARGET, f));
    else copyFile(src, path.join(TARGET, f));
  });

  // исходники — в /src, чтобы было видно, как это сделано
  ['app.js', 'styles.css', 'package.json', 'README.md', '.prettierrc.json', 'eslint.config.mjs'].forEach((f) =>
    copyFile(path.join(ROOT, f), path.join(TARGET, 'src', f))
  );
  copyDir(path.join(ROOT, 'src', 'pages'), path.join(TARGET, 'src', 'pages'));
  copyDir(path.join(ROOT, 'src', 'partials'), path.join(TARGET, 'src', 'partials'));
  copyFile(path.join(ROOT, 'src', 'data.js'), path.join(TARGET, 'src', 'data.js'));
  copyFile(path.join(ROOT, 'src', 'pages.js'), path.join(TARGET, 'src', 'pages.js'));
  copyDir(path.join(ROOT, 'tools'), path.join(TARGET, 'src', 'tools'));

  // без .nojekyll Pages попытается собрать Jekyll и может потерять файлы
  fs.writeFileSync(path.join(TARGET, '.nojekyll'), '');
  fs.writeFileSync(
    path.join(TARGET, '.gitattributes'),
    '* text=auto eol=lf\n\n*.png binary\n*.jpg binary\n*.jpeg binary\n*.gif binary\n*.ico binary\n*.zip binary\n'
  );

  // README для страницы репозитория
  const readme = fs.readFileSync(README_SRC, 'utf8');
  fs.writeFileSync(path.join(TARGET, 'README.md'), readme);

  // git-репозиторий, если его ещё нет
  if (!fs.existsSync(path.join(TARGET, '.git'))) {
    execFileSync('git', ['init', '-b', 'main'], { cwd: TARGET, stdio: 'ignore' });
  }

  console.log('Репозиторий для Pages готов:', TARGET);
  console.log('Далее:');
  console.log(`  cd "${TARGET}"`);
  console.log('  git add -A && git commit -m "Обновление многостраничного прототипа"');
  console.log('  git push origin main');
  console.log('  (или: node tools/pages-deploy.js <имя-репозитория> — создаст репозиторий и зальёт всё сразу)');
}

main();
