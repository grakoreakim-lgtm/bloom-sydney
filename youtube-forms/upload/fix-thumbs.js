#!/usr/bin/env node
// Re-render and set thumbnails for videos already uploaded (e.g. when thumbnails.set failed before
// the channel was phone-verified).  node upload/fix-thumbs.js <dir-with-day-folders> [--config upload/config.ci.json]
// Looks for <day>/log.json from run-day.js and the rec-<slot>/ screenshots next to it.
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { authorize } = require('./auth');
const { thumbnail } = require('./thumbnail');

const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : null; };
const cfg = JSON.parse(fs.readFileSync(opt('config') || path.join(__dirname, 'config.ci.json'), 'utf8'));
const root = argv.find((a) => !a.startsWith('--') && a !== opt('config')) || 'artifacts';
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));

(async () => {
  const logs = walk(root).filter((f) => path.basename(f) === 'log.json');
  let ok = 0, fail = 0;
  for (const lf of logs) {
    const dayDir = path.dirname(lf);
    for (const e of JSON.parse(fs.readFileSync(lf, 'utf8'))) {
      if (e.status !== 'ok' || !/youtu\.be\//.test(e.url || '')) continue;
      const id = e.url.split('youtu.be/')[1]; const row = e.row; const lang = row['언어'].toLowerCase(); const slot = row['슬롯'];
      const formId = (cfg.formMap || {})[row['서식/주제']];
      const form = formId ? require(path.join(__dirname, '..', 'forms', `${formId}.js`)) : {};
      const recDir = path.join(dayDir, `rec-${slot}`);
      const shots = fs.existsSync(recDir) ? fs.readdirSync(recDir).filter((f) => f.endsWith('.png')).sort().map((f) => path.join(recDir, f)) : [];
      const shot = shots.find((s) => /step1-/.test(s)) || shots[1] || shots[0] || null;
      const out = path.join(dayDir, `${slot}-${formId}-${lang}.fixed.png`);
      try {
        await thumbnail({
          flag: (row['국가'].match(/^\S+/) || [''])[0],
          country: form.country?.[lang] || form.country?.en || row['국가'].replace(/^\S+\s/, ''),
          form: form.title?.[lang] || form.title?.en || row['서식/주제'],
          lang, year: row['날짜'].slice(0, 4), shot,
        }, out);
        const yt = google.youtube({ version: 'v3', auth: await authorize(cfg.channels?.[lang] || lang) });
        await yt.thumbnails.set({ videoId: id, media: { body: fs.createReadStream(out) } });
        console.log(`✔ thumbnail set  https://youtu.be/${id}  (${lang})`); ok++;
      } catch (err) { console.log(`✖ https://youtu.be/${id}: ${err.message}`); fail++; }
    }
  }
  console.log(`done — ${ok} set, ${fail} failed`);
  if (fail) process.exitCode = 1;
})();
