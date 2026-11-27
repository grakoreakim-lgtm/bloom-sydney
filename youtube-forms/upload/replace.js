#!/usr/bin/env node
// Re-upload fixed builds of videos that are already on YouTube (e.g. after the sync fix), PRIVATE, and record
// old → new in plan/replacements.json. Swapping (new public, old private) is a separate, approved step:
//   node upload/replace.js <day-dir-from-a-daily-videos-artifact> [--only esta-ko,esta-en]
//   node upload/replace.js --swap [--only esta-ko]      # after the owner approves: new → public, old → private
const fs = require('fs'); const path = require('path');
const { google } = require('googleapis');
const { authorize } = require('./auth');
const { upload } = require('./upload');
const argv = process.argv.slice(2); const opt = (k) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : null; };
const cfg = JSON.parse(fs.readFileSync(opt('config') || path.join(__dirname, 'config.ci.json'), 'utf8'));
const ROOT = path.join(__dirname, '..');
const PRODUCED = path.join(ROOT, 'plan', 'produced.json'), REPL = path.join(ROOT, 'plan', 'replacements.json');
const produced = JSON.parse(fs.readFileSync(PRODUCED, 'utf8'));
const repl = fs.existsSync(REPL) ? JSON.parse(fs.readFileSync(REPL, 'utf8')) : {};
const only = opt('only') ? opt('only').split(',') : null;
const id = (u) => (u || '').split('youtu.be/')[1];

async function setPrivacy(ch, videoId, privacy) {
  const yt = google.youtube({ version: 'v3', auth: await authorize(ch) });
  const v = (await yt.videos.list({ part: ['status'], id: [videoId] })).data.items?.[0]; if (!v) throw new Error(`${videoId} not found on ${ch}`);
  const st = v.status;
  await yt.videos.update({ part: ['status'], requestBody: { id: videoId, status: { privacyStatus: privacy, embeddable: st.embeddable, license: st.license, publicStatsViewable: st.publicStatsViewable, selfDeclaredMadeForKids: false, containsSyntheticMedia: true } } });
}

