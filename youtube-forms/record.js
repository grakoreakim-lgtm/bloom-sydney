#!/usr/bin/env node
// Usage:
//   node record.js mdac                    # mock target, Korean overlays
//   node record.js mdac --lang en          # English overlays
//   node record.js mdac --target live      # real site (verify selectors first!)
//   node record.js mdac --speed 0.5        # twice as fast (for quick checks)
//
// Output: out/<form>-<target>-<lang>.mp4 (+ .webm) and numbered screenshots.

const path = require('path');
const { Recorder } = require('./lib/recorder');

const args = process.argv.slice(2);
const formId = args.find((a) => !a.startsWith('--'));
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };

if (!formId) { console.error('usage: node record.js <form> [--target mock|live] [--lang ko|en] [--speed 1]'); process.exit(1); }

const form = require(path.join(__dirname, 'forms', `${formId}.js`));
const target = opt('target', 'mock');
const lang = opt('lang', 'ko');
const speed = Number(opt('speed', '1'));

if (target === 'live') {
  console.log('⚠  LIVE target: this script never clicks Submit and never fills CAPTCHA.');
  console.log('   Verify every selector in forms/' + formId + '.js against the real page first.');
}

(async () => {
  const rec = new Recorder(form, { target, lang, speed, size: { width: 1280, height: 720 } });
  console.log(`▶ recording ${formId} (${target}, ${lang}) …`);
  const out = await rec.run();
  console.log('✔ video :', out.mp4 || out.webm);
  console.log('✔ shots :', out.shots.length, 'screenshots in', path.dirname(out.webm));
})().catch((e) => { console.error(e); process.exit(1); });
