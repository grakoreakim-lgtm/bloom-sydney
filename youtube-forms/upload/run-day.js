#!/usr/bin/env node
// One command = one day of the calendar: record → narrate → mux → thumbnail → metadata → scheduled upload.
//
//   node upload/run-day.js                      # today's rows (calendar date = today)
//   node upload/run-day.js --date 2027-01-12    # a specific day
//   node upload/run-day.js --date 2027-01-12 --dry        # build everything, upload nothing
//   node upload/run-day.js --date 2027-01-12 --dry --fake-tts   # also skip the TTS API (silent clips) — pipeline test
//   node upload/run-day.js --row 3              # only slot 3 of that day
//   node upload/run-day.js --date 2027-01-12 --plan   # just print what that day would produce
//   node upload/run-day.js --config upload/config.ci.json --target live   # CI: committed config, real sites
//
// Rows whose 서식 has no definition in forms/ are listed and skipped (add forms/<id>.js first).

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Recorder } = require('../lib/recorder');
const { narrate } = require('./narration');
const { mux, pickBgm } = require('./mux');
const { thumbnail } = require('./thumbnail');
const { buildMetadata } = require('./metadata');
const { upload } = require('./upload');
const { makeShort } = require('./shorts');
const { qa } = require('./qa');

const ROOT = path.join(__dirname, '..');
const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : null; };
const flag = (k) => argv.includes(`--${k}`);
const cfgPath = opt('config') || (fs.existsSync(path.join(__dirname, 'config.json')) ? path.join(__dirname, 'config.json') : path.join(__dirname, 'config.example.json'));
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
if (opt('target')) cfg.target = opt('target');
const date = opt('date') || new Date().toISOString().slice(0, 10);
const onlyRow = opt('row') ? Number(opt('row')) : null;
const dry = flag('dry'), fakeTts = flag('fake-tts'), review = flag('review'), publishNow = flag('now'), noShorts = flag('no-shorts');
const minSlots = Number(opt('slots') || 0);   // --slots 4: top the day up to 4 videos from the backlog   // --review: upload private, no auto-publish

// calendar CSV → rows for the day
function readCsv(file) {
  const [head, ...lines] = fs.readFileSync(file, 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter(Boolean);
  const cols = parse(head);
  return lines.map((l) => Object.fromEntries(parse(l).map((v, i) => [cols[i], v])));
}
function parse(line) {  // minimal CSV parser (quotes + commas)
  const out = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true; else if (c === ',') { out.push(cur); cur = ''; } else cur += c;
  }
  out.push(cur); return out;
}

// 서식/주제 → forms/<id>.js   (extend as you add form definitions)
const FORM_MAP = cfg.formMap || { 'MDAC 디지털 입국카드': 'mdac' };
// channel guard options for upload(): expected channel id per token, and "must not be another token's channel"
function guardFor(chKey) {
  const ids = cfg.channelIds || {};
  return { expectChannel: ids[chKey] || null, forbidChannel: ids[chKey] ? null : Object.entries(ids).filter(([k]) => k !== chKey).map(([, v]) => v)[0] || null };
}

// produced.json: which form+language videos are already on YouTube (committed back by the workflow).
// Calendar rows whose form has no definition yet are filled with the next not-yet-produced video instead,
// so every slot of the day is used; a row whose video was already produced (pulled forward) is skipped.
const PRODUCED = path.join(ROOT, 'plan', 'produced.json');
const produced = fs.existsSync(PRODUCED) ? JSON.parse(fs.readFileSync(PRODUCED, 'utf8')) : {};
const comboOf = (r) => `${FORM_MAP[r['서식/주제']]}:${r['언어'].toLowerCase()}`;

