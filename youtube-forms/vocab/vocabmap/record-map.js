#!/usr/bin/env node
// VocabMap video: one hand-drawn map, 20 words, three retrievals.
// Usage: node record-map.js [--speed 1] [--short]   (--short = 60s review Short, 9:16)

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const U = require('./data/junior-a01.js');

const argv = process.argv.slice(2);
const speed = argv.includes('--speed') ? Number(argv[argv.indexOf('--speed') + 1]) : 1;
const outDir = path.join(__dirname, 'out');
fs.mkdirSync(outDir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms * speed));
let shotN = 0;

(async () => {
  const size = { width: 1280, height: 720 };
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: size, recordVideo: { dir: outDir, size } });
  const page = await ctx.newPage();
  await page.goto('file://' + path.join(__dirname, 'map.html'));
  await page.waitForFunction(() => window.api && [...document.images].every(i => i.complete));
  const api = (fn, ...a) => page.evaluate(([fn, a]) => window.api[fn](...a), [fn, a]);
  const shot = async (name) => { await new Promise(r => setTimeout(r, 650)); await page.screenshot({ path: path.join(outDir, `map-${String(++shotN).padStart(2, '0')}-${name}.png`) }); };
  const byWord = Object.fromEntries(U.entries.map(e => [e.headword, e]));
  let done = 0; const total = U.entries.length;

  // ---------- HOOK (0–8s): finished map first, then the promise ----------
  await api('badge', 'DAY 01 · My Day'); await api('blankOverlay', true); await api('full'); await sleep(1400);
  await api('blankOverlay', false); await api('showAll', true); await sleep(1800);
  await api('panel', { k: '오늘', t: '단어 20개를 <b>한 장의 지도</b>로 외웁니다. 영상이 끝나면 이 지도가 머릿속에 남습니다.', sub: '마지막 60초에 시험이 있습니다 — 빈 지도만 보고 20개를 말해야 합니다.', chips: ['① 장면 떠올리기', '② 가지마다 채우기 → 바로 꺼내기', '③ 이야기 빈칸', '④ 빈 지도 시험 60초'] });
  await shot('hook'); await sleep(5200); await api('hidePanel');
  await api('showAll', false); await sleep(900);   // stickers back on: the map is blank again

  // ---------- ① SCENES: pre-test / activate what you already know ----------
  for (const b of U.branches) {
    await api('badge', `① 장면 떠올리기 · ${b.label}`); await api('scene', b.id); await api('spot', b.region.scene);
    await api('panel', { k: b.scene.label, t: b.scene.text, sub: '이 장면에서 이미 아는 영어 단어를 소리 내어 말해보세요 — 아는 것: ' + b.scene.known.join(', ') });
    if (b.id === 'morning') await shot('scene'); await sleep(5200); await api('hidePanel');
  }
  await api('spot', null); await api('full'); await sleep(1200);

  // ---------- ② BRANCH BY BRANCH: fill the map, then immediate recall ----------
  for (const b of U.branches) {
    await api('badge', `② 채우기 · ${b.label}`); await api('branch', b.id, true); await sleep(1200);
    for (const w of b.words) {
      const e = byWord[w]; done++;
      await api('badge', `② 채우기 · ${b.label} · ${done}/${total}`); await api('progress', done / total * 0.7);
      await api('reveal', w, true); await sleep(500);
      await api('card', w); if (done === 1 || done === 7) await shot(`word-${w}`); await sleep(5600);
    }
    await api('hideCard'); await api('unhot');
    // immediate retrieval: cover the 5 words we just saw
    await api('badge', `꺼내기 ① · ${b.label} 5개`); await api('branch', b.id, false); await api('cover', b.words); await sleep(700);
    for (const c of [5, 4, 3, 2, 1]) { await api('panel', { k: '꺼내기 ① · 방금 본 5개', t: `${b.label} 가지의 단어 5개를 순서대로 말해보세요.`, sub: '기억에서 꺼내는 순간 기억이 단단해집니다. 못 떠올려도 괜찮아요 — 다음 화면에서 확인.', count: c }); if (c === 5 && b.id === 'morning') await shot('recall1'); await sleep(1000); }
    for (const w of b.words) { await api('reveal', w, false); await sleep(350); }
    await api('panel', { k: '확인', t: b.words.map(w => `<span class="ans">${w}</span>`).join('  '), sub: b.words.map(w => byWord[w].ko).join(' · ') }); await sleep(2600); await api('hidePanel');
  }
  await api('full'); await sleep(1500);

  // ---------- ③ STORY CLOZE: second retrieval, in context ----------
  await api('badge', '꺼내기 ② · 이야기 빈칸'); await api('cover', U.entries.map(e => e.headword));
  for (let i = 0; i < U.story.paragraphs.length; i++) {
    const b = U.branches[i]; await api('branch', b.id, false);
    for (const w of b.words) await api('ask', w, true);
    for (const c of [8, 7, 6, 5, 4, 3, 2, 1]) { await api('story', i, 'blank', c); if (c === 8 && i === 0) await shot('story-blank'); await sleep(1000); }
    await api('story', i, 'answer'); for (const w of b.words) await api('reveal', w, false);
    if (i === 0) await shot('story-answer'); await sleep(3200);
    await api('clearAsk'); await api('progress', 0.7 + (i + 1) / 4 * 0.2);
  }
  await api('hidePanel');

  // ---------- ④ FINAL TEST: blank map, 60 seconds ----------
  await api('badge', '꺼내기 ③ · 빈 지도 시험'); await api('full'); await api('cover', U.entries.map(e => e.headword)); await sleep(800);
  await api('panel', { k: '시험', t: '빈 지도만 보고 ①~⑳을 차례로 말하세요. 번호마다 2.5초.', sub: '끝나면 몇 개 맞혔는지 댓글에 숫자로 남겨주세요. 내일 복습 영상에서 틀리기 쉬운 단어를 다시 봅니다.' });
  await shot('test-intro'); await sleep(4000); await api('hidePanel');
  for (const e of U.entries) {
    await api('ask', e.headword, true); await sleep(2200);
    await api('reveal', e.headword, false); await sleep(400);
    await api('progress', 0.9 + e.no / total * 0.1);
  }
  await shot('test-done'); await sleep(1800);

  // ---------- OUTRO ----------
  await api('fs', { title: '몇 개 맞혔나요?', subtitle: '댓글에 숫자만 남겨주세요.\n내일: 이 지도 복습 60초 (쇼츠) · 3일 뒤 · 7일 뒤 다시 돌아옵니다', words: U.entries });
  await shot('outro'); await sleep(6500);

  const video = page.video(); await ctx.close(); const webm = await video.path(); await browser.close();
  const base = path.join(outDir, `${U.id}-map`);
  fs.renameSync(webm, base + '.webm');
  try { execSync(`ffmpeg -y -loglevel error -i "${base}.webm" -c:v libx264 -pix_fmt yuv420p -crf 20 -movflags +faststart "${base}.mp4"`); } catch {}
  console.log('✔', base + '.mp4');
})().catch((e) => { console.error(e); process.exit(1); });
