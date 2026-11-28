#!/usr/bin/env node
// Travel-phrase videos ("도착 후 가이드" series): a phrases/<id>.json → one 16:9 lesson video + vertical Shorts.
// Each phrase: situation (Korean) → phrase twice (normal, slow) → a pause to repeat → a short tip.
// Every image is shown exactly as long as its own audio, so the screen and the voice cannot drift apart.
//
//   node upload/phrases.js phrases/jp-restaurant.json [--fake-tts] [--upload] [--no-shorts] [--config upload/config.ci.json]
//
// Output: out/phrases/<id>/<id>.mp4, .png, .qa.json, <id>.short<n>.mp4; --upload sends everything PRIVATE.
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { chromium } = require('playwright');
const { synthesize, setBudget } = require('./narration');
const { pickBgm } = require('./mux');

const argv = process.argv.slice(2);
const flag = (k) => argv.includes(`--${k}`);
const opt = (k) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : null; };
const cfg = JSON.parse(fs.readFileSync(opt('config') || path.join(__dirname, 'config.ci.json'), 'utf8'));
const ROOT = path.join(__dirname, '..');
// --next --date <YYYY-MM-DD>: take the first episode in config.phraseQueue that is not in plan/produced.json yet
// (daily production; uploads are scheduled for that date's publish window instead of private)
const PRODUCED = path.join(ROOT, 'plan', 'produced.json');
const produced = fs.existsSync(PRODUCED) ? JSON.parse(fs.readFileSync(PRODUCED, 'utf8')) : {};
let file = argv.find((a) => !a.startsWith('--') && ![opt('config'), opt('date'), opt('budget')].includes(a));
if (flag('next')) {
  const id = (cfg.phraseQueue || []).find((x) => !produced[`phrases:${x}`]);
  if (!id) { console.log('PHRASES none left in config.phraseQueue'); process.exit(0); }
  file = path.join(ROOT, 'phrases', `${id}.json`);
}
const P = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
const DATE = opt('date');   // with --next: the publish date (KST)
let BUDGET = opt('budget') != null ? Number(opt('budget')) : 99;   // uploads left today (shared YouTube quota)
if (flag('next') && BUDGET < 1) { console.log(`PHRASES skipped ${P.id}: no upload budget left today`); process.exit(0); }
const OUT = path.join(ROOT, 'out', 'phrases', P.id); fs.mkdirSync(OUT, { recursive: true });
const TMP = path.join(OUT, '_tmp'); fs.mkdirSync(TMP, { recursive: true });
const sh = (c) => execSync(c, { stdio: ['ignore', 'pipe', 'pipe'], shell: '/bin/bash' }).toString();
const dur = (f) => Number(sh(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${f}"`).trim());
const esc = (t) => String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
const bold = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const fake = flag('fake-tts');
const all = [...P.phrases, ...(P.bonus ? [{ ...P.bonus, bonus: true }] : [])];
const N = P.phrases.length;
let seq = 0; const tmp = (ext) => path.join(TMP, `${String(++seq).padStart(4, '0')}.${ext}`);

// ---------- audio: every clip becomes 24 kHz mono WAV so they join without gaps or clicks ----------
const wav = (src) => { const o = tmp('wav'); sh(`ffmpeg -y -loglevel error -i "${src}" -ar 24000 -ac 1 -c:a pcm_s16le "${o}"`); return o; };
const silence = (sec) => { const o = tmp('wav'); sh(`ffmpeg -y -loglevel error -f lavfi -i anullsrc=r=24000:cl=mono -t ${sec.toFixed(3)} -c:a pcm_s16le "${o}"`); return o; };
let fellBack = false; const koDone = {};
// All Korean lines are made up front with ONE voice: if the main voice fails or runs past its time budget on any
// line, every line is redone with the fallback voice, so a video never mixes two voices.
async function prepareKo(texts) {
  const uniq = [...new Set(texts.filter(Boolean))];
  if (fake) { for (const t of uniq) koDone[t] = silence(Math.max(1.2, t.length / 7)); return; }
  setBudget(cfg.tts?.maxMinutesPerVideo || 15);   // one budget for the whole video
  try { for (const t of uniq) { const f = tmp('mp3'); await synthesize(t, 'ko', f, cfg.tts.voices, cfg.tts?.speakingRate); koDone[t] = wav(f); } }
  catch (e) {
    if (!cfg.tts?.fallback?.ko) throw e;
    console.log(`VOICE_FALLBACK phrases:${P.id} — ${e.message.replace(/\s+/g, ' ').slice(0, 160)}`); fellBack = true;
    for (const t of uniq) { const f = tmp('mp3'); await synthesize(t, 'ko', f, { ko: { ...cfg.tts.fallback.ko, filler: undefined } }, cfg.tts?.speakingRate); koDone[t] = wav(f); }
  } finally { setBudget(0); }
  console.log(`  Korean voice: ${fellBack ? 'fallback' : 'main'} (${uniq.length} lines)`);
}
async function ko(text) { if (!koDone[text]) throw new Error(`Korean line not prepared: ${text}`); return koDone[text]; }
const jaCache = {};
async function target(text, slow) {
  const key = text;
  if (!jaCache[key]) {
    if (fake) jaCache[key] = silence(Math.max(0.8, text.length / 5));
    else {
      const f = tmp('mp3'); const L = P.target.lang;
      try { await synthesize(text, L, f, { [L]: { ...P.target.voice, split: false } }); }
      catch (e) { console.log(`  target voice fallback: ${e.message.slice(0, 120)}`); await synthesize(text, L, f, { [L]: { ...P.target.fallbackVoice, split: false } }); }
      jaCache[key] = wav(f);
    }
  }
  if (!slow) return jaCache[key];
  const o = tmp('wav'); sh(`ffmpeg -y -loglevel error -i "${jaCache[key]}" -filter:a atempo=0.78 -ar 24000 -ac 1 -c:a pcm_s16le "${o}"`); return o;
}

// ---------- cards (HTML → PNG) ----------
const FONT = "'Noto Sans CJK KR','Noto Sans CJK JP','Pretendard','Noto Sans KR',system-ui,sans-serif";
const BRAND = cfg.brandsKo || '따라하면 끝 · 도착 후 가이드';
const STATE = { listen: ['🔊', '들어 보세요', '#2f6bff'], repeat: ['🗣', '따라 말해 보세요', '#ff2d2d'], tip: ['💡', '알아 두면 좋아요', '#11a36a'] };
function phraseCard(p, i, state, vertical) {
  const [ic, word, col] = STATE[state];
  const n = p.bonus ? '보너스' : `${i + 1} / ${N}`;
  const W = vertical ? 1080 : 1280, H = vertical ? 1920 : 720, s = vertical ? 1.45 : 1;
  const jaSize = Math.round((p.ja.length > 12 ? (p.ja.length > 16 ? 58 : 68) : 92) * s);
  return `<body style="margin:0;width:${W}px;height:${H}px;background:#0a0f1f;color:#fff;font-family:${FONT};position:relative;overflow:hidden">
  <div style="position:absolute;left:0;right:0;top:0;height:${Math.round(84 * s)}px;background:#111a33;display:flex;align-items:center;justify-content:space-between;padding:0 ${Math.round(40 * s)}px;font-size:${Math.round(30 * s)}px;font-weight:800">
    <span>${P.flag} ${esc(P.country)} 식당 회화</span><span style="opacity:.8">${n}</span></div>
  <div style="position:absolute;left:${Math.round(56 * s)}px;right:${Math.round(56 * s)}px;top:${vertical ? 300 : 120}px">
    <div style="display:inline-block;background:#ffe100;color:#111;font-weight:900;font-size:${Math.round(34 * s)}px;padding:${Math.round(6 * s)}px ${Math.round(20 * s)}px;border-radius:12px">${esc(p.label)}</div>
    <div lang="ja" style="font-family:'Noto Sans CJK JP',${FONT};font-weight:900;font-size:${jaSize}px;line-height:1.15;margin-top:${Math.round(28 * s)}px;letter-spacing:-.01em">${esc(p.ja)}</div>
    <div style="font-weight:900;font-size:${Math.round(64 * s)}px;color:#ffe100;margin-top:${Math.round(18 * s)}px;line-height:1.15">${esc(p.pron)}</div>
    <div style="font-weight:700;font-size:${Math.round(44 * s)}px;margin-top:${Math.round(14 * s)}px;opacity:.95">= ${esc(p.ko)}</div>
    ${p.hear && state !== 'repeat' ? `<div style="margin-top:${Math.round(22 * s)}px;font-size:${Math.round(28 * s)}px;background:#1c2748;border-radius:14px;padding:${Math.round(12 * s)}px ${Math.round(18 * s)}px;display:inline-block">👂 직원이 먼저: <span lang="ja" style="font-family:'Noto Sans CJK JP',${FONT}">${esc(p.hear)}</span></div>` : ''}
    ${state === 'tip' && p.tip ? `<div style="margin-top:${Math.round(22 * s)}px;font-size:${Math.round(30 * s)}px;line-height:1.4;background:#0f3b2a;border-left:8px solid #11a36a;border-radius:10px;padding:${Math.round(12 * s)}px ${Math.round(20 * s)}px">${esc(p.tip)}</div>` : ''}
  </div>
  <div style="position:absolute;left:0;right:0;bottom:0;height:${Math.round(96 * s)}px;background:${col};display:flex;align-items:center;justify-content:center;gap:16px;font-size:${Math.round(42 * s)}px;font-weight:900">${ic} ${word}</div>
  ${vertical ? `<div style="position:absolute;left:0;right:0;top:150px;text-align:center;font-size:50px;font-weight:900;padding:0 50px;line-height:1.25">${esc(p.short || p.label)}</div>
  <div style="position:absolute;left:0;right:0;bottom:180px;text-align:center;font-size:40px;font-weight:800;opacity:.85">▶ 전체 ${N}문장은 설명란 링크</div>` : `<div style="position:absolute;right:40px;bottom:112px;font-size:24px;font-weight:800;opacity:.6">▶ ${esc(BRAND)}</div>`}
  </body>`;
}
const titleCard = (c) => `<body style="margin:0;width:1280px;height:720px;background:#0a0f1f;color:#fff;font-family:${FONT};display:flex;flex-direction:column;justify-content:center;padding:0 80px;box-sizing:border-box">
  <div style="font-size:120px;line-height:1">${P.flag}</div>
  <div style="font-size:84px;font-weight:900;line-height:1.1;margin-top:20px;letter-spacing:-.03em">${bold(c.title).replace(/<b>/g, '<b style="color:#ffe100">')}</div>
  ${c.sub ? `<div style="display:inline-block;margin-top:30px;font-size:40px;font-weight:800;background:#ff2d2d;padding:10px 26px;border-radius:14px;align-self:flex-start">${esc(c.sub)}</div>` : ''}
  <div style="position:absolute;left:80px;bottom:40px;font-size:28px;font-weight:800;opacity:.75">▶ ${esc(BRAND)}</div></body>`;
const recapCard = () => `<body style="margin:0;width:1280px;height:720px;background:#0a0f1f;color:#fff;font-family:${FONT};padding:40px 70px;box-sizing:border-box">
  <div style="font-size:52px;font-weight:900">${bold(P.outro.title).replace(/<b>/g, '<b style="color:#ffe100">')}</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 40px;margin-top:26px">${P.phrases.map((p, i) => `<div style="font-size:28px;line-height:1.3"><b style="color:#ffe100">${i + 1}.</b> ${esc(p.pron)} <span style="opacity:.7">· ${esc(p.ko)}</span></div>`).join('')}</div>
  <div style="position:absolute;left:70px;bottom:40px;font-size:30px;font-weight:900;background:#ff2d2d;padding:8px 22px;border-radius:12px">🔔 구독하면 다음 회화도 받아 보세요</div></body>`;

// ---------- comic mode: phrases/art/<id>/p<n>.jpg exist for every phrase (made by upload/comic-art.js) ----------
// Learning design: a picture per situation (dual coding), a "what would you say?" beat before the answer
// (pretesting), the bubble sits right on the picture (contiguity), and a recall round at the end (retrieval practice).
const ART = path.join(ROOT, 'phrases', 'art', P.id);
const artOf = (i) => path.join(ART, `p${i + 1}.jpg`);
const COMIC = !!P.comic && !flag('no-comic') && all.every((_, i) => fs.existsSync(artOf(i)));
const HERO = P.comic?.heroKo || '나';
const img64 = (f) => `data:image/jpeg;base64,${fs.readFileSync(f).toString('base64')}`;
const COMIC_CSS = `<style>
 .bub{position:absolute;background:#fff;color:#111;border:5px solid #111;border-radius:34px;padding:18px 30px;box-shadow:0 8px 0 rgba(0,0,0,.25);max-width:76%}
 .bub:after{content:'';position:absolute;bottom:-34px;width:0;height:0;border:18px solid transparent;border-top:22px solid #111}
 .bub.tl:after{left:70px}.bub.tr:after{right:70px}.bub.tc:after{left:46%}
 .bub.staff{background:#e8f1ff;border-color:#2f6bff;font-size:26px;padding:10px 20px}
 .bub.staff:after{border-top-color:#2f6bff}
 .ja{font-family:'Noto Sans CJK JP',${FONT};font-weight:900;line-height:1.12}
</style>`;
function bubblePos(p, vertical) { const b = p.bubble || 'tl'; const y = vertical ? 30 : 34; return b === 'tr' ? `right:40px;top:${y}px` : b === 'tc' ? `left:20%;top:${y}px` : `left:40px;top:${y}px`; }
function staffPos(p) { return (p.bubble || 'tl') === 'tr' ? 'left:40px;top:40px' : 'right:40px;top:40px'; }
// state: ask (bubble "?") | listen | repeat | tip | quiz (recall round, "?") | answer (recall round)
function comicPanel(p, i, state) {
  const W = 1280, H = 720; const n = p.bonus ? '보너스' : `${i + 1} / ${N}`;
  const hidden = state === 'ask' || state === 'quiz';
  const jaSize = Math.min(70, Math.floor(860 / p.ja.length));   // one line in the bubble
  const bubble = hidden
    ? `<div class="bub ${p.bubble || 'tl'}" style="${bubblePos(p)};font-size:84px;font-weight:900;padding:6px 46px">?</div>`
    : `<div class="bub ${p.bubble || 'tl'}" style="${bubblePos(p)}"><div class="ja" lang="ja" style="font-size:${jaSize}px">${esc(p.ja)}</div><div style="font-size:40px;font-weight:900;color:#e0457b;margin-top:6px">${esc(p.pron)}</div></div>`;
  const staff = p.hear && state !== 'quiz' && state !== 'answer' ? `<div class="bub staff ${(p.bubble || 'tl') === 'tr' ? 'tl' : 'tr'}" style="${staffPos(p)};max-width:42%">👩‍🍳 <span lang="ja" class="ja" style="font-weight:700">${esc(p.hear)}</span></div>` : '';
  const bar = {
    ask: ['#7a3cff', `🤔 ${HERO}는 뭐라고 말할까요?`],
    listen: ['#2f6bff', `🔊 = ${esc(p.ko)}`],
    repeat: ['#ff2d2d', `🗣 따라 말해 보세요 · ${esc(p.ko)}`],
    tip: ['#11a36a', `💡 ${esc(p.tip || '')}`],
    quiz: ['#7a3cff', `⏱ 3초 안에 먼저 말해 보세요 · ${esc(p.label)}`],
    answer: ['#2f6bff', `✅ ${esc(p.pron)} = ${esc(p.ko)}`],
  }[state];
  const long = state === 'tip' && (p.tip || '').length > 34;
  return `${COMIC_CSS}<body style="margin:0;width:${W}px;height:${H}px;font-family:${FONT};position:relative;overflow:hidden;background:#000">
  <img src="${img64(artOf(i))}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
  ${bubble}${staff}
  <div style="position:absolute;left:24px;bottom:${long ? 150 : 118}px;background:#ffe100;color:#111;font-weight:900;font-size:26px;padding:4px 16px;border-radius:10px">${n} · ${esc(p.label)}</div>
  <div style="position:absolute;left:0;right:0;bottom:0;min-height:100px;background:${bar[0]};color:#fff;display:flex;align-items:center;padding:10px 34px;box-sizing:border-box;font-weight:900;font-size:${long ? 30 : 40}px;line-height:1.3">${bar[1]}</div>
  </body>`;
}
// all panels on one page: the "hook" at the start (bubbles empty) and the recap at the end (filled)
function comicPage(filled, title) {
  const n = all.length, cols = n <= 4 ? 2 : n <= 9 ? 3 : 4, rows = Math.ceil(n / cols);
  const ch = Math.floor((720 - 96 - 16 - (rows - 1) * 12) / rows), cw = Math.min(Math.floor(ch * 16 / 9), Math.floor((1240 - (cols - 1) * 12) / cols));
  const cells = all.map((p, i) => `<div style="position:relative;width:${cw}px;height:${Math.round(cw * 9 / 16)}px;border:4px solid #fff;border-radius:10px;overflow:hidden;box-sizing:border-box">
    <img src="${img64(artOf(i))}" style="width:100%;height:100%;object-fit:cover">
    <div style="position:absolute;left:6px;top:6px;background:#ffe100;color:#111;font-weight:900;font-size:20px;padding:0 9px;border-radius:7px">${p.bonus ? '+' : i + 1}</div>
    <div style="position:absolute;left:8px;right:8px;bottom:6px;background:rgba(255,255,255,.94);color:#111;border:3px solid #111;border-radius:14px;padding:2px 10px;font-weight:900;font-size:${filled ? 20 : 26}px;text-align:center">${filled ? esc(p.pron) : '?'}</div></div>`).join('');
  return `<body style="margin:0;width:1280px;height:720px;background:#0a0f1f;color:#fff;font-family:${FONT};position:relative">
  <div style="height:96px;display:flex;align-items:center;justify-content:center;font-size:44px;font-weight:900">${bold(title).replace(/<b>/g, '<b style="color:#ffe100">')}</div>
  <div style="display:grid;grid-template-columns:repeat(${cols},${cw}px);gap:12px;justify-content:center">${cells}</div></body>`;
}
// vertical Short: the panel on top, a quiz beat, then the answer below it
function comicShort(p, i, state) {
  const hidden = state === 'ask';
  const bar = { ask: ['#7a3cff', '🤔 뭐라고 말할까요?'], listen: ['#2f6bff', '🔊 들어 보세요'], repeat: ['#ff2d2d', '🗣 따라 말해 보세요'] }[state];
  return `${COMIC_CSS}<body style="margin:0;width:1080px;height:1920px;background:#0a0f1f;color:#fff;font-family:${FONT};position:relative;overflow:hidden">
  <div style="position:absolute;left:0;right:0;top:150px;text-align:center;font-size:58px;font-weight:900;padding:0 50px;line-height:1.25">${esc(p.short || p.label)}</div>
  <div style="position:absolute;left:0;top:420px;width:1080px;height:608px"><img src="${img64(artOf(i))}" style="width:100%;height:100%;object-fit:cover">
    ${hidden ? `<div class="bub ${p.bubble || 'tl'}" style="${bubblePos(p, true)};font-size:90px;font-weight:900;padding:4px 48px">?</div>` : ''}</div>
  <div style="position:absolute;left:60px;right:60px;top:1090px;text-align:center">
    ${hidden ? `<div style="font-size:64px;font-weight:900;color:#ffe100">${esc(p.ko)}</div><div style="font-size:46px;font-weight:800;opacity:.85;margin-top:20px">일본어로?</div>`
      : `<div class="ja" lang="ja" style="font-size:${p.ja.length > 12 ? 70 : 92}px">${esc(p.ja)}</div><div style="font-size:74px;font-weight:900;color:#ffe100;margin-top:18px">${esc(p.pron)}</div><div style="font-size:50px;font-weight:700;margin-top:14px">= ${esc(p.ko)}</div>`}
  </div>
  <div style="position:absolute;left:0;right:0;bottom:300px;height:120px;background:${bar[0]};display:flex;align-items:center;justify-content:center;font-size:54px;font-weight:900">${bar[1]}</div>
  <div style="position:absolute;left:0;right:0;bottom:180px;text-align:center;font-size:40px;font-weight:800;opacity:.85">▶ 전체 만화 회화는 설명란 링크</div></body>`;
}

(async () => {
  // checks before building
  const problems = [];
  for (const [i, p] of all.entries()) for (const k of ['label', 'ja', 'pron', 'ko', 'when']) if (!p[k]) problems.push(`phrase ${i + 1}: "${k}" is empty`);
  if (!P.checkedOn) problems.push('checkedOn is missing');
  if (problems.length) { console.log('QA FAIL (before build)\n' + problems.map((x) => '  ✖ ' + x).join('\n')); process.exit(1); }

  const CM = P.comic || {};
  const shortHook = (p) => (COMIC ? `${p.short}. ${p.ko}, 일본어로 뭐라고 할까요?` : `${p.short}. ${p.ko}는 이렇게 말해요.`), shortEnd = `전체 ${N}문장은 아래 링크에서 보세요.`;
  const introSay = COMIC && CM.introSay ? CM.introSay : P.intro.say, outroSay = COMIC && CM.outroSay ? CM.outroSay : P.outro.say;
  const recallSay = CM.recallSay || '이제 기억 테스트예요. 그림을 보고 먼저 말해 보세요. 정답은 3초 뒤에 나와요.';
  console.log(`  layout: ${COMIC ? 'comic (' + all.length + ' panels)' : 'cards'}`);
  await prepareKo([introSay, outroSay, ...(COMIC ? [recallSay] : []), P.intro.say, ...all.flatMap((p) => [p.when, p.tip]), P.outro.say, ...(flag('no-shorts') ? [] : P.phrases.filter((p) => p.short).flatMap((p) => [shortHook(p), shortEnd]))]);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const render = async (html, w, h) => { const o = tmp('png'); await page.setViewportSize({ width: w, height: h }); await page.setContent(`<!doctype html><meta charset="utf-8">${html}`); await page.evaluate(() => document.fonts.ready); await page.screenshot({ path: o }); return o; };

  // ---------- main video timeline: [{img, wav}] ----------
  const tl = []; const chapters = []; const at = () => tl.reduce((a, x) => a + dur(x.wav), 0);
  const push = (img, w) => tl.push({ img, wav: w });
  const intro = await render(COMIC ? comicPage(false, CM.pageTitle || P.intro.title.replace(/\n/g, ' ')) : titleCard(P.intro), 1280, 720);
  chapters.push({ t: 0, label: '시작' }); push(intro, await ko(introSay)); push(intro, silence(0.4));
  let firstCard = null;
  for (const [i, p] of all.entries()) {
    const lab = p.bonus ? `보너스 · ${p.label}` : `${i + 1}. ${p.label}`;
    if (i === 0) chapters[0].label = lab; else chapters.push({ t: at(), label: lab });   // the short intro belongs to the first chapter
    if (COMIC) {
      const Q = await render(comicPanel(p, i, 'ask'), 1280, 720), L = await render(comicPanel(p, i, 'listen'), 1280, 720), R = await render(comicPanel(p, i, 'repeat'), 1280, 720);
      firstCard = firstCard || L;
      push(Q, await ko(p.when)); push(Q, silence(1.6));   // a moment to guess before the answer
      push(L, await target(p.ja)); push(L, silence(0.7)); push(L, await target(p.ja, true));
      push(R, silence(2.6));
      if (p.tip) { const T = await render(comicPanel(p, i, 'tip'), 1280, 720); push(T, await ko(p.tip)); push(T, silence(0.5)); } else push(R, silence(0.4));
      continue;
    }
    const L = await render(phraseCard(p, i, 'listen'), 1280, 720), R = await render(phraseCard(p, i, 'repeat'), 1280, 720);
    firstCard = firstCard || L;
    push(L, await ko(p.when)); push(L, silence(0.35)); push(L, await target(p.ja)); push(L, silence(0.7)); push(L, await target(p.ja, true));
    push(R, silence(2.6));
    if (p.tip) { const T = await render(phraseCard(p, i, 'tip'), 1280, 720); push(T, await ko(p.tip)); push(T, silence(0.5)); } else push(R, silence(0.4));
  }
  if (COMIC) {   // recall round: picture first, 3 seconds to say it, then the answer once
    chapters.push({ t: at(), label: '기억 테스트' });
    const start = await render(comicPage(false, CM.recallTitle || '기억 테스트: **먼저 말해 보세요**'), 1280, 720);
    push(start, await ko(recallSay)); push(start, silence(0.5));
    for (const [i, p] of all.entries()) {
      push(await render(comicPanel(p, i, 'quiz'), 1280, 720), silence(3.0));
      const A = await render(comicPanel(p, i, 'answer'), 1280, 720); push(A, await target(p.ja)); push(A, silence(0.9));
    }
  }
  const recap = await render(COMIC ? comicPage(true, P.outro.title) : recapCard(), 1280, 720);
  chapters.push({ t: at(), label: '정리' }); push(recap, await ko(outroSay)); push(recap, silence(1.5));

  async function build(items, outFile, musicKey) {
    const aList = tmp('txt'), vList = tmp('txt');
    fs.writeFileSync(aList, items.map((x) => `file '${x.wav}'`).join('\n'));
    const ds = items.map((x) => dur(x.wav));
    fs.writeFileSync(vList, items.map((x, i) => `file '${x.img}'\nduration ${ds[i].toFixed(3)}`).join('\n') + `\nfile '${items[items.length - 1].img}'`);
    const voice = tmp('wav'); sh(`ffmpeg -y -loglevel error -f concat -safe 0 -i "${aList}" -c:a pcm_s16le "${voice}"`);
    const total = dur(voice); const raw = tmp('mp4');
    sh(`ffmpeg -y -loglevel error -f concat -safe 0 -i "${vList}" -i "${voice}" -vf "fps=30,format=yuv420p" -c:v libx264 -preset veryfast -tune stillimage -crf 20 -c:a aac -b:a 160k -ar 44100 -ac 2 -t ${total.toFixed(3)} "${raw}"`);
    const bgm = pickBgm(cfg.bgm, musicKey, ROOT);
    if (bgm) sh(`ffmpeg -y -loglevel error -i "${raw}" -stream_loop -1 -i "${bgm}" -filter_complex "[0:a]asplit=2[v1][sc];[1:a]volume=${((cfg.bgmVolume || 0.14) * 0.7).toFixed(3)},afade=t=in:d=2,afade=t=out:st=${Math.max(0, total - 3).toFixed(2)}:d=3[bg];[bg][sc]sidechaincompress=threshold=0.015:ratio=6:attack=30:release=600[bgd];[v1][bgd]amix=inputs=2:duration=first:normalize=0[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 160k -t ${total.toFixed(3)} "${outFile}"`);
    else fs.copyFileSync(raw, outFile);
    return { sum: ds.reduce((a, b) => a + b, 0), voice: total, video: dur(outFile) };
  }

  const main = path.join(OUT, `${P.id}.mp4`);
  const m = await build(tl, main, P.id);
  // QA: picture and voice line up, every phrase was actually spoken, sensible length
  const qaP = [];
  if (Math.abs(m.sum - m.voice) > 0.15) qaP.push(`audio parts add up to ${m.sum.toFixed(2)} s but the joined voice is ${m.voice.toFixed(2)} s`);
  if (Math.abs(m.video - m.voice) > 0.3) qaP.push(`video ${m.video.toFixed(2)} s vs voice ${m.voice.toFixed(2)} s`);
  for (const p of all) if (dur(jaCache[p.ja]) < 0.4) qaP.push(`"${p.ja}" audio is too short (${dur(jaCache[p.ja]).toFixed(2)} s)`);
  if (m.video < 90) qaP.push(`video is only ${Math.round(m.video)} s`);
  for (let i = 1; i < chapters.length; i++) if (chapters[i].t - chapters[i - 1].t < 10) qaP.push(`chapter "${chapters[i - 1].label}" is shorter than 10 s (YouTube ignores chapters then)`);
  const qa = { ok: !qaP.length, problems: qaP, seconds: Math.round(m.video), phrases: all.length, voiceFallback: fellBack };
  fs.writeFileSync(path.join(OUT, `${P.id}.qa.json`), JSON.stringify(qa, null, 1));
  console.log(`QA ${qa.ok ? 'PASS' : 'FAIL'} — ${all.length} phrases, ${Math.round(m.video)} s`); qaP.forEach((x) => console.log('  ✖ ' + x));

  // thumbnail
  let thumb = null;
  try { const { thumbnail } = require('./thumbnail'); thumb = await thumbnail({ flag: P.flag, lang: 'ko', year: P.checkedOn.slice(0, 4), shot: firstCard, lines: P.thumb, brand: '따라하면 끝' }, path.join(OUT, `${P.id}.png`)); } catch (e) { console.log('  thumbnail skipped:', e.message.split('\n')[0]); }

  // Shorts: one phrase each, vertical
  const shorts = [];
  if (!flag('no-shorts')) for (const [i, p] of P.phrases.entries()) {
    if (!p.short) continue;
    const L = await render(COMIC ? comicShort(p, i, 'listen') : phraseCard(p, i, 'listen', true), 1080, 1920), R = await render(COMIC ? comicShort(p, i, 'repeat') : phraseCard(p, i, 'repeat', true), 1080, 1920);
    const items = [];
    if (COMIC) {   // quiz Short: question with the picture → 1.8 s to guess → answer, slow, repeat, answer again
      const Q = await render(comicShort(p, i, 'ask'), 1080, 1920);
      items.push({ img: Q, wav: await ko(shortHook(p)) }, { img: Q, wav: silence(1.8) }, { img: L, wav: await target(p.ja) }, { img: L, wav: silence(0.6) }, { img: L, wav: await target(p.ja, true) },
        { img: R, wav: silence(2.4) }, { img: R, wav: await target(p.ja) }, { img: R, wav: silence(0.6) }, { img: L, wav: await ko(shortEnd) }, { img: L, wav: silence(0.8) });
    }
    else items.push(...[{ img: L, wav: await ko(shortHook(p)) }, { img: L, wav: silence(0.3) }, { img: L, wav: await target(p.ja) }, { img: L, wav: silence(0.6) }, { img: L, wav: await target(p.ja, true) },
      { img: R, wav: silence(2.4) }, { img: R, wav: await target(p.ja) }, { img: R, wav: silence(0.6) }, { img: L, wav: await ko(shortEnd) }, { img: L, wav: silence(0.8) }]);
    const f = path.join(OUT, `${P.id}.short${i + 1}.mp4`); const r = await build(items, f, `${P.id}-s${i}`);
    if (r.video > 59) { console.log(`  ✖ short ${i + 1} is ${Math.round(r.video)} s — skipped`); continue; }
    shorts.push({ file: f, p, seconds: Math.round(r.video) }); console.log(`  short ${i + 1}: ${Math.round(r.video)} s`);
  }
  await browser.close();
  fs.rmSync(TMP, { recursive: true, force: true });
  console.log(`✔ ${main}`);

  // ---------- metadata + upload (PRIVATE; publishing needs the owner's OK) ----------
  const { subLine } = require('./metadata');
  const aff = cfg.affiliate?.default?.[P.country] || cfg.affiliate?.fallback || {};
  const description = [
    P.lead, '',
    '🗣 오늘의 문장 (한글 발음)',
    ...P.phrases.map((p, i) => `${i + 1}. ${p.ja}  ${p.pron} — ${p.ko}`),
    ...(P.bonus ? [`+ ${P.bonus.ja}  ${P.bonus.pron} — ${P.bonus.ko}`] : []), '',
    ...(aff.esim || aff.tour ? ['※ 아래 링크로 구매하시면 채널에 수수료가 지급될 수 있습니다. 가격은 동일합니다.', ...(aff.esim ? [`📱 eSIM: ${aff.esim}`] : []), ...(aff.tour ? [`🎟 투어·입장권: ${aff.tour}`] : []), ''] : []),
    '⏱ 구간', ...chapters.map((c) => `${mmss(c.t)} ${c.label}`), '',
    '💬 이런 상황엔 뭐라고 해요? 궁금한 표현을 댓글로 남겨 주시면 답해 드려요.',
    subLine(cfg, P.channel, 'ko'),
    '🎙 내레이션과 현지어 발음은 AI 음성입니다. 문장은 일반적인 여행 회화 표현으로 확인했습니다.', '',
    P.hashtags.map((h) => `#${h}`).join(' '),
  ].filter((x) => x !== null).join('\n').slice(0, 4900);
  fs.writeFileSync(path.join(OUT, `${P.id}.description.txt`), description);
  if (!flag('upload')) return;
  if (!qa.ok) { console.log('not uploading: QA failed'); process.exit(1); }
  const { upload } = require('./upload');
  const guard = { expectChannel: cfg.channelIds?.[P.channel] || null };
  // scheduled (daily production) or private (one-off, owner reviews first)
  const sched = flag('next') && DATE;
  let pubAt = null;
  if (sched) {
    const { localToIso } = require('./metadata'); const win = cfg.publishWindow?.ko || cfg.publishWindow?.default || { from: 6, to: 10 };
    const seed = [...`${DATE}|phrases|${P.id}`].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7); const mod = win.from * 60 + (seed % ((win.to - win.from) * 60));
    pubAt = Date.parse(localToIso(DATE, Math.floor(mod / 60), cfg.timezone?.ko || 'Asia/Seoul', mod % 60)); pubAt = Math.max(pubAt, Date.now() + 30 * 60000);
  }
  const opts = (k) => (sched ? { review: false, ...guard } : { review: true, ...guard });
  const when = (k) => (sched ? { publishAt: new Date(pubAt + k * 90 * 60000).toISOString() } : {});
  const up = await upload(P.channel, { title: (COMIC && CM.title ? CM.title : P.title).slice(0, 100), description, tags: P.tags, categoryId: '19', defaultLanguage: 'ko', ...when(0) }, main, thumb, opts(0));
  BUDGET--; console.log(`✔ main (${sched ? 'scheduled ' + new Date(pubAt).toISOString() : 'private'}) ${up.url}`);
  const res = { main: up.url, shorts: [] };
  if (sched && /youtu\.be\//.test(up.url)) { produced[`phrases:${P.id}`] = { date: DATE, url: up.url }; fs.writeFileSync(PRODUCED, JSON.stringify(produced, null, 1)); }
  for (const [k, s] of shorts.entries()) {
    if (BUDGET < 1) { console.log(`  ⏭ short ${s.p.label}: no upload budget left today`); continue; }
    const t = `${s.p.short} | ${s.p.pron} #Shorts`.slice(0, 100);
    const d = [`▶ 전체 ${N}문장 영상: ${up.url}`, '', `${s.p.ja}  ${s.p.pron} — ${s.p.ko}`, '', subLine(cfg, P.channel, 'ko'), '', P.hashtags.map((h) => `#${h}`).join(' ')].filter(Boolean).join('\n');
    const u = await upload(P.channel, { title: t, description: d, tags: P.tags, categoryId: '19', defaultLanguage: 'ko', ...when(k + 1) }, s.file, null, opts(k + 1));
    BUDGET--; console.log(`✔ short (${sched ? 'scheduled' : 'private'}) ${u.url}  ${t}`); res.shorts.push(u.url);
    if (sched && /youtu\.be\//.test(u.url)) {   // remember Short → main so the Mac helper can set the related-video link
      const SH = path.join(ROOT, 'plan', 'shorts.json'); const map = fs.existsSync(SH) ? JSON.parse(fs.readFileSync(SH, 'utf8')) : {};
      map[u.url.split('youtu.be/')[1]] = { main: up.url.split('youtu.be/')[1], channel: P.channel, lang: 'ko', form: `phrases:${P.id}`, date: DATE }; fs.writeFileSync(SH, JSON.stringify(map, null, 1));
    }
  }
  fs.writeFileSync(path.join(OUT, `${P.id}.upload.json`), JSON.stringify(res, null, 1));
})().catch((e) => { console.error(e.stderr?.toString?.() || e); process.exit(1); });
