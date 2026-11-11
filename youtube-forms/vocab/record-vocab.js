#!/usr/bin/env node
// Usage: node record-vocab.js comic|mindmap [--speed 1]
// Records vocab/<format>.html with Playwright → out/<set>-<format>.mp4 + screenshots

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const V = require('./data/new-school.js');

const format = process.argv[2];
const speedArg = process.argv.indexOf('--speed');
const speed = speedArg > 0 ? Number(process.argv[speedArg + 1]) : 1;
if (!['comic', 'mindmap'].includes(format)) { console.error('usage: node record-vocab.js comic|mindmap [--speed 1]'); process.exit(1); }

const outDir = path.join(__dirname, 'out');
fs.mkdirSync(outDir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms * speed));
let shotN = 0;

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: outDir, size: { width: 1280, height: 720 } } });
  const page = await ctx.newPage();
  await page.goto('file://' + path.join(__dirname, `${format}.html`));
  await page.waitForFunction(() => window.api && document.images[0]?.complete !== false);
  const api = (fn, ...a) => page.evaluate(([fn, a]) => window.api[fn](...a), [fn, a]);
  const shot = async (name) => { await new Promise(r => setTimeout(r, 600)); return page.screenshot({ path: path.join(outDir, `${format}-${String(++shotN).padStart(2, '0')}-${name}.png`) }); };
  const total = V.panels.length;

  // ---------- HOOK (0–8s): result first, then promise ----------
  await api('card', { big: `${total}컷`, title: `${V.title.ko} — 영어 단어 ${total}개`, subtitle: '단어장 말고 "상황"으로 외웁니다\n보고 → 뜻·뉘앙스 → 3초 안에 떠올리기', chips: ['📖 syllabus · disparity · holistic …', '🧠 3단계로 머리에 각인', `⏱ ${total * 0.6 | 0}분`] });
  await shot('hook'); await sleep(4200); await api('hideCard');

  if (format === 'comic') {
    await api('badge', '전체 보기'); await api('overview'); await sleep(2200);
    for (const P of V.panels) {
      const n = P.n;
      await api('progress', (n - 1) / total);
      // STEP 1 context
      await api('badge', `${n}/${total} · STEP 1 상황`);
      await api('focusPanel', n); await sleep(1000);
      await api('showBubble', n); await sleep(900);
      await api('context', n); await shot(`p${n}-context`); await sleep(3200);
      // STEP 2 meaning
      await api('badge', `${n}/${total} · STEP 2 뜻·뉘앙스`);
      await api('meaning', n); await shot(`p${n}-meaning`); await sleep(P.bonus ? 7000 : 5500);
      // STEP 3 recall
      await api('badge', `${n}/${total} · STEP 3 떠올리기`);
      for (const c of [3, 2, 1]) { await api('quiz', n, c); if (c === 3) await shot(`p${n}-quiz`); await sleep(1000); }
      await api('reveal', n); await sleep(2200);
    }
    await api('progress', 1);
    await api('badge', '복습'); await api('overview'); await sleep(1500);
  } else {
    await api('badge', '지도 그리기'); await api('showCenter'); await sleep(1200);
    for (let i = 0; i < V.branches.length; i++) {
      const b = V.branches[i];
      await api('progress', i / V.branches.length);
      await api('badge', `가지 ${i + 1}/${V.branches.length} · ${b.label.ko}`);
      await api('growBranch', i); await sleep(1400);
      for (const n of b.panels) { await api('growLeaf', n); await sleep(900); }
      await shot(`branch${i + 1}`); await sleep(600);
      for (const n of b.panels) {
        const P = V.panels[n - 1];
        await api('focus', n);
        await api('badge', `${P.target} · STEP 1 상황`); await api('cardAt', n, 'context'); await shot(`p${n}-context`); await sleep(3200);
        await api('badge', `${P.target} · STEP 2 뜻·뉘앙스`); await api('cardAt', n, 'meaning'); await shot(`p${n}-meaning`); await sleep(P.bonus ? 6500 : 5000);
        await api('badge', `${P.target} · STEP 3 떠올리기`);
        for (const c of [3, 2, 1]) { await api('cardAt', n, 'quiz', c); if (c === 3) await shot(`p${n}-quiz`); await sleep(1000); }
        await api('cardAt', n, 'reveal'); await sleep(2000);
        await api('unfocus'); await sleep(400);
      }
    }
    await api('progress', 1); await api('badge', '완성된 지도'); await shot('full-map'); await sleep(2500);
  }

  // ---------- REVIEW: all words in 12 seconds ----------
  await api('card', { title: '12초 복습', subtitle: '뜻을 보고 단어를 말해보세요', words: V.panels });
  await shot('review'); await sleep(6000);
  await api('card', { big: '끝', title: '다음 세트는 "Job Interview" 8컷', subtitle: '구독하면 매일 1세트 · 설명란에 PDF 단어장', chips: ['📄 이 영상 단어장 PDF: 설명란', '🔁 내일 다시 보면 장기기억'] });
  await shot('outro'); await sleep(3500);

  const video = page.video(); await ctx.close(); const webm = await video.path(); await browser.close();
  const base = path.join(outDir, `${V.id}-${format}`);
  fs.renameSync(webm, base + '.webm');
  try { execSync(`ffmpeg -y -loglevel error -i "${base}.webm" -c:v libx264 -pix_fmt yuv420p -crf 20 -movflags +faststart "${base}.mp4"`); } catch {}
  console.log('✔', base + '.mp4');
})().catch((e) => { console.error(e); process.exit(1); });
