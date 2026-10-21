/* Публикация на GitHub Pages: node tools/pages-deploy.js [имя-репозитория]
   Требует авторизации gh (gh auth login --web) и готовой папки pages-репозитория
   (её собирает tools/pages.js). Шаги: создать/обновить репозиторий → запушить →
   включить Pages → проставить реальную ссылку в README. */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SITE = process.env.PAGES_DIR || path.resolve(ROOT, '..', 'tilda-films-site');
const REPO = process.argv[2] || 'plenka-pro-demo';
const GH = process.env.GH_PATH || 'gh';

const run = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts }).trim();

const gh = (args, opts = {}) => {
  try {
    return run(GH, args, opts);
  } catch (e) {
    const detail = (e.stderr || e.message || '').trim();
    throw new Error(`gh ${args.join(' ')} → ${detail}`);
  }
};

function main() {
  if (!fs.existsSync(path.join(SITE, '.git'))) {
    throw new Error(`Нет git-репозитория в ${SITE} — сначала выполните: npm run pages`);
  }

  const login = gh(['api', 'user', '--jq', '.login']);
  console.log('Аккаунт:', login);

  // 1. репозиторий
  let exists = false;
  try {
    gh(['api', `repos/${login}/${REPO}`, '--jq', '.id']);
    exists = true;
  } catch {
    exists = false; // репозитория ещё нет — создаём
  }
  let created = false;
  if (!exists) {
    gh([
      'repo',
      'create',
      `${login}/${REPO}`,
      '--public',
      '--description',
      'Прототип интернет-магазина защитных плёнок: адаптивная вёрстка, каталог с фильтрами, сравнение, корзина и оформление заказа',
      '--homepage',
      `https://${login}.github.io/${REPO}/`
    ]);
    created = true;
    console.log('Репозиторий создан:', `${login}/${REPO}`);
  } else {
    console.log('Репозиторий уже есть:', `${login}/${REPO}`);
  }

  // 2. remote + commit + push
  const remote = gh(['repo', 'view', `${login}/${REPO}`, '--json', 'url', '--jq', '.url']);
  if (!fs.existsSync(path.join(SITE, '.git'))) throw new Error('нет .git');
  const remotes = run('git', ['remote'], { cwd: SITE });
  if (remotes.split('\n').includes('origin')) run('git', ['remote', 'set-url', 'origin', remote], { cwd: SITE });
  else run('git', ['remote', 'add', 'origin', remote], { cwd: SITE });

  // коммитим всё, что пересобралось (иначе push отправит старую версию)
  run('git', ['add', '-A'], { cwd: SITE });
  const staged = run('git', ['diff', '--cached', '--name-only'], { cwd: SITE });
  if (staged) {
    run('git', ['commit', '-m', 'Обновление сборки сайта'], { cwd: SITE });
    console.log('Закоммичено файлов:', staged.split('\n').length);
  }

  run('git', ['push', '-u', 'origin', 'main'], { cwd: SITE });
  console.log('Изменения отправлены в origin/main');

  // 3. Pages
  const siteUrl = `https://${login}.github.io/${REPO}/`;
  try {
    gh(['api', '-X', 'POST', `repos/${login}/${REPO}/pages`, '-f', 'source[branch]=main', '-f', 'source[path]=/']);
    console.log('Pages включён: ветка main / корень');
  } catch (e) {
    if (/already (exists|enabled)/i.test(e.message)) {
      console.log('Pages уже настроен');
    } else {
      console.warn('Не удалось включить Pages через API:', e.message);
      console.warn(`Включите вручную: Settings → Pages → Deploy from a branch → main / (root)`);
    }
  }

  // 4. реальная ссылка в README
  const readmePath = path.join(SITE, 'README.md');
  const readme = fs.readFileSync(readmePath, 'utf8');
  const patched = readme.replace(/https:\/\/[^\s)]*github\.io\/[^\s)]*\//, siteUrl);
  if (patched !== readme) {
    fs.writeFileSync(readmePath, patched);
    run('git', ['add', 'README.md'], { cwd: SITE });
    run('git', ['commit', '-m', 'Ссылка на демо в README'], { cwd: SITE });
    run('git', ['push', 'origin', 'main'], { cwd: SITE });
    console.log('README обновлён');
  }

  console.log('\nГотово. Сайт будет доступен через 1–3 минуты:');
  console.log('  ' + siteUrl);
  console.log('Репозиторий: https://github.com/' + login + '/' + REPO);
  if (created) console.log('Проверьте статус сборки: ' + siteUrl);
}

main();
