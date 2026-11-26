// Narration: build the per-cue script from a form definition and synthesize it with Google Cloud TTS.
// Cue ids match lib/recorder.js: card-<id>, s<n>-tip, s<n>-mistake.
// Needs GOOGLE_TTS_API_KEY (Cloud Text-to-Speech API enabled). Clips are cached by text hash.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const VOICES = {   // defaults; config.json → tts.voices overrides (e.g. ko-KR-Chirp3-HD-* for the most natural Korean)
  ko: { languageCode: 'ko-KR', name: 'ko-KR-Neural2-C' },
  en: { languageCode: 'en-US', name: 'en-US-Neural2-F' },
  hi: { languageCode: 'hi-IN', name: 'hi-IN-Neural2-A' },
  es: { languageCode: 'es-ES', name: 'es-ES-Neural2-A' },
  id: { languageCode: 'id-ID', name: 'id-ID-Wavenet-A' },
  ja: { languageCode: 'ja-JP', name: 'ja-JP-Neural2-B' },
};

// strip emoji / markup that TTS would read aloud
const clean = (s) => String(s || '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}📌📱🚆🏨👀✅⚠️]/gu, '').replace(/\s+/g, ' ').trim();

const INTRO_SENTENCES = 2;

/** @returns {{id:string,text:string}[]} */
function buildScript(form, lang, target = 'mock') {
  const t = form.strings[lang];
  const steps = (target === 'live' && form.stepsLive) || form.steps;   // must match lib/recorder.js
  const lines = [];
  let n = 0;
  for (const step of steps) {
    if (step.type === 'card') {
      const c = step.card[lang];
      let text = clean(c.speech || [c.title, c.subtitle, ...(c.chips || [])].filter(Boolean).join('. '));
      // short intro: the hook (first two sentences) and any "unofficial guide" notice, then straight to the screen
      if (c.id === 'intro') { const ss = text.match(/[^.!?。]+[.!?。]+["'”’]?\s*/g) || [text]; text = ss.filter((x, i) => i < INTRO_SENTENCES || /unofficial|not affiliated|비공식|공식 기관이 아/i.test(x)).join('').trim(); }
      // one short spoken reason to subscribe at the very end (skipped when the outro already asks)
      if (c.id === 'outro' && !/구독|subscribe/i.test(text)) text += lang === 'ko' ? ' 궁금한 건 댓글로 물어보세요, 답해 드려요. 도움이 됐다면 구독도 해 두세요.' : ' Questions? Ask in the comments and we will answer. If this helped, subscribe.';
      lines.push({ id: `card-${c.id}`, text });
      continue;
    }
    n += 1;
    const x = step.text[lang]; const sp = x.speech || {};
    // prefer the conversational `speech` script; fall back to the on-screen text
    if (sp.tip || x.tip) lines.push({ id: `s${n}-tip`, text: clean(sp.tip || `${x.label}. ${x.tip}`) });
    if (sp.mistake || x.mistake) {
      const ex = !sp.mistake && x.bad && x.good ? (lang === 'ko' ? ` ${x.bad}가 아니라 ${x.good}입니다.` : ` Not ${x.bad}, but ${x.good}.`) : '';
      lines.push({ id: `s${n}-mistake`, text: clean(sp.mistake || `${t.mistakeTitle}. ${x.mistake}${ex}`) });
    }
  }
  return lines;
}

// one chunk of text → mp3 Buffer, for each provider
// optional time budget for the Gemini voice: setBudget(15) → after 15 minutes synthChunk throws and the caller falls back
const budget = { until: 0, minutes: 0 };
const setBudget = (minutes) => { budget.minutes = minutes || 0; budget.until = minutes ? Date.now() + minutes * 60000 : 0; };

async function synthChunk(voice, t, speakingRate) {
  const provider = voice.provider || 'google';
  if (provider === 'openai') {             // OpenAI gpt-4o-mini-tts: steerable with "instructions"
    const key = process.env.OPENAI_API_KEY; if (!key) throw new Error('OPENAI_API_KEY is not set');
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: voice.model || 'gpt-4o-mini-tts', voice: voice.name || 'coral', input: t, response_format: 'mp3', ...(voice.prompt ? { instructions: voice.prompt } : {}), ...(speakingRate && speakingRate !== 1 ? { speed: speakingRate } : {}) }),
    });
    if (!res.ok) throw new Error(`OpenAI TTS ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return Buffer.from(await res.arrayBuffer());
  }
  if (provider === 'gemini') {             // Gemini TTS via the Gemini API (AI Studio key); style via a spoken instruction
    const key = process.env.GEMINI_API_KEY; if (!key) throw new Error('GEMINI_API_KEY is not set');
    const models = [voice.model, 'gemini-2.5-pro-preview-tts', 'gemini-2.5-flash-preview-tts'].filter(Boolean);
    const say = voice.prompt ? `${voice.prompt}\n\n${t}` : t;
    let lastErr = '';
    for (const model of [...new Set(models)]) {
      for (let attempt = 0; attempt < 6; attempt++) {
        // time budget per video (set by the caller): a slow or rate-limited service must not stall the whole day
        if (budget.until && Date.now() > budget.until) throw new Error(`Gemini TTS too slow — over the ${budget.minutes}-minute budget (${lastErr || 'slow responses'})`);
        let res;
        try { res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify({ contents: [{ parts: [{ text: say }] }], generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice.name || 'Leda' } } } } }),
          signal: AbortSignal.timeout(180000),
        }); } catch (e) { lastErr = `${model} ${e.name === 'TimeoutError' ? 'no answer in 3 minutes' : e.message}`; continue; }
        if (res.status === 429 || res.status >= 500) { lastErr = `${model} ${res.status}`; await new Promise((r) => setTimeout(r, 5000 * (attempt + 1))); continue; }
        if (!res.ok) { lastErr = `${model} ${res.status}: ${(await res.text()).slice(0, 200)}`; break; }   // e.g. model name not available → next model
        const part = (await res.json()).candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
        if (!part) { lastErr = `${model}: no audio in response`; break; }
        const rate = Number((part.inlineData.mimeType || '').match(/rate=(\d+)/)?.[1] || 24000);
        const tmp = path.join(require('os').tmpdir(), `gem-${process.pid}-${Date.now()}`);
        fs.writeFileSync(`${tmp}.pcm`, Buffer.from(part.inlineData.data, 'base64'));
        execSync(`ffmpeg -y -loglevel error -f s16le -ar ${rate} -ac 1 -i "${tmp}.pcm" -c:a libmp3lame -q:a 2 "${tmp}.mp3"`);
        const buf = fs.readFileSync(`${tmp}.mp3`); fs.unlinkSync(`${tmp}.pcm`); fs.unlinkSync(`${tmp}.mp3`);
        return buf;
      }
    }
    throw new Error(`Gemini TTS failed: ${lastErr}`);
  }
  if (provider === 'clova') {              // NAVER CLOVA Voice (Premium), Korean-native voices
    const id = process.env.CLOVA_CLIENT_ID, secret = process.env.CLOVA_CLIENT_SECRET;
    if (!id || !secret) throw new Error('CLOVA_CLIENT_ID / CLOVA_CLIENT_SECRET are not set');
    const body = new URLSearchParams({ speaker: voice.name || 'nara', text: t, format: 'mp3', volume: '0', speed: String(voice.speed ?? 0), pitch: String(voice.pitch ?? 0), ...(voice.emotion != null ? { emotion: String(voice.emotion) } : {}) });
    const res = await fetch(voice.endpoint || 'https://naveropenapi.apigw.ntruss.com/tts-premium/v1/tts', {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', 'X-NCP-APIGW-API-KEY-ID': id, 'X-NCP-APIGW-API-KEY': secret }, body,
    });
    if (!res.ok) throw new Error(`CLOVA TTS ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return Buffer.from(await res.arrayBuffer());
  }
  // Google Cloud TTS (Chirp 3 HD etc.; Gemini TTS via voice.model + voice.prompt)
  const key = process.env.GOOGLE_TTS_API_KEY || process.env.GOOGLE_TTS_KEY_VIA_PROXY;
  if (!key) throw new Error('GOOGLE_TTS_API_KEY is not set');
  const res = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      input: { text: t, ...(voice.model && voice.prompt ? { prompt: voice.prompt } : {}) },
      voice: { languageCode: voice.languageCode, name: voice.name, ...(voice.model ? { modelName: voice.model } : {}) },
      audioConfig: { audioEncoding: 'MP3', ...(speakingRate && speakingRate !== 1 ? { speakingRate } : {}) },
    }),
  });
  if (!res.ok) throw new Error(`TTS ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return Buffer.from((await res.json()).audioContent, 'base64');
}

async function synthesize(text, lang, outFile, voices = VOICES, speakingRate = 1.0) {
  const voice = voices[lang] || VOICES[lang];
  // Plain text, one request per sentence, joined with a short real silence (clean, even breathing room).
  const sentences = voice.split === false ? [String(text).replace(/\s+/g, ' ').trim()] : splitSentences(text);
  const parts = [];
  for (const [i, sTxt] of sentences.entries()) {
    const f = sentences.length === 1 ? outFile : `${outFile}.part${i}.mp3`;
    fs.writeFileSync(f, await synthChunk(voice, sTxt, speakingRate));
    parts.push(f);
  }
  if (parts.length > 1) {
    const gap = voice.sentenceGapMs ?? 280;
    const list = `${outFile}.txt`;
    const sil = `${outFile}.sil.mp3`;
    execSync(`ffmpeg -y -loglevel error -f lavfi -i anullsrc=r=24000:cl=mono -t ${gap / 1000} -c:a libmp3lame -q:a 4 "${sil}"`);
    const norm = parts.map((p, i) => { const o = `${outFile}.n${i}.mp3`; execSync(`ffmpeg -y -loglevel error -i "${p}" -ar 24000 -ac 1 -c:a libmp3lame -q:a 2 "${o}"`); return o; });
    fs.writeFileSync(list, norm.flatMap((p, i) => (i ? [`file '${path.resolve(sil)}'`, `file '${path.resolve(p)}'`] : [`file '${path.resolve(p)}'`])).join('\n'));
    execSync(`ffmpeg -y -loglevel error -f concat -safe 0 -i "${list}" -c:a libmp3lame -q:a 2 "${outFile}"`);
    [...parts, ...norm, list, sil].forEach((f) => { try { fs.unlinkSync(f); } catch {} });
  }
}

// "말레이시아 가시죠? 비행기 타기 전에 … 돼요. MDAC이라고 하는데, …" → one chunk per sentence
function splitSentences(text) {
  const out = String(text).replace(/\s+/g, ' ').trim().split(/(?<=[.?!。])\s+(?=\S)/).map((x) => x.trim()).filter(Boolean);
  // keep very short fragments with the previous sentence so the rhythm stays natural
  return out.reduce((a, x) => { if (a.length && x.length < 6) a[a.length - 1] += ' ' + x; else a.push(x); return a; }, []);
}

function durationMs(file) {
  const out = execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${file}"`).toString().trim();
  return Math.round(Number(out) * 1000);
}

