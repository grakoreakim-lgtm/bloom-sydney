#!/usr/bin/env node
// One command = one day of the calendar: record → narrate → mux → thumbnail → metadata → scheduled upload.
//
//   node upload/run-day.js                      # today's rows (calendar date = today)
//   node upload/run-day.js --date 2027-01-12    # a specific day
//   node upload/run-day.js --date 2027-01-12 --dry        # build everything, upload nothing
//   node upload/run-day.js --date 2027-01-12 --dry --fake-tts   # also skip the TTS API (silent clips) — pipeline test
//   node upload/run-day.js --row 3              # only slot 3 of that day
//   node upload/run-day.js --config upload/config.ci.json --target live   # CI: committed config, real sites
//
// Rows whose 서식 has no definition in forms/ are listed and skipped (add forms/<id>.js first).

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Recorder } = require('../lib/recorder');
const { narrate } = require('./narration');
const { mux } = require('./mux');
const { thumbnail } = require('./thumbnail');
const { buildMetadata } = require('./metadata');
const { upload } = require('./upload');

const ROOT = path.join(__dirname, '..');
const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : null; };
const flag = (k) => argv.includes(`--${k}`);
const cfgPath = opt('config') || (fs.existsSync(path.join(__dirname, 'config.json')) ? path.join(__dirname, 'config.json') : path.join(__dirname, 'config.example.json'));
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
if (opt('target')) cfg.target = opt('target');
const date = opt('date') || new Date().toISOString().slice(0, 10);
const onlyRow = opt('row') ? Number(opt('row')) : null;
const dry = flag('dry'), fakeTts = flag('fake-tts');

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

(async () => {
  const rows = readCsv(path.join(ROOT, 'plan', cfg.calendar || 'upload-calendar-2027.csv')).filter((r) => r['날짜'] === date && (!onlyRow || Number(r['슬롯']) === onlyRow));
  if (!rows.length) { console.log(`no calendar rows for ${date}`); return; }
  console.log(`▶ ${date}: ${rows.length} slot(s)${dry ? '  [DRY RUN]' : ''}`);
  const dayDir = path.join(ROOT, 'out', 'days', date); fs.mkdirSync(dayDir, { recursive: true });
  const log = [];

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
      const clips = await narrate(form, lang, path.join(ROOT, 'out', 'tts-cache'), { dryRun: fakeTts, voices: cfg.tts?.voices, speakingRate: cfg.tts?.speakingRate });
      const narration = Object.fromEntries(Object.entries(clips).map(([k, v]) => [k, v.durationMs]));
      // 2) record
      const target = cfg.target || 'mock';
      const rec = new Recorder(form, { target, lang, outDir: path.join(dayDir, `rec-${row['슬롯']}`), narration });
      const r = await rec.run();
      // 3) mux
      const final = mux(r.mp4, r.timeline.cues, clips, `${base}.mp4`, { bgm: cfg.bgm || null });
      // 4) thumbnail (uses the first field screenshot as the backdrop)
      const shot = r.shots.find((s) => /step1-/.test(s)) || r.shots[1];
      const flagEmoji = (row['국가'].match(/^\S+/) || [''])[0];
      const thumb = await thumbnail({ flag: flagEmoji, country: row['국가'].replace(/^\S+\s/, ''), form: row['서식/주제'], lang, year: date.slice(0, 4), shot }, `${base}.png`);
      // 5) metadata
      const aff = (cfg.affiliate?.[lang] || cfg.affiliate?.default || {})[row['국가'].replace(/^\S+\s/, '')] || cfg.affiliate?.fallback || {};
      const meta = buildMetadata(row, form, r.timeline, aff, cfg);
      fs.writeFileSync(`${base}.meta.json`, JSON.stringify(meta, null, 1));
      // 6) upload (private + publishAt)
      const up = await upload(cfg.channels?.[lang] || lang, meta, final, thumb, { dryRun: dry });
      console.log(`    ✔ ${up.url}  publishAt=${meta.publishAt}`);
      log.push({ row, status: 'ok', video: final, url: up.url, publishAt: meta.publishAt });
    } catch (e) {
      console.error(`    ✖ ${e.message}`); log.push({ row, status: 'error: ' + e.message });
    }
  }
  fs.writeFileSync(path.join(dayDir, 'log.json'), JSON.stringify(log, null, 1));
  console.log(`done — ${log.filter((l) => l.status === 'ok').length}/${rows.length} uploaded, log: ${path.join(dayDir, 'log.json')}`);
})().catch((e) => { console.error(e); process.exit(1); });
