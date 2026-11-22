#!/usr/bin/env node
// Voice audition: renders the same few lines (intro + one tip + one mistake) with several voices
// and writes an HTML page with players.   node upload/voice-samples.js <outDir> <lang> <voice> [<voice> ...]
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { buildScript, synthesize, fillerClip, withFiller } = require('./narration');

(async () => {
  const [outDir, lang, ...voices] = process.argv.slice(2);
  fs.mkdirSync(outDir, { recursive: true });
  const form = require('../forms/mdac');
  const script = buildScript(form, lang);
  const pick = [script.find((l) => l.id.startsWith('card-')), script.find((l) => l.id === 's1-tip'), script.find((l) => l.id === 's1-mistake')].filter(Boolean);
  const langCode = { ko: 'ko-KR', en: 'en-US' }[lang] || lang;
  const ok = [];
  for (const name of voices) {
    try {
      const parts = [];
      // voice spec: "clova:nara", "openai:coral", "gemini-2.5-flash-tts:Kore" (Google Gemini) or a Google voice name
      const useFiller = /\+filler$/.test(name); const spec = name.replace(/\+filler$/, '');
      const [head, vname] = spec.includes(':') ? spec.split(':') : [null, spec];
      const koPrompt = '친근하고 차분한 여행 가이드처럼, 또렷하고 자연스럽게, 너무 빠르지 않게 말해 주세요.';
      const enPrompt = 'Speak like a friendly, calm travel guide: clear, natural and not too fast.';
      const prompt = process.env.TTS_PROMPT || (lang === 'ko' ? koPrompt : enPrompt);
      const voice = head === 'gemini' ? { provider: 'gemini', name: vname, model: 'gemini-2.5-pro-preview-tts', prompt: lang === 'ko' ? '친근하고 차분한 여행 가이드처럼, 또렷하고 자연스럽게, 너무 빠르지 않게 한국어로 읽어 주세요. 지시문은 읽지 말고 아래 문장만 읽으세요:' : 'Read the following like a friendly, calm travel guide. Do not read this instruction:' }
        : head === 'clova' ? { provider: 'clova', name: vname }
        : head === 'openai' ? { provider: 'openai', name: vname, prompt }
        : head ? { languageCode: langCode, name: vname, model: head, prompt }
        : { languageCode: langCode, name: vname };
      if (useFiller) voice.filler = { text: lang === 'ko' ? '음…' : 'Hmm…', volume: 0.35 };
      const fl = useFiller ? await fillerClip(lang, outDir, { voices: { [lang]: voice } }) : null;
      for (const [i, l] of pick.entries()) { const f = path.join(outDir, `_${name.replace(/[:+]/g, '_')}-${i}.mp3`); await synthesize(l.text, lang, f, { [lang]: voice }); parts.push(fl && i > 0 ? withFiller(f, fl) : f); }
      if (fl) fs.unlinkSync(fl);
      const file = name.replace(/[:+]/g, '_');
      const list = path.join(outDir, `_${file}.txt`);
      fs.writeFileSync(list, parts.map((p) => `file '${path.resolve(p)}'`).join('\n'));
      execSync(`ffmpeg -y -loglevel error -f concat -safe 0 -i "${list}" -c:a libmp3lame -q:a 4 "${path.join(outDir, file + '.mp3')}"`);
      parts.forEach((p) => { try { fs.unlinkSync(p); } catch {} }); fs.readdirSync(outDir).filter((x) => /^_/.test(x)).forEach((x) => { try { fs.unlinkSync(path.join(outDir, x)); } catch {} }); fs.unlinkSync(list);
      ok.push(name); console.log('✔', name);
    } catch (e) { console.log('✖', name, e.message.slice(0, 200)); }
  }
  const label = (n) => n.replace(/^[a-z]{2}-[A-Z]{2}-/, '').replace(/^gemini-2\.5-(flash|pro)-tts:/, 'Gemini $1 · ').replace(/^gemini:/, 'Gemini · ').replace(/\+filler$/, ' (작은 \'음\' 포함)').replace(/^clova:/, 'CLOVA · ').replace(/^openai:/, 'OpenAI · ');
  fs.writeFileSync(path.join(outDir, 'index.html'), `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Voice samples</title>
<style>body{font-family:system-ui,sans-serif;margin:0;padding:16px;background:#111;color:#eee}h1{font-size:20px}.v{background:#1d1d1d;border-radius:12px;padding:14px;margin:12px 0}.n{font-weight:700;font-size:18px;margin-bottom:8px}audio{width:100%}p{color:#aaa;font-size:14px;line-height:1.5}</style></head><body>
<h1>목소리 샘플 (${lang})</h1><p>같은 문장을 목소리만 바꿔 읽었습니다. 마음에 드는 이름을 알려 주세요.<br>${pick.map((l) => l.text).join('<br>')}</p>
${ok.map((n) => `<div class="v"><div class="n">${label(n)}</div><audio controls preload="none" src="${n.replace(/[:+]/g, '_')}.mp3"></audio></div>`).join('\n')}
</body></html>`);
})().catch((e) => { console.error(e); process.exit(1); });
