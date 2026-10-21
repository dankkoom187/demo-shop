/* Генерация аватаров и шапки профиля: node tools/avatar.js
   Варианты: монограмма на тёмном, светлый круг, иконка-силуэт, шапка профиля.
   Рендер — через Chrome (puppeteer-core), на выходе PNG. */

const fs = require('fs');
const path = require('path');
const { launch } = require('./chrome');

const OUT = path.resolve(__dirname, '..', 'dist', 'media');

const MONO = 'Д'; // монограмма
const BRAND = '#c9431f';
const INK = '#0e1116';
const FONT = "'Segoe UI', 'Arial Black', Arial, sans-serif";

const variants = [
  {
    name: 'avatar-1-mono-dark',
    size: 512,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#171c24"/><stop offset="1" stop-color="#0b0e12"/>
        </linearGradient>
        <radialGradient id="glow" cx="0.72" cy="0.22" r="0.7">
          <stop offset="0" stop-color="${BRAND}" stop-opacity="0.55"/><stop offset="1" stop-color="${BRAND}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="512" height="512" fill="url(#bg)"/>
      <rect width="512" height="512" fill="url(#glow)"/>
      <g opacity="0.12" stroke="#ffffff" stroke-width="1">
        ${Array.from({ length: 8 }, (_, i) => `<line x1="${i * 64}" y1="0" x2="${i * 64}" y2="512"/>`).join('')}
        ${Array.from({ length: 8 }, (_, i) => `<line x1="0" y1="${i * 64}" x2="512" y2="${i * 64}"/>`).join('')}
      </g>
      <circle cx="256" cy="256" r="196" fill="none" stroke="#ffffff" stroke-opacity="0.14" stroke-width="2"/>
      <text x="256" y="256" font-family="${FONT}" font-size="236" font-weight="800" fill="#ffffff"
        text-anchor="middle" dominant-baseline="central" letter-spacing="-6">${MONO}</text>
      <rect x="206" y="404" width="100" height="9" rx="4.5" fill="${BRAND}"/>
    </svg>`
  },
  {
    name: 'avatar-2-mono-light',
    size: 512,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <rect width="512" height="512" fill="#f2f4f7"/>
      <circle cx="256" cy="256" r="190" fill="#ffffff"/>
      <circle cx="256" cy="256" r="190" fill="none" stroke="#dfe3e9" stroke-width="3"/>
      <path d="M256 66a190 190 0 0 1 164 95" fill="none" stroke="${BRAND}" stroke-width="12" stroke-linecap="round"/>
      <text x="256" y="238" font-family="${FONT}" font-size="180" font-weight="800" fill="${INK}"
        text-anchor="middle" dominant-baseline="central">${MONO}</text>
      <text x="256" y="392" font-family="${FONT}" font-size="26" font-weight="600" fill="#6b7280"
        text-anchor="middle" letter-spacing="7">WEB</text>
    </svg>`
  },
  {
    name: 'avatar-3-dev-icon',
    size: 512,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <rect width="512" height="512" fill="${INK}"/>
      <rect x="72" y="116" width="368" height="280" rx="28" fill="#161b22" stroke="#2b323c" stroke-width="3"/>
      <circle cx="118" cy="158" r="9" fill="${BRAND}"/>
      <circle cx="148" cy="158" r="9" fill="#3d444d"/>
      <circle cx="178" cy="158" r="9" fill="#3d444d"/>
      <g font-family="${FONT}" font-size="54" font-weight="700" fill="#e6edf3">
        <text x="118" y="270">&lt;</text>
        <text x="368" y="270" text-anchor="end">&gt;</text>
      </g>
      <circle cx="256" cy="258" r="16" fill="${BRAND}"/>
      <rect x="120" y="320" width="272" height="12" rx="6" fill="#242b33"/>
      <rect x="120" y="320" width="150" height="12" rx="6" fill="${BRAND}" opacity="0.85"/>
    </svg>`
  },
  {
    name: 'profile-header',
    size: [1200, 400],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400" viewBox="0 0 1200 400">
      <defs>
        <linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#0b0e12"/><stop offset="1" stop-color="#151b23"/>
        </linearGradient>
        <radialGradient id="glow2" cx="0.18" cy="0.1" r="0.8">
          <stop offset="0" stop-color="${BRAND}" stop-opacity="0.5"/><stop offset="1" stop-color="${BRAND}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1200" height="400" fill="url(#bg2)"/>
      <rect width="1200" height="400" fill="url(#glow2)"/>
      <g opacity="0.1" stroke="#ffffff" stroke-width="1">
        ${Array.from({ length: 19 }, (_, i) => `<line x1="${i * 64}" y1="0" x2="${i * 64}" y2="400"/>`).join('')}
        ${Array.from({ length: 7 }, (_, i) => `<line x1="0" y1="${i * 64}" x2="1200" y2="${i * 64}"/>`).join('')}
      </g>
      <text x="80" y="196" font-family="${FONT}" font-size="72" font-weight="800" fill="#ffffff" letter-spacing="-2">
        Веб-разработка
      </text>
      <text x="80" y="262" font-family="${FONT}" font-size="30" font-weight="500" fill="#a7b0bd">
        Магазины · интеграции · автоматизация
      </text>
      <rect x="80" y="296" width="150" height="10" rx="5" fill="${BRAND}"/>
      <g transform="translate(930 200)">
        <circle r="96" fill="#161b22" stroke="#2b323c" stroke-width="3"/>
        <text y="10" font-family="${FONT}" font-size="104" font-weight="800" fill="#ffffff" text-anchor="middle">${MONO}</text>
      </g>
    </svg>`
  }
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await launch();
  const page = await browser.newPage();

  for (const v of variants) {
    const [w, h] = Array.isArray(v.size) ? v.size : [v.size, v.size];
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    const svg = v.svg.replace(/\n\s+/g, ' ');
    await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`, {
      waitUntil: 'load'
    });
    await new Promise((r) => setTimeout(r, 150));
    const file = path.join(OUT, `${v.name}.png`);
    await page.screenshot({ path: file, omitBackground: true });
    console.log(`${v.name}.png  ${w}×${h}  ${Math.round(fs.statSync(file).size / 1024)} КБ`);
  }

  await browser.close();
})();