function planDay(all, date) {
  const day = all.filter((r) => r['날짜'] === date);
  const taken = new Set(Object.keys(produced));
  const backlog = [];   // defined form+language combos not produced yet, in calendar order
  for (const r of all) {
    if (!FORM_MAP[r['서식/주제']] || !r['유형'].startsWith('본편')) continue;
    const c = comboOf(r); if (taken.has(c) || backlog.some((b) => b.c === c)) continue;
    const form = require(path.join(ROOT, 'forms', `${FORM_MAP[r['서식/주제']]}.js`));
    if (form.strings[r['언어'].toLowerCase()]) backlog.push({ c, row: r });
  }
  // topics that are not in the calendar (e.g. the "after you arrive" series) go to the front of the backlog
  const extras = [];
  for (const x of cfg.extraTopics || []) {
    if (!fs.existsSync(path.join(ROOT, 'forms', `${x.form}.js`))) continue;
    FORM_MAP[x.topic] = x.form;
    const form = require(path.join(ROOT, 'forms', `${x.form}.js`));
    for (const lang of x.langs || ['ko', 'en']) {
      const c = `${x.form}:${lang}`;
      if (taken.has(c) || !form.strings[lang]) continue;
      extras.push({ c, row: { '유형': '본편(5-8분)', '등급': 'S', '국가': x.country, '서식/주제': x.topic, '언어': lang.toUpperCase(), '제목(초안)': (form.videoTitle?.[lang] || form.title?.[lang] || x.topic).replace('{year}', date.slice(0, 4)), '공식 URL(설명란 1줄)': '', '비용': lang === 'ko' ? (form.fee || '-') : '-', '제출 시점·유효': lang === 'ko' ? (form.when || '-') : '-' } });
    }
  }
  backlog.unshift(...extras);
  const out = [];
  for (const r of day) {
    if (FORM_MAP[r['서식/주제']] && r['유형'].startsWith('본편')) {
      const c = comboOf(r);
      if (taken.has(c)) { console.log(`  ⏭ [${r['슬롯']}] ${c} already produced`); continue; }
      taken.add(c); out.push(r); continue;
    }
    if (!cfg.fillEmptySlots) { out.push(r); continue; }
    const next = backlog.find((b) => !taken.has(b.c));
    if (!next) { out.push(r); continue; }
    taken.add(next.c);
    console.log(`  ↪ [${r['슬롯']}] ${r['서식/주제']} (${r['언어']}) not defined yet → ${next.c}`);
    out.push({ ...next.row, '날짜': r['날짜'], '슬롯': r['슬롯'], '_filled': true });
  }
  // top up to --slots with the next not-yet-produced videos
  for (const b of backlog) {
    if (out.length >= minSlots) break;
    if (taken.has(b.c)) continue;
    taken.add(b.c);
    console.log(`  ＋ extra slot → ${b.c}`);
    out.push({ ...b.row, '날짜': date, '슬롯': String(out.length + 1), '_filled': true });
  }
  return out;
}

