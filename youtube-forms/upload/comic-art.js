#!/usr/bin/env node
// Comic panel art for phrase episodes (phrases/<id>.json → phrases/art/<id>/p<n>.jpg).
// The pictures carry NO text: speech bubbles, Japanese and Korean are drawn by phrases.js on top, so spelling is
// always right. Consistency: a character sheet (cast.jpg) is made first and passed as a reference to every panel.
//
//   GEMINI_API_KEY=… node upload/comic-art.js phrases/jp-restaurant.json [--only 3,5] [--force]
//
// Art is generated once, reviewed, then committed; video builds only read the files (no image calls at build time).
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : null; };
const file = argv.find((a) => !a.startsWith('--') && a !== opt('only') && a !== opt('model') && a !== opt('panel'));
const P = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
const C = P.comic; if (!C) { console.log(`no "comic" section in ${file}`); process.exit(1); }
const OUT = path.join(__dirname, '..', 'phrases', 'art', P.id); fs.mkdirSync(OUT, { recursive: true });
const only = opt('only') ? opt('only').split(',').map(Number) : null;
const force = argv.includes('--force');
const MODELS = [opt('model'), 'gemini-3-pro-image-preview', 'gemini-2.5-flash-image', 'gemini-2.5-flash-image-preview'].filter(Boolean);
const key = process.env.GEMINI_API_KEY; if (!key) { console.log('GEMINI_API_KEY is not set'); process.exit(1); }

const castText = C.cast.map((c) => `- ${c.name}: ${c.look}`).join('\n');
const NO_TEXT = 'Absolutely no text, letters, numbers, signs with writing, logos or speech bubbles anywhere in the image.';
let working = null;   // first model that answers is used for the rest

async function gen(prompt, ref, outFile, o = {}) {
  const parts = [{ text: prompt }];
  if (ref) parts.push({ inline_data: { mime_type: 'image/jpeg', data: fs.readFileSync(ref).toString('base64') } });
  let last = '';
  for (const model of working ? [working] : [...new Set(MODELS)]) {
    for (const withRatio of [true, false]) {
      for (let attempt = 0; attempt < 4; attempt++) {
        const body = { contents: [{ parts }], generationConfig: { responseModalities: ['TEXT', 'IMAGE'], ...(withRatio ? { imageConfig: { aspectRatio: '16:9', ...(o.size ? { imageSize: o.size } : {}) } } : {}) } };
        let res;
        try {
          res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
            method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(body), signal: AbortSignal.timeout(240000),
          });
        } catch (e) { last = `${model}: ${e.name === 'TimeoutError' ? 'no answer in 4 minutes' : e.message}`; continue; }
        if (res.status === 429 || res.status >= 500) { last = `${model} ${res.status}: ${(await res.text()).replace(/\s+/g, ' ').slice(0, 200)}`; await new Promise((r) => setTimeout(r, 15000 * (attempt + 1))); continue; }
        if (!res.ok) { last = `${model} ${res.status}: ${(await res.text()).replace(/\s+/g, ' ').slice(0, 200)}`; break; }
        const j = await res.json();
        const img = j.candidates?.[0]?.content?.parts?.find((p) => p.inlineData || p.inline_data);
        if (!img) { last = `${model}: no image (${j.candidates?.[0]?.finishReason || 'no candidates'})`; break; }
        const d = img.inlineData || img.inline_data;
        if (o.keep) { fs.writeFileSync(outFile, Buffer.from(d.data, 'base64')); working = model; return model; }   // full-size original (a whole page)
        const raw = `${outFile}.raw`; fs.writeFileSync(raw, Buffer.from(d.data, 'base64'));
        // every panel is exactly 1280x720 (cover-crop), JPEG to keep the repository small
        execSync(`ffmpeg -y -loglevel error -i "${raw}" -vf "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720" -q:v 3 "${outFile}"`);
        fs.unlinkSync(raw); working = model;
        return model;
      }
      if (!/400/.test(last)) break;   // only a 400 can be about imageConfig → retry without it
    }
  }
  throw new Error(last);
}

