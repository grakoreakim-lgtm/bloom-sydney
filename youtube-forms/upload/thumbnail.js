// Thumbnail: 1280x720 PNG rendered from an HTML template with Playwright.
const { chromium } = require('playwright');
const fs = require('fs');

const BRAND = { ko: '따라하면 끝', en: 'Copy My Screen', hi: 'Copy My Screen', es: 'Copy My Screen', id: 'Copy My Screen', ja: 'Copy My Screen' };
const BADGE = { ko: ['무료', '5분', '따라하기'], en: ['FREE', '5 MIN', 'STEP BY STEP'], hi: ['FREE', '5 MIN', 'हिंदी'], es: ['GRATIS', '5 MIN', 'PASO A PASO'], id: ['GRATIS', '5 MENIT', 'MUDAH'], ja: ['無料', '5分', '手順'] };

function html({ flag, country, form, lang, year, shot }) {
  const chips = BADGE[lang] || BADGE.en;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  body{margin:0;width:1280px;height:720px;overflow:hidden;font-family:"Pretendard","Noto Sans KR","Segoe UI",system-ui,sans-serif;background:#0b1220;color:#fff;position:relative}
  .shot{position:absolute;right:-40px;top:70px;width:760px;height:600px;border-radius:18px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.6);transform:rotate(-4deg);border:6px solid #fff}
  .shot img{width:100%;height:100%;object-fit:cover;object-position:left top}
  .shade{position:absolute;inset:0;background:linear-gradient(90deg,#0b1220 38%,rgba(11,18,32,.2) 70%)}
  .flag{position:absolute;left:56px;top:48px;font-size:120px;line-height:1}
  .country{position:absolute;left:200px;top:70px;font-size:40px;font-weight:700;opacity:.9}
  .form{position:absolute;left:56px;top:200px;width:720px;font-size:84px;font-weight:900;line-height:1.02;letter-spacing:-.02em;text-shadow:0 6px 30px rgba(0,0,0,.6)}
  .chips{position:absolute;left:56px;bottom:120px;display:flex;gap:14px}
  .chip{background:#ffd400;color:#111;font-weight:900;font-size:36px;padding:10px 22px;border-radius:14px}
  .chip.red{background:#ff3b3b;color:#fff}
  .brand{position:absolute;left:56px;bottom:44px;font-size:30px;font-weight:800;opacity:.85}
  .year{position:absolute;right:48px;bottom:40px;background:#fff;color:#111;font-weight:900;font-size:34px;padding:8px 18px;border-radius:12px;transform:rotate(-4deg)}
  </style></head><body>
  ${shot ? `<div class="shot"><img src="data:image/png;base64,${fs.readFileSync(shot).toString('base64')}"></div>` : ''}<div class="shade"></div>
  <div class="flag">${flag}</div><div class="country">${country}</div>
  <div class="form">${form}</div>
  <div class="chips">${chips.map((c, i) => `<span class="chip ${i === 0 ? 'red' : ''}">${c}</span>`).join('')}</div>
  <div class="brand">▶ ${BRAND[lang] || BRAND.en}</div><div class="year">${year}</div>
  </body></html>`;
}

async function thumbnail(opts, outFile) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.setContent(html(opts), { waitUntil: 'load' });
  await page.screenshot({ path: outFile, type: 'png' });
  await browser.close();
  return outFile;
}

module.exports = { thumbnail };
