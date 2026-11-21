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
function buildScript(form, lang) {
  const t = form.strings[lang];
  const lines = [];
  let n = 0;
  for (const step of form.steps) {
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

async function synthesize(text, lang, outFile, voices = VOICES, speakingRate = 1.0) {
  const key = process.env.GOOGLE_TTS_API_KEY || process.env.GOOGLE_TTS_KEY_VIA_PROXY;   // the latter: any placeholder, a proxy injects the real header
  if (!key) throw new Error('GOOGLE_TTS_API_KEY is not set');
  const voice = voices[lang] || VOICES[lang];
  const res = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    // Chirp 3 HD voices (most natural) take plain text; only send speakingRate when it is not the default
    body: JSON.stringify({ input: { text }, voice: { languageCode: voice.languageCode, name: voice.name }, audioConfig: { audioEncoding: 'MP3', ...(speakingRate && speakingRate !== 1 ? { speakingRate } : {}) } }),
  });
  if (!res.ok) throw new Error(`TTS ${res.status}: ${await res.text()}`);
  const { audioContent } = await res.json();
  fs.writeFileSync(outFile, Buffer.from(audioContent, 'base64'));
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
  const script = buildScript(form, lang);
  const clips = {};
  for (const line of script) {
    const h = crypto.createHash('sha1').update(`${lang}|${(opts.voices || VOICES)[lang]?.name}|${line.text}`).digest('hex').slice(0, 12);
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

module.exports = { buildScript, narrate, synthesize, VOICES };