// --styles: draw one panel (--panel, default 2) in every comic.styleOptions style → art/<id>/styles/<key>.jpg (for choosing a style)
async function styleTest() {
  const n = Number(opt('panel') || 2); const p = [...P.phrases, ...(P.bonus ? [P.bonus] : [])][n - 1];
  const dir = path.join(OUT, 'styles'); fs.mkdirSync(dir, { recursive: true });
  const cast = C.castFrom ? path.join(OUT, '..', C.castFrom, 'cast.jpg') : path.join(OUT, 'cast.jpg');
  for (const [k, st] of Object.entries(C.styleOptions || {})) {
    const prompt = `${st}\nThe attached sheet only shows WHO the characters are (faces, hair, clothes, colours); do NOT copy its drawing style.\n${castText}\n\nScene: ${C.setting} ${p.scene}\n${C.layout || ''}\nComposition: wide 16:9 panel, characters in the lower two thirds, keep the upper left quarter calm and empty.\n${NO_TEXT}`;
    try { const m = await gen(prompt, cast, path.join(dir, `${k}.jpg`)); console.log(`✔ style ${k} (${m})`); } catch (e) { console.log(`✖ style ${k}: ${e.message}`); }
  }
}

// --page: the whole episode as ONE image (a grid of equal panels), then cut into p<n>.jpg — about 1/10 of the cost.
// Output goes to art/<id>/page/ for review; copy the panels up one level once they pass.
function cuts(gray, len, other, n, along) {   // find n-1 white gutters along one axis of a downscaled grey page
  const white = [];
  for (let a = 0; a < len; a++) { let w = 0; for (let b = 0; b < other; b++) { const v = along === 'x' ? gray[b * len + a] : gray[a * other + b]; if (v > 228) w++; } white.push(w / other > 0.93); }
  const bands = []; for (let a = 0; a < len; a++) if (white[a]) { const st = a; while (a < len && white[a]) a++; bands.push([st, a]); }
  const inner = bands.filter(([a, b]) => a > len * 0.05 && b < len * 0.95);
  const want = Array.from({ length: n - 1 }, (_, k) => ((k + 1) * len) / n);
  return want.map((t) => { const near = inner.map(([a, b]) => [(a + b) / 2, a, b]).sort((p, q) => Math.abs(p[0] - t) - Math.abs(q[0] - t))[0]; return near && Math.abs(near[0] - t) < len * 0.08 ? [near[1], near[2]] : [t - 2, t + 2]; });
}
async function pageMode() {
  const all = [...P.phrases, ...(P.bonus ? [P.bonus] : [])]; const n = all.length;
  const cols = n <= 4 ? 2 : 3, rows = Math.ceil(n / cols);
  const dir = path.join(OUT, 'page'); fs.mkdirSync(dir, { recursive: true });
  const cast = C.castFrom ? path.join(OUT, '..', C.castFrom, 'cast.jpg') : path.join(OUT, 'cast.jpg');
  const list = all.map((p, i) => `Panel ${i + 1} (row ${Math.floor(i / cols) + 1}, column ${(i % cols) + 1}): ${p.scene}`).join('\n');
  const prompt = `${C.style}\nUse exactly the characters from the attached reference sheet (same faces, hair, clothes, colours).\n${castText}\n\nDraw ONE comic page that is a strict grid of ${cols} columns x ${rows} rows of EQUAL-SIZE wide 16:9 panels, separated by clean pure-white gutters of equal width, read left to right, top to bottom. Every panel is a complete scene on its own. Setting for all panels: ${C.setting}\n${C.layout || ''}\nIn every panel keep the upper left quarter calm and empty (plain wall) for a speech bubble that will be added later.\n${list}\n${n < cols * rows ? 'Leave the remaining grid cells plain white.\n' : ''}${NO_TEXT} No panel numbers, no captions.`;
  const page = path.join(dir, 'page.png');
  const m = await gen(prompt, cast, page, { size: '4K', keep: true }); console.log(`✔ page (${m})`);
  const [W, H] = execSync(`ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "${page}"`).toString().trim().split(',').map(Number);
  const w = 800, h = Math.round((H / W) * w);
  const gray = execSync(`ffmpeg -loglevel error -i "${page}" -vf scale=${w}:${h},format=gray -f rawvideo -`, { maxBuffer: 64 * 1024 * 1024 });
  const cx = cuts(gray, w, h, cols, 'x'), cy = cuts(gray, h, w, rows, 'y');
  const xs = [[0, cx[0]?.[0] ?? w]].concat(cx.map((c, k) => [c[1], cx[k + 1]?.[0] ?? w]));
  const ys = [[0, cy[0]?.[0] ?? h]].concat(cy.map((c, k) => [c[1], cy[k + 1]?.[0] ?? h]));
  const sx = W / w, sy = H / h, pad = 6;
  for (let i = 0; i < n; i++) {
    const [x0, x1] = xs[i % cols], [y0, y1] = ys[Math.floor(i / cols)];
    const X = Math.round((x0 + pad) * sx), Y = Math.round((y0 + pad) * sy), CW = Math.round((x1 - x0 - 2 * pad) * sx), CH = Math.round((y1 - y0 - 2 * pad) * sy);
    execSync(`ffmpeg -y -loglevel error -i "${page}" -vf "crop=${CW}:${CH}:${X}:${Y},scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720" -q:v 3 "${path.join(dir, `p${i + 1}.jpg`)}"`);
  }
  console.log(`✔ cut into ${n} panels (${W}x${H}, grid ${cols}x${rows}) → phrases/art/${P.id}/page/`);
}

