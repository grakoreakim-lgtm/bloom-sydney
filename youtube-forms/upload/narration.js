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

/** @returns {{id:string,text:string}[]} */
function buildScript(form, lang, target = 'mock') {
  const t = form.strings[lang];
  const steps = (target === 'live' && form.stepsLive) || form.steps;   // must match lib/recorder.js
  const lines = [];
  let n = 0;
  for (const step of steps) {
    if (step.type === 'card') {
      const c = step.card[lang];
      lines.push({ id: `card-${c.id}`, text: clean(c.speech || [c.title, c.subtitle, ...(c.chips || [])].filter(Boolean).join('. ')) });
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
  const sentences = splitSentences(text);
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
async function narrate(form, lang, cacheDir, opts = {}) {
  fs.mkdirSync(cacheDir, { recursive: true });
  const script = buildScript(form, lang, opts.target);
  const clips = {};
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
    clips[line.id] = { file, durationMs: durationMs(file), text: line.text };
  }
  return clips;
}

module.exports = { buildScript, narrate, synthesize, splitSentences, VOICES };