(async () => {
  const all = readCsv(path.join(ROOT, 'plan', cfg.calendar || 'upload-calendar-2027.csv'));
  // --forms sgac,mdac : produce just these forms' pending videos (e.g. a re-recording), ignoring the calendar
  const onlyForms = opt('forms') ? opt('forms').split(',') : null;
  if (onlyForms) {
    const pend = [];
    for (const f of onlyForms) for (const l of ['ko', 'en']) {
      if (produced[`${f}:${l}`]) continue;
      const r = all.find((x) => FORM_MAP[x['서식/주제']] === f && x['언어'].toLowerCase() === l && x['유형'].startsWith('본편'));
      if (r) pend.push({ ...r, '날짜': date, '슬롯': String(pend.length + 1), '_filled': true });
    }
    all.splice(0, all.length); pend.forEach((r) => all.push(r));
  }
  const cap = Math.max(minSlots, cfg.maxVideosPerDay || 99);
  const rows = (onlyForms ? all : planDay(all, date)).filter((r) => !onlyRow || Number(r['슬롯']) === onlyRow).slice(0, cap);
  if (flag('plan')) { rows.forEach((r) => console.log(`  ${r['슬롯']}. ${r['서식/주제']} · ${r['언어']}${r._filled ? '  (filled)' : ''}`)); return; }   // --plan: show the day, do nothing
  if (!rows.length) { console.log(`no calendar rows for ${date}`); return; }
  console.log(`▶ ${date}: ${rows.length} slot(s)${dry ? '  [DRY RUN]' : ''}`);
  const dayDir = path.join(ROOT, 'out', 'days', date); fs.mkdirSync(dayDir, { recursive: true });
  const log = [];
  const shortsQueue = [];   // made after all main videos, within the daily upload budget
  const budget = cfg.uploadsPerDay || 6;   // YouTube API default quota ≈ 6 uploads/day per project
  let uploads = 0;

  for (const row of rows) {
    const lang = row['언어'].toLowerCase(); const kind = row['유형']; const formId = FORM_MAP[row['서식/주제']];
    const tag = `[${row['슬롯']}] ${row['유형']} · ${row['국가']} · ${row['서식/주제']} · ${row['언어']}`;
    if (!formId) { console.log(`  ⏭ ${tag} — forms/ 에 정의 없음 (FORM_MAP 에 추가 필요)`); log.push({ row, status: 'skipped: no form' }); continue; }
    if (!kind.startsWith('본편')) { console.log(`  ⏭ ${tag} — ${kind} 은 아직 자동화 대상 아님(본편만)`); log.push({ row, status: 'skipped: kind' }); continue; }
    const form = require(path.join(ROOT, 'forms', `${formId}.js`));
    if (!form.strings[lang]) { console.log(`  ⏭ ${tag} — forms/${formId}.js 에 ${lang} 텍스트 없음`); log.push({ row, status: 'skipped: lang' }); continue; }
    console.log(`  ● ${tag}`);
    const base = path.join(dayDir, `${row['슬롯']}-${formId}-${lang}`);
    try {
      // 1) narration first, so the recorder can hold each cue for the clip length
      const target = (cfg.liveForms || []).includes(formId) ? 'live' : (cfg.target || 'mock');   // real site where mapped
      let clips;
      try { clips = await narrate(form, lang, path.join(ROOT, 'out', 'tts-cache'), { dryRun: fakeTts, voices: cfg.tts?.voices, speakingRate: cfg.tts?.speakingRate, target }); }
      catch (e) {   // e.g. no GEMINI_API_KEY yet → fall back to the Google voice so the day still ships
        if (!cfg.tts?.fallback?.[lang]) throw e;
        console.warn(`    voice fallback (${e.message.slice(0, 120)})`);
        console.log(`VOICE_FALLBACK ${formId}:${lang} — ${e.message.replace(/\s+/g, ' ').slice(0, 160)}`);   // picked up by the workflow → notification
        clips = await narrate(form, lang, path.join(ROOT, 'out', 'tts-cache'), { dryRun: fakeTts, voices: cfg.tts.fallback, speakingRate: cfg.tts?.speakingRate, target });
      }
      const narration = Object.fromEntries(Object.entries(clips).map(([k, v]) => [k, v.durationMs]));
      // 2) record
      const rec = new Recorder(form, { target, lang, outDir: path.join(dayDir, `rec-${row['슬롯']}`), narration });
      const r = await rec.run();
      // 3) mux
      const final = mux(r.mp4, r.timeline.cues, clips, `${base}.mp4`, { bgm: pickBgm(cfg.bgm, `${formId}-${lang}`, ROOT), bgmVolume: cfg.bgmVolume || 0.14 });
      // 3b) QA (검수): narration ↔ screen sync and on-screen values. A failing video is uploaded PRIVATE for review.
      const check = qa(r.timeline, clips, final);
      fs.writeFileSync(`${base}.qa.json`, JSON.stringify(check, null, 1));
      console.log(`    QA ${check.summary}`);
      check.problems.slice(0, 12).forEach((p) => console.log(`      ✖ ${p}`));
      // 4) thumbnail (uses the first field screenshot as the backdrop)
      const shot = r.shots.find((s) => /step1-/.test(s)) || r.shots[1];
      const flagEmoji = (row['국가'].match(/^\S+/) || [''])[0];
      // thumbnail text in the video's language (calendar columns are Korean)
      const thumbCountry = form.country?.[lang] || (lang === 'ko' ? row['국가'].replace(/^\S+\s/, '') : form.country?.en || '');
      const thumbForm = form.title?.[lang] || (lang === 'ko' ? row['서식/주제'] : form.title?.en || row['서식/주제']);
      const thumb = await thumbnail({ flag: flagEmoji, country: thumbCountry, form: thumbForm, lang, year: date.slice(0, 4), shot }, `${base}.png`);
      // 5) metadata
      const affSet = cfg.affiliate?.[lang] || cfg.affiliate?.default || {};
      const aff = affSet[cfg.affiliateByForm?.[formId]] || affSet[row['국가'].replace(/^\S+\s/, '')] || cfg.affiliate?.fallback || {};
      const meta = buildMetadata(row, form, r.timeline, aff, cfg);
      fs.writeFileSync(`${base}.meta.json`, JSON.stringify(meta, null, 1));
      // 6) upload (private + publishAt)
      const hold = review || !check.ok;   // never auto-publish a video that failed QA
      const up = await upload(cfg.channels?.[lang] || lang, meta, final, thumb, { dryRun: dry, review: hold, publishNow: publishNow && !hold, ...guardFor(cfg.channels?.[lang] || lang) });
      if (!up.duplicate && !dry) uploads++;
      console.log(`    ✔ ${up.url}  ${!check.ok ? 'PRIVATE — QA failed, needs a fix' : review ? 'PRIVATE (review — publish in YouTube Studio)' : publishNow ? 'PUBLIC now' : 'publishAt=' + meta.publishAt}`);
      log.push({ row, status: check.ok ? 'ok' : 'qa-failed', qa: check, video: final, url: up.url, publishAt: meta.publishAt });
      if (!dry && !hold && /youtu\.be/.test(up.url)) { produced[`${formId}:${lang}`] = { date, url: up.url }; fs.writeFileSync(PRODUCED, JSON.stringify(produced, null, 1) + '\n'); }
      if (cfg.shorts?.enabled && !noShorts && check.ok) shortsQueue.push({ row, lang, form, formId, base, final, cues: r.timeline.cues, mainUrl: up.url, meta });
    } catch (e) {
      console.error(`    ✖ ${e.message}`); log.push({ row, status: 'error: ' + e.message });
    }
  }
  // Shorts: the "common mistakes" moments of each main video, vertical, linking back to it
  for (const j of shortsQueue) {
    if (!dry && uploads >= budget) { console.log(`  ⏭ Shorts for ${j.formId}-${j.lang}: daily upload budget (${budget}) used`); continue; }
    try {
      const short = makeShort(j.final, j.cues, { lang: j.lang, short: j.form.shortTitle?.[j.lang] || j.form.country?.[j.lang], country: j.form.country?.[j.lang] || '', form: j.form.shortTitle?.[j.lang] || j.form.title?.[j.lang] || j.formId }, `${j.base}.short.mp4`);
      if (!short) { console.log(`  ⏭ Shorts for ${j.formId}-${j.lang}: no mistake moments`); continue; }
      const full = j.lang === 'ko' ? '▶ 전체 따라하기 영상' : '▶ Full step-by-step video';
      const meta = {
        title: short.title,
        description: [`${full}: ${j.mainUrl}`, '', j.meta.description.split('\n')[0], '', j.meta.description.split('\n').filter((l) => l.startsWith('#')).pop() || ''].join('\n'),
        tags: j.meta.tags, categoryId: j.meta.categoryId, defaultLanguage: j.lang,
        publishAt: new Date(Date.parse(j.meta.publishAt) + 90 * 60 * 1000).toISOString(),   // 1.5 h after the main video
      };
      const up = await upload(cfg.channels?.[j.lang] || j.lang, meta, short.file, null, { dryRun: dry, review, publishNow, ...guardFor(cfg.channels?.[j.lang] || j.lang) });
      if (!up.duplicate && !dry) uploads++;
      console.log(`  ✔ Shorts ${short.seconds}s ${up.url}`);
      log.push({ row: j.row, status: 'ok', kind: 'short', video: short.file, url: up.url, publishAt: meta.publishAt });
    } catch (e) { console.error(`  ✖ Shorts ${j.formId}-${j.lang}: ${e.message}`); log.push({ row: j.row, status: 'error (short): ' + e.message }); }
  }
  fs.writeFileSync(path.join(dayDir, 'log.json'), JSON.stringify(log, null, 1));
  const okMain = log.filter((l) => l.status === 'ok' && l.kind !== 'short').length, okShort = log.filter((l) => l.kind === 'short' && l.status === 'ok').length;
  console.log(`done — ${okMain}/${rows.length} videos + ${okShort} Shorts, log: ${path.join(dayDir, 'log.json')}`);
})().catch((e) => { console.error(e); process.exit(1); });
