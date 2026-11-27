#!/usr/bin/env node
// Sync check for a finished build: does each narration cue land on its own step in the final video?
//   node upload/sync-check.js <day-dir> [--out <dir>]
// For every video in <day-dir> (from a daily-videos artifact): compares the recording's length with the cue clock,
// then grabs a frame 1 s after each step's tip cue and writes a contact sheet (step number on screen vs cue).
const fs = require('fs'); const path = require('path'); const { execSync } = require('child_process');
const argv = process.argv.slice(2); const opt = (k) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : null; };
const dir = path.resolve(argv.find((a) => !a.startsWith('--') && a !== opt('out')));
const out = path.resolve(opt('out') || path.join(dir, 'sync')); fs.mkdirSync(out, { recursive: true });
const dur = (f) => Number(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${f}"`).toString().trim());
const report = [];
for (const rec of fs.readdirSync(dir).filter((d) => /^rec-\d+$/.test(d))) {
  const tl = fs.readdirSync(path.join(dir, rec)).find((f) => f.endsWith('.timeline.json')); if (!tl) continue;
  const t = JSON.parse(fs.readFileSync(path.join(dir, rec, tl), 'utf8'));
  const slot = rec.split('-')[1]; const final = fs.readdirSync(dir).find((f) => f.startsWith(`${slot}-`) && f.endsWith('.mp4') && !f.includes('.short'));
  if (!final) continue;
  const vid = path.join(dir, final); const vd = dur(vid); const last = t.cues[t.cues.length - 1].t / 1000;
  const tips = t.cues.filter((c) => /^s\d+-tip$/.test(c.id));
  const frames = [];
  for (const c of tips) { const f = path.join(out, `${final}-${c.id}.png`); execSync(`ffmpeg -y -loglevel error -ss ${(c.t / 1000 + 1).toFixed(2)} -i "${vid}" -frames:v 1 -vf "crop=iw/2:ih/8:0:0,scale=480:-1" "${f}"`); frames.push(f); }
  // contact sheet: top-left strip (step counter) of each tip frame, in order
  const sheet = path.join(out, `${final}.sheet.png`);
  const ins = frames.map((f) => `-i "${f}"`).join(' ');
  if (frames.length) execSync(`ffmpeg -y -loglevel error ${ins} -filter_complex "${frames.map((_, i) => `[${i}]`).join('')}vstack=inputs=${frames.length}" "${sheet}"`);
  frames.forEach((f) => fs.unlinkSync(f));
  // Shorts: the first mistake moments (same choice as upload/shorts.js) — screen at cue+1 s and at the end of each cut
  const { segments } = require('./shorts');
  const mistakes = t.cues.filter((c) => /-mistake$/.test(c.id));
  const segs = segments(t.cues);
  const rows = [];
  segs.forEach((sg, k) => {
    const c = mistakes.find((m) => Math.max(0, m.t - 1800) === sg.start) || mistakes[k];
    const step = (c?.id.match(/^s(\d+)-/) || [])[1] || '?';
    for (const [tag, at] of [['start', (c ? c.t : sg.start) + 1000], ['end', Math.min(sg.end - 2500, (c ? c.t : sg.start) + 5000)]]) {
      const f = path.join(out, `${final}-short${k}-${tag}.png`);
      const label = `short cut ${k + 1} (${tag}) - should be step ${step}`;
      execSync(`ffmpeg -y -loglevel error -ss ${(at / 1000).toFixed(2)} -i "${vid}" -frames:v 1 -vf "crop=iw/2:ih/8:0:0,scale=480:-1,pad=480:ih+30:0:30:black,drawtext=text='${label}':fontcolor=yellow:fontsize=18:x=6:y=6" "${f}"`);
      rows.push(f);
    }
  });
  if (rows.length) { const sh = path.join(out, `${final}.shorts.png`); execSync(`ffmpeg -y -loglevel error ${rows.map((f) => `-i "${f}"`).join(' ')} -filter_complex "${rows.map((_, i) => `[${i}]`).join('')}vstack=inputs=${rows.length}" "${sh}"`); rows.forEach((f) => fs.unlinkSync(f)); }
  const line = `${final}: video ${vd.toFixed(1)} s, last cue ${last.toFixed(1)} s, recording drift check: ${tips.length} tip cues → ${path.basename(sheet)} (row n should show step n)`;
  console.log(line); report.push(line);
}
fs.writeFileSync(path.join(out, 'report.txt'), report.join('\n') + '\n');