/**
 * Synthesize every cue. Returns { [cueId]: { file, durationMs, text } }.
 * With opts.dryRun it writes a short silent clip per cue instead of calling the API (for pipeline tests).
 */
// soft thinking sound ("음…") placed quietly before some lines, so the voice breathes like a person
async function fillerClip(lang, cacheDir, opts) {
  const voice = (opts.voices || VOICES)[lang] || VOICES[lang];
  const f = voice?.filler; if (!f || opts.dryRun) return null;
  const file = path.join(cacheDir, `${lang}-filler-${crypto.createHash('sha1').update(JSON.stringify(voice)).digest('hex').slice(0, 10)}.mp3`);
  if (!fs.existsSync(file)) {
    const raw = `${file}.raw.mp3`;
    await synthesize(f.text || (lang === 'ko' ? '음…' : 'Hmm…'), lang, raw, opts.voices, opts.speakingRate);
    // quieter, trimmed, short fade so it sits under the voice like a breath
    execSync(`ffmpeg -y -loglevel error -i "${raw}" -af "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,volume=${f.volume ?? 0.35},afade=t=out:st=0:d=0.01" -ar 24000 -ac 1 -c:a libmp3lame -q:a 2 "${file}"`);
    fs.unlinkSync(raw);
  }
  return file;
}