(async () => {
  if (argv.includes('--styles')) return styleTest();
  if (argv.includes('--page')) return pageMode();
  const log = fs.existsSync(path.join(OUT, 'art.json')) ? JSON.parse(fs.readFileSync(path.join(OUT, 'art.json'), 'utf8')) : {};
  // a series shares one cast: "castFrom": "jp-restaurant" reuses that episode's character sheet
  const cast = C.castFrom ? path.join(OUT, '..', C.castFrom, 'cast.jpg') : path.join(OUT, 'cast.jpg');
  if (!C.castFrom && (!fs.existsSync(cast) || (force && !only))) {
    const m = await gen(`${C.style}\nCharacter reference sheet on a plain light background: each character standing side by side, full body, front view, friendly neutral expression.\n${castText}\n${NO_TEXT}`, null, cast);
    log.cast = { model: m, at: new Date().toISOString() }; console.log(`✔ cast.jpg (${m})`);
  }
  const all = [...P.phrases, ...(P.bonus ? [P.bonus] : [])];
  let fails = 0;
  for (const [i, p] of all.entries()) {
    const n = i + 1; if (only && !only.includes(n)) continue;
    const f = path.join(OUT, `p${n}.jpg`);
    if (fs.existsSync(f) && !force) { console.log(`· p${n} exists`); continue; }
    if (!p.scene) { console.log(`✖ p${n}: no "scene"`); fails++; continue; }
    const space = { tl: 'upper left', tr: 'upper right', tc: 'top centre' }[p.bubble || 'tl'];
    const prompt = `${C.style}\nUse exactly the characters from the attached reference sheet (same faces, hair, clothes, colours).\n${castText}\n\nScene: ${C.setting} ${p.scene}\n${C.layout || ''}\nComposition: wide 16:9 comic panel, characters in the lower two thirds, keep the ${space} quarter of the image calm and empty (plain wall or sky) for a speech bubble that will be added later.\n${NO_TEXT}`;
    try { const m = await gen(prompt, cast, f); log[`p${n}`] = { model: m, at: new Date().toISOString() }; console.log(`✔ p${n} (${m})`); }
    catch (e) { fails++; console.log(`✖ p${n}: ${e.message}`); }
    fs.writeFileSync(path.join(OUT, 'art.json'), JSON.stringify(log, null, 1));
  }
  fs.writeFileSync(path.join(OUT, 'art.json'), JSON.stringify(log, null, 1));
  console.log(fails ? `ART ${fails} panel(s) failed` : 'ART done');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.log(`ART FAIL ${e.message}`); process.exit(1); });