(async () => {
  if (argv.includes('--swap')) {
    for (const [key, r] of Object.entries(repl)) {
      if (r.swapped || (only && !only.includes(key.replace(/:/g, '-')))) continue;
      try {
        await setPrivacy(r.channel, id(r.new), 'public'); console.log(`✔ ${key}: new ${r.new} → PUBLIC`);
        if (r.old) { await setPrivacy(r.channel, id(r.old), 'private'); console.log(`  old ${r.old} → private`); }
        if (key.endsWith(':short')) {   // keep plan/shorts.json pointing at the new Short and the new main video
          const SH = path.join(ROOT, 'plan', 'shorts.json'); const map = JSON.parse(fs.readFileSync(SH, 'utf8'));
          const prev = r.old ? map[id(r.old)] : null; if (r.old) delete map[id(r.old)];
          map[id(r.new)] = { ...(prev || {}), main: id(r.main), channel: r.channel, lang: r.channel, form: key.split(':')[0], replaced: id(r.old) };
          fs.writeFileSync(SH, JSON.stringify(map, null, 1) + '\n');
        } else produced[key] = { ...(produced[key] || {}), url: r.new, replaced: r.old || null };
        r.swapped = new Date().toISOString();
      } catch (e) { console.log(`✖ ${key}: ${e?.response?.data?.error?.message || e.message}`); process.exitCode = 1; }
    }
    fs.writeFileSync(PRODUCED, JSON.stringify(produced, null, 1) + '\n'); fs.writeFileSync(REPL, JSON.stringify(repl, null, 1) + '\n');
    return;
  }
  const dir = path.resolve(argv.find((a) => !a.startsWith('--') && ![opt('only'), opt('config')].includes(a)));
  if (argv.includes('--shorts')) {   // re-cut Shorts from fixed main builds (main must already be swapped in)
    const { makeShort } = require('./shorts');
    const shortsMap = JSON.parse(fs.readFileSync(path.join(ROOT, 'plan', 'shorts.json'), 'utf8'));
    for (const f of fs.readdirSync(dir).filter((x) => /^\d+-.+-(ko|en)\.mp4$/.test(x) && !x.includes('.short'))) {
      const base = f.replace(/\.mp4$/, ''); const [, slot, form, lang] = base.match(/^(\d+)-(.+)-(ko|en)$/);
      const key = `${form}:${lang}:short`; if (only && !only.includes(`${form}-${lang}-short`)) continue;
      if (repl[key] && !repl[key].swapped) { console.log(`⏭ ${key}: already re-uploaded`); continue; }
      const main = repl[`${form}:${lang}`]; if (!main?.swapped) { console.log(`⏭ ${key}: main video not swapped yet`); continue; }
      const tl = fs.readdirSync(path.join(dir, `rec-${slot}`)).find((x) => x.endsWith('.timeline.json'));
      const cues = JSON.parse(fs.readFileSync(path.join(dir, `rec-${slot}`, tl), 'utf8')).cues;
      const fdef = require(path.join(ROOT, 'forms', `${form}.js`));
      const short = makeShort(path.join(dir, f), cues, { lang, short: fdef.shortTitle?.[lang] || fdef.country?.[lang], country: fdef.country?.[lang] || '', form: fdef.shortTitle?.[lang] || fdef.title?.[lang] || form }, path.join(dir, `${base}.short.mp4`));
      if (!short) { console.log(`⏭ ${key}: no mistake moments`); continue; }
      const meta = JSON.parse(fs.readFileSync(path.join(dir, `${base}.meta.json`), 'utf8'));
      const full = lang === 'ko' ? '▶ 전체 따라하기 영상' : '▶ Full step-by-step video';
      const smeta = { title: short.title, description: [`${full}: ${main.new}`, '', meta.description.split('\n')[0], '', meta.description.split('\n').filter((l) => l.startsWith('#')).pop() || ''].join('\n'), tags: meta.tags, categoryId: meta.categoryId, defaultLanguage: lang };
      const oldShort = Object.entries(shortsMap).find(([, v]) => v.form === form && v.lang === lang)?.[0];
      const up = await upload(lang, smeta, short.file, null, { review: true, allowDuplicate: true, expectChannel: cfg.channelIds?.[lang] || null });
      repl[key] = { channel: lang, old: oldShort ? `https://youtu.be/${oldShort}` : null, new: up.url, main: main.new, uploaded: new Date().toISOString() };
      console.log(`✔ ${key}: new PRIVATE ${up.url}  (old ${repl[key].old || '-'})`);
      fs.writeFileSync(REPL, JSON.stringify(repl, null, 1) + '\n');
    }
    return;
  }
  for (const f of fs.readdirSync(dir).filter((x) => /^\d+-.+-(ko|en)\.mp4$/.test(x) && !x.includes('.short'))) {
    const base = f.replace(/\.mp4$/, ''); const [, form, lang] = base.match(/^\d+-(.+)-(ko|en)$/);
    const key = `${form}:${lang}`; if (only && !only.includes(`${form}-${lang}`)) continue;
    const qa = JSON.parse(fs.readFileSync(path.join(dir, `${base}.qa.json`), 'utf8'));
    if (!qa.ok) { console.log(`✖ ${key}: QA failed — not uploading`); continue; }
    if (repl[key] && !repl[key].swapped) { console.log(`⏭ ${key}: already re-uploaded (${repl[key].new}), waiting for swap`); continue; }
    const meta = JSON.parse(fs.readFileSync(path.join(dir, `${base}.meta.json`), 'utf8'));
    const ch = lang;   // tutorial channels: ko / en
    const thumb = fs.existsSync(path.join(dir, `${base}.png`)) ? path.join(dir, `${base}.png`) : null;
    const up = await upload(ch, meta, path.join(dir, f), thumb, { review: true, allowDuplicate: true, expectChannel: cfg.channelIds?.[ch] || null });
    repl[key] = { channel: ch, old: produced[key]?.url || null, new: up.url, uploaded: new Date().toISOString(), sync: qa.summary };
    console.log(`✔ ${key}: new PRIVATE ${up.url}  (old ${produced[key]?.url || '-'})`);
    fs.writeFileSync(REPL, JSON.stringify(repl, null, 1) + '\n');
  }
})().catch((e) => { console.error(e.message); process.exit(1); });