// put the quiet filler into the natural pauses inside a clip (the short breaks a voice makes at commas)
function fillersAtPauses(clipFile, filler, { minPauseMs = 110, maxCount = 6 } = {}) {
  const out = clipFile.replace(/\.mp3$/, '.c.mp3');
  if (fs.existsSync(out)) return out;
  const total = durationMs(clipFile);
  const log = execSync(`ffmpeg -hide_banner -i "${clipFile}" -af silencedetect=noise=-38dB:d=${minPauseMs / 1000} -f null - 2>&1 || true`, { shell: '/bin/bash' }).toString();
  const starts = [...log.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]) * 1000);
  const ends = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]) * 1000);
  // inner pauses only (not leading/trailing silence), cut at their middle
  const cuts = starts.map((st, i) => [st, ends[i]]).filter(([st, en]) => en && st > 300 && en < total - 300).map(([st, en]) => Math.round((st + en) / 2)).slice(0, maxCount);
  if (!cuts.length) return clipFile;
  const segs = []; let prev = 0;
  for (const [i, c] of cuts.entries()) { const f = `${clipFile}.seg${i}.mp3`; execSync(`ffmpeg -y -loglevel error -i "${clipFile}" -ss ${prev / 1000} -to ${c / 1000} -ar 24000 -ac 1 -c:a libmp3lame -q:a 2 "${f}"`); segs.push(f); prev = c; }
  const last = `${clipFile}.segL.mp3`; execSync(`ffmpeg -y -loglevel error -i "${clipFile}" -ss ${prev / 1000} -ar 24000 -ac 1 -c:a libmp3lame -q:a 2 "${last}"`);
  const list = `${clipFile}.cp.txt`;
  fs.writeFileSync(list, [...segs.flatMap((sg) => [sg, filler]), last].map((p) => `file '${path.resolve(p)}'`).join('\n'));
  execSync(`ffmpeg -y -loglevel error -f concat -safe 0 -i "${list}" -ar 24000 -ac 1 -c:a libmp3lame -q:a 2 "${out}"`);
  [...segs, last, list].forEach((f) => { try { fs.unlinkSync(f); } catch {} });
  return out;
}

