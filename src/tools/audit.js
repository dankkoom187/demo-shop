/* Аудит проекта: node tools/audit.js
   Проверяет: дубли ID, доступность (axe-core), ссылки, alt, вес страниц,
   работу кнопки закрытия корзины и однофайловую сборку. */

const fs = require('fs');
const path = require('path');
const { launch } = require('./chrome');

const ROOT = path.resolve(__dirname, '..');
const DIST = process.env.DIST_DIR ? path.resolve(process.env.DIST_DIR) : path.join(ROOT, 'dist');
const ONEFILE = path.join(ROOT, 'dist-onefile', 'index.html');
const AXE = fs.readFileSync(path.join(ROOT, 'node_modules', 'axe-core', 'axe.min.js'), 'utf8');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const url = (file) => 'file:///' + path.join(DIST, file).replace(/\\/g, '/');

(async () => {
  const files = fs
    .readdirSync(DIST)
    .filter((f) => f.endsWith('.html'))
    .sort();
  const browser = await launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const report = { pages: [], axe: [], issues: [] };

  for (const file of files) {
    await page.goto(url(file), { waitUntil: 'networkidle2' });
    await wait(250);

    // 1. дубли ID + базовая разметка
    const dom = await page.evaluate(() => {
      const ids = Array.from(document.querySelectorAll('[id]')).map((e) => e.id);
      const dupIds = ids.filter((id, i) => ids.indexOf(id) !== i);
      const emptyHref = Array.from(document.querySelectorAll('a[href=""]')).length;
      const noAlt = Array.from(document.querySelectorAll('img:not([alt])')).length;
      const h1 = document.querySelectorAll('h1').length;
      const buttons = Array.from(document.querySelectorAll('button')).filter(
        (b) => !b.textContent.trim() && !b.getAttribute('aria-label') && !b.querySelector('svg[aria-label]')
      ).length;
      const unlabeled = Array.from(document.querySelectorAll('input:not([type="hidden"]), textarea, select')).filter(
        (el) => {
          if (el.type === 'checkbox' || el.type === 'radio') {
            return !el.closest('label') && !document.querySelector(`label[for="${el.id}"]`);
          }
          return (
            !el.closest('label') && !document.querySelector(`label[for="${el.id}"]`) && !el.getAttribute('aria-label')
          );
        }
      ).length;
      return {
        dupIds: [...new Set(dupIds)],
        emptyHref,
        noAlt,
        h1,
        buttons,
        unlabeled,
        title: document.title,
        htmlSize: document.documentElement.outerHTML.length
      };
    });

    // 2. вес ресурсов
    const weight = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource');
      const total =
        entries.reduce((s, e) => s + (e.transferSize || 0), 0) +
        (performance.getEntriesByType('navigation')[0]?.transferSize || 0);
      return { total, requests: entries.length + 1 };
    });

    // 3. axe
    await page.evaluate(AXE);
    const axe = await page.evaluate(async () => {
      const res = await window.axe.run(document, { resultTypes: ['violations'] });
      return res.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.length,
        help: v.help,
        targets: v.nodes
          .slice(0, 4)
          .map((n) => n.target.join(' ') + (n.failureSummary ? ' → ' + n.failureSummary.split('\n')[1] : ''))
      }));
    });

    report.pages.push({ file, ...dom, weight });
    axe.forEach((v) => report.axe.push({ file, ...v }));
  }

  // 4. кнопка закрытия корзины
  await page.goto(url('catalog.html'), { waitUntil: 'networkidle2' });
  await wait(300);
  await page.click('[data-add="tr150"]');
  await wait(200);
  await page.click('#cartBtn');
  await wait(400);
  const opened = await page.$eval('#cartDrawer', (e) => e.classList.contains('open'));
  await page.click('#cartDrawer [data-close]');
  await wait(400);
  const closed = await page.$eval('#cartDrawer', (e) => !e.classList.contains('open'));
  report.drawer = { opened, closed };

  // 5. однофайловая сборка
  let onefile = { exists: fs.existsSync(ONEFILE) };
  if (onefile.exists) {
    await page.goto('file:///' + ONEFILE.replace(/\\/g, '/'), { waitUntil: 'networkidle2' });
    await wait(400);
    onefile = {
      ...onefile,
      cards: await page.$$eval('.card', (e) => e.length),
      styled: await page.$eval('h1', (e) => getComputedStyle(e).fontSize),
      errors: await page.evaluate(() => window.__errors || 0),
      sizeKb: Math.round(fs.statSync(ONEFILE).size / 1024)
    };
  }

  await browser.close();

  // --- вывод ---
  console.log('=== СТРАНИЦЫ ===');
  report.pages.forEach((p) => {
    const flags = [];
    if (p.dupIds.length) flags.push('дубли ID: ' + p.dupIds.join(', '));
    if (p.emptyHref) flags.push('пустые href: ' + p.emptyHref);
    if (p.noAlt) flags.push('img без alt: ' + p.noAlt);
    if (p.buttons) flags.push('кнопки без текста: ' + p.buttons);
    if (p.unlabeled) flags.push('поля без label: ' + p.unlabeled);
    if (p.h1 !== 1) flags.push('h1: ' + p.h1);
    console.log(
      `${flags.length ? 'FAIL' : 'OK  '} ${p.file.padEnd(16)} ${p.weight.requests} запр. / ${Math.round(p.weight.total / 1024)} КБ${flags.length ? ' → ' + flags.join('; ') : ''}`
    );
  });

  console.log('\n=== AXE (доступность) ===');
  if (!report.axe.length) console.log('OK   нарушений нет');
  else {
    const grouped = {};
    report.axe.forEach((v) => {
      grouped[v.id] = grouped[v.id] || { impact: v.impact, help: v.help, pages: new Set(), nodes: 0, targets: [] };
      grouped[v.id].pages.add(v.file);
      grouped[v.id].nodes += v.nodes;
      if (grouped[v.id].targets.length < 5) grouped[v.id].targets.push(...v.targets.slice(0, 2));
    });
    Object.entries(grouped).forEach(([id, v]) => {
      console.log(
        `${v.impact === 'critical' || v.impact === 'serious' ? 'FAIL' : 'WARN'} ${id} (${v.impact}, узлов: ${v.nodes}) — ${v.help}`
      );
      console.log('     страницы: ' + Array.from(v.pages).join(', '));
      v.targets.slice(0, 6).forEach((t) => console.log('     · ' + t));
    });
  }

  console.log('\n=== КОРЗИНА ===');
  console.log(`кнопка «×»: открылась=${report.drawer.opened}, закрылась=${report.drawer.closed}`);

  console.log('\n=== ОДНОФАЙЛОВАЯ СБОРКА ===');
  console.log(JSON.stringify(report.drawer), JSON.stringify(onefile));

  // итог: падаем, если есть проблемы разметки или критичные нарушения доступности
  const pageFailures = report.pages.filter(
    (p) => p.dupIds.length || p.emptyHref || p.noAlt || p.buttons || p.unlabeled || p.h1 !== 1
  ).length;
  const seriousAxe = report.axe.filter((v) => v.impact === 'critical' || v.impact === 'serious').length;
  const drawerOk = report.drawer.opened && report.drawer.closed;
  const onefileOk = !onefile.exists || (onefile.cards > 0 && Number.parseFloat(onefile.styled) > 0);

  const failed = pageFailures || seriousAxe || !drawerOk || !onefileOk;
  console.log(
    `\nИТОГ: страниц с проблемами — ${pageFailures}, критичных axe — ${seriousAxe}, корзина — ${drawerOk ? 'ок' : 'сломана'}, однофайловая — ${onefileOk ? 'ок' : 'сломана'}`
  );
  process.exit(failed ? 1 : 0);
})();
