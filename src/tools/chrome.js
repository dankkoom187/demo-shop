/* Общие утилиты для puppeteer-core: поиск Chrome и запуск страницы. */
const fs = require('fs');
const puppeteer = require('puppeteer-core');

const CANDIDATES = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium'
].filter(Boolean);

function findChrome() {
  const found = CANDIDATES.find((p) => fs.existsSync(p));
  if (!found) throw new Error('Chrome не найден. Задайте путь через переменную окружения CHROME_PATH.');
  return found;
}

function pageUrl(file = 'index.html') {
  const abs = require('path').resolve(__dirname, '..', file).replace(/\\/g, '/');
  return 'file:///' + abs;
}

async function launch() {
  return puppeteer.launch({
    executablePath: findChrome(),
    headless: 'new',
    args: ['--allow-file-access-from-files', '--hide-scrollbars']
  });
}

module.exports = { launch, pageUrl, findChrome };