function withFiller(clipFile, filler, gapMs = 120) {
  const out = clipFile.replace(/\.mp3$/, '.f.mp3');
  if (fs.existsSync(out)) return out;
  const sil = `${clipFile}.gap.mp3`;
  execSync(`ffmpeg -y -loglevel error -f lavfi -i anullsrc=r=24000:cl=mono -t ${gapMs / 1000} -c:a libmp3lame -q:a 4 "${sil}"`);
  const list = `${clipFile}.fl.txt`;
  fs.writeFileSync(list, [filler, sil, clipFile].map((p) => `file '${path.resolve(p)}'`).join('\n'));
  execSync(`ffmpeg -y -loglevel error -f concat -safe 0 -i "${list}" -ar 24000 -ac 1 -c:a libmp3lame -q:a 2 "${out}"`);
  fs.unlinkSync(list); fs.unlinkSync(sil);
  return out;
}

async function narrate(form, lang, cacheDir, opts = {}) {
  fs.mkdirSync(cacheDir, { recursive: true });
  const script = buildScript(form, lang, opts.target);
  const clips = {};
  const filler = await fillerClip(lang, cacheDir, opts).catch((e) => { console.warn('  filler skipped:', e.message); return null; });
  const fcfg = ((opts.voices || VOICES)[lang] || {}).filler || {};
  for (const line of script) {
    const h = crypto.createHash('sha1').update(`${lang}|${(opts.voices || VOICES)[lang]?.name}|p3|${JSON.stringify((opts.voices || VOICES)[lang] || {})}|${line.text}`).digest('hex').slice(0, 12);
    const file = path.join(cacheDir, `${lang}-${h}.mp3`);
    if (!fs.existsSync(file)) {
      if (opts.dryRun) {
        const sec = Math.max(1.2, Math.min(12, line.text.length / (lang === 'ko' ? 5.5 : 14)));   // rough speaking time
        execSync(`ffmpeg -y -loglevel error -f lavfi -i anullsrc=r=24000:cl=mono -t ${sec.toFixed(2)} -c:a libmp3lame -q:a 9 "${file}"`);
      } else {
        await synthesize(line.text, lang, file, opts.voices, opts.speakingRate);
      }
    }
    // a quiet "음" before mistake explanations and before every few other lines (stable choice per line)
    const h2 = parseInt(crypto.createHash('md5').update(line.id).digest('hex').slice(0, 6), 16);
    const wantFiller = filler && (/-mistake$/.test(line.id) ? fcfg.onMistakes !== false : (h2 % (fcfg.every || 4)) === 0) && !/^card-intro$/.test(line.id);
    let use = file;
    if (filler && fcfg.atPauses) use = fillersAtPauses(use, filler, fcfg);          // quiet "음" at comma pauses
    else if (wantFiller) use = withFiller(file, filler);                             // or before some lines
    clips[line.id] = { file: use, durationMs: durationMs(use), text: line.text };
  }
  return clips;
}

module.exports = { setBudget, buildScript, narrate, synthesize, splitSentences, fillerClip, withFiller, fillersAtPauses, VOICES };
