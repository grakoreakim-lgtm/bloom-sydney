// Thumbnail: 1280x720 PNG rendered from an HTML template with Playwright.
const { chromium } = require('playwright');
const fs = require('fs');

const BRAND = { ko: 'My Channel', en: 'My Channel' };   // fallback only — pass opts.brand (config.brands)
const BADGE = { ko: ['무료', '5분', '따라하기'], en: ['FREE', '5 MIN', 'STEP BY STEP'], hi: ['FREE', '5 MIN', 'हिंदी'], es: ['GRATIS', '5 MIN', 'PASO A PASO'], id: ['GRATIS', '5 MENIT', 'MUDAH'], ja: ['無料', '5分', '手順'] };

// v2 (bold): three things only — where (white), what (yellow, biggest), why click (red chip) — readable at phone size.
// opts.lines = [where, what, hook]; without it the old inputs are mapped onto the same layout.
function html({ flag, country, form, lang, year, shot, brand, lines }) {
  const chips = BADGE[lang] || BADGE.en;
  const [a, b, hook] = lines && lines.length >= 2 ? lines : [country || '', form || '', chips.slice(0, 2).join(' · ')];
  const fit = (t, big, small, at) => (String(t).length > at ? small : big);   // shrink long lines instead of wrapping
  const esc = (t) => String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  body{margin:0;width:1280px;height:720px;overflow:hidden;font-family:"Pretendard","Noto Sans CJK KR","Noto Sans KR","Segoe UI",system-ui,sans-serif;background:#0a0f1f;color:#fff;position:relative}
  .shot{position:absolute;right:-170px;top:96px;width:640px;height:560px;border-radius:26px;overflow:hidden;box-shadow:0 30px 90px rgba(0,0,0,.7);transform:rotate(5deg);border:10px solid #fff}
  .shot img{width:100%;height:100%;object-fit:cover;object-position:left top;filter:saturate(1.1)}
  .glow{position:absolute;right:-200px;top:-160px;width:900px;height:900px;border-radius:50%;background:radial-gradient(circle,#2f6bff 0%,rgba(47,107,255,0) 62%);opacity:.75}
  .shade{position:absolute;inset:0;background:linear-gradient(90deg,#0a0f1f 0%,#0a0f1f 52%,rgba(10,15,31,.6) 66%,rgba(10,15,31,0) 84%)}
  .txt{position:absolute;left:54px;top:50%;transform:translateY(-52%);width:860px}
  .a{font-weight:900;line-height:1.05;letter-spacing:-.03em;display:flex;align-items:center;gap:22px;text-shadow:0 6px 24px rgba(0,0,0,.8)}
  .a .flag{font-size:.95em;line-height:1}
  .b{font-weight:900;line-height:1.04;letter-spacing:-.04em;color:#ffe100;margin-top:10px;white-space:nowrap;text-shadow:0 8px 0 rgba(0,0,0,.55),0 10px 40px rgba(0,0,0,.8)}
  .hook{display:inline-block;margin-top:34px;background:#ff2d2d;color:#fff;font-weight:900;font-size:${fit(hook, 58, 46, 14)}px;padding:12px 30px;border-radius:16px;letter-spacing:-.01em;box-shadow:0 10px 30px rgba(0,0,0,.5);white-space:nowrap}
  .brand{position:absolute;left:58px;bottom:34px;font-size:28px;font-weight:800;opacity:.8}
  .year{position:absolute;right:40px;top:34px;background:#fff;color:#111;font-weight:900;font-size:44px;padding:6px 22px;border-radius:14px}
  </style></head><body>
  <div class="glow"></div>
  ${shot ? `<div class="shot"><img src="data:image/png;base64,${fs.readFileSync(shot).toString('base64')}"></div>` : ''}<div class="shade"></div>
  <div class="txt">
    <div class="a" style="font-size:${fit(a, 104, 80, 9)}px">${flag ? `<span class="flag">${flag}</span>` : ''}<span>${esc(a)}</span></div>
    <div class="b" style="font-size:${fit(b, 168, lang === 'ko' ? 132 : 112, lang === 'ko' ? 5 : 9)}px">${esc(b)}</div>
    ${hook ? `<div class="hook">${esc(hook)}</div>` : ''}
  </div>
  <div class="brand">▶ ${brand || BRAND[lang] || BRAND.en}</div><div class="year">${year}</div>
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
