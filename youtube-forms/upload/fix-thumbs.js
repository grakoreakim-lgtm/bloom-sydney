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
const root = argv.find((a) => !a.startsWith('--') && a !== opt('config') && a !== opt('ids') && a !== opt('direct')) || 'artifacts';
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));

(async () => {
  let ok = 0, fail = 0;
  // --direct id:form:lang,…  for videos with no saved build: backdrop = a screenshot of the form's practice page
  for (const d of (opt('direct') || '').split(',').filter(Boolean)) {
    const [id, formId, lang] = d.split(':'); const form = require(path.join(__dirname, '..', 'forms', `${formId}.js`));
    const out = path.join(root, `direct-${id}.png`), shot = path.join(root, `direct-${id}-shot.png`);
    try {
      fs.mkdirSync(root, { recursive: true });
      const { chromium } = require('playwright'); const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1024, height: 576 } });
      await pg.goto(form.url.mock); await pg.waitForTimeout(800); await pg.screenshot({ path: shot }); await b.close();
      await thumbnail({ flag: form.flag || '', lang, year: '2026', shot, lines: cfg.thumbText?.[`${formId}:${lang}`] }, out);
      const yt = google.youtube({ version: 'v3', auth: await authorize(cfg.channels?.[lang] || lang) });
      await yt.thumbnails.set({ videoId: id, media: { body: fs.createReadStream(out) } });
      console.log(`✔ thumbnail set (direct)  https://youtu.be/${id}  (${lang})`); ok++;
    } catch (err) { console.log(`✖ direct https://youtu.be/${id}: ${err.message}`); fail++; }
  }
  const logs = walk(root).filter((f) => path.basename(f) === 'log.json');
  const seen = new Set(); const onlyIds = opt('ids') ? opt('ids').split(',') : null;   // --ids a,b,c limits the run
  for (const lf of logs) {
    const dayDir = path.dirname(lf);
    for (const e of JSON.parse(fs.readFileSync(lf, 'utf8'))) {
      if (e.status !== 'ok' || !/youtu\.be\//.test(e.url || '')) continue;
      const id = e.url.split('youtu.be/')[1];
      if (seen.has(id) || (onlyIds && !onlyIds.includes(id))) continue; seen.add(id);
      if (e.kind === 'short') {   // a Short keeps a frame of itself (vertical) — never the landscape design of the main video
        const vid = path.join(dayDir, path.basename(e.video || '')); const frame = path.join(dayDir, `${id}.short.jpg`);
        try {
          if (!fs.existsSync(vid)) throw new Error('short video not in the artifacts');
          require('child_process').execSync(`ffmpeg -y -loglevel error -ss 2 -i "${vid}" -frames:v 1 -q:v 3 "${frame}"`);
          const yt = google.youtube({ version: 'v3', auth: await authorize(cfg.channels?.[e.row['언어'].toLowerCase()] || e.row['언어'].toLowerCase()) });
          await yt.thumbnails.set({ videoId: id, media: { body: fs.createReadStream(frame) } });
          console.log(`✔ short frame set  https://youtu.be/${id}`); ok++;
        } catch (err) { console.log(`✖ short https://youtu.be/${id}: ${err.message}`); fail++; }
        continue;
      }
 const row = e.row; const lang = row['언어'].toLowerCase(); const slot = row['슬롯'];
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
          lang, year: row['날짜'].slice(0, 4), shot, lines: cfg.thumbText?.[`${formId}:${lang}`],
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
