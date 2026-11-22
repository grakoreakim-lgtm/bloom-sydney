#!/usr/bin/env node
// "Record first, script second" videos (Apps & AI channel): turn a real screen recording + a demo.json written
// AFTER watching it into a finished video — narration per segment, captions, intro/outro cards, music, QA.
//
//   node upload/demo.js <demoDir> [--fake-tts] [--upload] [--config upload/config.ci.json]
//
// <demoDir>/screen.mp4   the raw screen recording of the real app (made on the Mac)
// <demoDir>/demo.json    { id, channel, lang, title, lead, tags[], hashtags[], checkedOn, sources[],
//                          intro:{title,say}, segments:[{from,to,caption,say}], outro:{title,say} }
//                        from/to are seconds in screen.mp4. Segments may skip dead time (waiting for the AI).
// Output: <demoDir>/out/<id>.mp4, .png (thumbnail), .qa.json.  --upload sends it PRIVATE (publish after approval).
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { synthesize } = require('./narration');
const { pickBgm } = require('./mux');

const argv = process.argv.slice(2);
const flag = (k) => argv.includes(`--${k}`);
const opt = (k) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : null; };
const dir = path.resolve(argv.find((a) => !a.startsWith('--') && a !== opt('config')) || '.');
const cfg = JSON.parse(fs.readFileSync(opt('config') || path.join(__dirname, 'config.ci.json'), 'utf8'));
const ROOT = path.join(__dirname, '..');
const sh = (c) => execSync(c, { stdio: ['ignore', 'pipe', 'pipe'], shell: '/bin/bash' }).toString();
const dur = (f) => Number(sh(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${f}"`).trim());
const W = 1280, H = 720, FPS = 30;

function font() {
  const c = ['/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc', '/System/Library/Fonts/AppleSDGothicNeo.ttc', '/System/Library/Fonts/Supplemental/Arial Unicode.ttf', '/Library/Fonts/Arial Unicode.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'];
  const f = c.find((x) => fs.existsSync(x)); if (f) return f;
  try { return sh('fc-match -f "%{file}" "sans:bold"').trim(); } catch { return ''; }
}
// wrap text for drawtext (it does not wrap by itself)
function wrap(text, max) {
  const out = []; let line = '';
  for (const w of String(text).split(/\s+/)) { if ((line + ' ' + w).trim().length > max) { out.push(line.trim()); line = w; } else line += ' ' + w; }
  if (line.trim()) out.push(line.trim());
  return out.join('\n');
}

function check(demo, videoSec) {
  const p = [];
  if (!demo.id || !demo.title) p.push('id and title are required');
  if (!Array.isArray(demo.sources) || !demo.sources.length) p.push('sources[] is empty — every claim needs an official source');
  if (!demo.checkedOn) p.push('checkedOn (date the feature was verified) is missing');
  let prev = -1;
  (demo.segments || []).forEach((s, i) => {
    if (!(s.to > s.from)) p.push(`segment ${i + 1}: "to" must be after "from"`);
    if (s.from < prev) p.push(`segment ${i + 1}: overlaps or is out of order`);
    if (s.to > videoSec + 0.2) p.push(`segment ${i + 1}: ends at ${s.to}s but the recording is ${videoSec.toFixed(1)}s`);
    if (!s.say || !s.say.trim()) p.push(`segment ${i + 1}: narration ("say") is empty`);
    if ((s.caption || '').length > 90) p.push(`segment ${i + 1}: caption longer than 90 characters`);
    prev = s.to;
  });
  if (!(demo.segments || []).length) p.push('no segments');
  return p;
}

(async () => {
  const demo = JSON.parse(fs.readFileSync(path.join(dir, 'demo.json'), 'utf8'));
  const src = path.join(dir, 'screen.mp4');
  const out = path.join(dir, 'out'); fs.mkdirSync(out, { recursive: true });
  const lang = demo.lang || 'en';
  const problems = check(demo, dur(src));
  if (problems.length) { console.log('QA FAIL (before build)\n' + problems.map((x) => '  ✖ ' + x).join('\n')); fs.writeFileSync(path.join(out, `${demo.id || 'demo'}.qa.json`), JSON.stringify({ ok: false, problems }, null, 1)); process.exit(1); }

  const F = font(); const ff = F ? `fontfile='${F}':` : '';
  const brand = cfg.brands?.[demo.channel] || 'Copy My Screen';
  const voices = cfg.tts?.voices;
  const say = async (text, name) => {
    const f = path.join(out, `_${name}.mp3`);
    if (flag('fake-tts')) sh(`ffmpeg -y -loglevel error -f lavfi -i anullsrc=r=24000:cl=mono -t ${Math.max(1.5, text.length / 14).toFixed(2)} -c:a libmp3lame -q:a 9 "${f}"`);
    else { try { await synthesize(text, lang, f, voices, cfg.tts?.speakingRate); } catch (e) { if (!cfg.tts?.fallback?.[lang]) throw e; console.log(`VOICE_FALLBACK demo:${lang} — ${e.message.slice(0, 120)}`); await synthesize(text, lang, f, cfg.tts.fallback, cfg.tts?.speakingRate); } }
    return f;
  };
  const txt = (name, s) => { const f = path.join(out, `_${name}.txt`); fs.writeFileSync(f, s); return f; };
  const parts = []; const report = [];

  // title cards (intro / outro): dark card with the title and the channel brand, as long as its narration
  const card = async (c, name) => {
    if (!c?.say) return;
    const a = await say(c.say, name); const d = dur(a) + 0.6;
    const o = path.join(out, `_${name}.mp4`);
    sh(`ffmpeg -y -loglevel error -f lavfi -i color=c=0x0b1220:s=${W}x${H}:r=${FPS}:d=${d.toFixed(2)} -i "${a}" -filter_complex "[0:v]drawtext=${ff}textfile='${txt(name + 't', wrap(c.title || demo.title, 28))}':fontcolor=white:fontsize=62:line_spacing=14:x=(w-text_w)/2:y=(h-text_h)/2-30,drawtext=${ff}textfile='${txt(name + 'b', '▶ ' + brand)}':fontcolor=0xffd400:fontsize=30:x=(w-text_w)/2:y=h-110[v];[1:a]apad[a]" -map "[v]" -map "[a]" -t ${d.toFixed(2)} -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -c:a aac -ar 44100 -ac 2 "${o}"`);
    parts.push(o);
  };

  await card(demo.intro, 'intro');
  for (const [i, s] of demo.segments.entries()) {
    const a = await say(s.say, `seg${i}`); const need = dur(a) + 0.5; const have = s.to - s.from;
    const hold = Math.max(0, need - have);   // narration longer than the clip → freeze the last frame (never cut speech)
    const o = path.join(out, `_seg${i}.mp4`);
    const cap = s.caption ? `,drawbox=x=0:y=ih-150:w=iw:h=150:color=black@0.72:t=fill,drawtext=${ff}textfile='${txt('cap' + i, wrap(s.caption, 46))}':fontcolor=white:fontsize=40:line_spacing=10:x=(w-text_w)/2:y=h-150+(150-text_h)/2` : '';
    sh(`ffmpeg -y -loglevel error -ss ${s.from} -to ${s.to} -i "${src}" -i "${a}" -filter_complex "[0:v]fps=${FPS},scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=0x0b1220,tpad=stop_mode=clone:stop_duration=${hold.toFixed(2)}${cap}[v];[1:a]apad[a]" -map "[v]" -map "[a]" -t ${(have + hold).toFixed(2)} -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -c:a aac -ar 44100 -ac 2 "${o}"`);
    parts.push(o); report.push({ segment: i + 1, clip: +have.toFixed(1), narration: +need.toFixed(1), frozen: +hold.toFixed(1) });
  }
  await card(demo.outro, 'outro');

  const list = path.join(out, '_list.txt'); fs.writeFileSync(list, parts.map((p) => `file '${p}'`).join('\n'));
  const joined = path.join(out, '_joined.mp4');
  sh(`ffmpeg -y -loglevel error -f concat -safe 0 -i "${list}" -c copy "${joined}"`);
  const final = path.join(out, `${demo.id}.mp4`);
  const bgm = pickBgm(cfg.bgm, demo.id, ROOT);
  if (bgm) { const d = dur(joined); sh(`ffmpeg -y -loglevel error -i "${joined}" -stream_loop -1 -i "${bgm}" -filter_complex "[0:a]asplit=2[v1][sc];[1:a]volume=${cfg.bgmVolume || 0.14},afade=t=in:d=2,afade=t=out:st=${Math.max(0, d - 3).toFixed(2)}:d=3[bg];[bg][sc]sidechaincompress=threshold=0.015:ratio=6:attack=30:release=600[bgd];[v1][bgd]amix=inputs=2:duration=first:normalize=0[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 160k -shortest "${final}"`); }
  else fs.copyFileSync(joined, final);

  // QA after build: speech is never cut; warn when a lot of the video is frozen frames (pacing problem)
  const frozen = report.reduce((a, r) => a + r.frozen, 0), total = dur(final);
  const warn = []; if (frozen / total > 0.35) warn.push(`${Math.round(frozen / total * 100)}% of the video is frozen frames — narration is much longer than the clips; shorten "say" or widen the segments`);
  if (total < 60) warn.push(`video is only ${Math.round(total)}s`);
  const qa = { ok: warn.length === 0, problems: warn, seconds: Math.round(total), segments: report };
  fs.writeFileSync(path.join(out, `${demo.id}.qa.json`), JSON.stringify(qa, null, 1));
  console.log(`QA ${qa.ok ? 'PASS' : 'FAIL'} — ${report.length} segments, ${Math.round(total)}s, frozen ${frozen.toFixed(1)}s`); warn.forEach((x) => console.log('  ✖ ' + x));

  // thumbnail from the middle of the first segment
  const shot = path.join(out, '_shot.png'); const s0 = demo.segments[0];
  sh(`ffmpeg -y -loglevel error -ss ${((s0.from + s0.to) / 2).toFixed(2)} -i "${src}" -frames:v 1 "${shot}"`);
  let thumb = null;
  try { const { thumbnail } = require('./thumbnail'); thumb = await thumbnail({ flag: demo.emoji || '🤖', country: demo.kicker || 'AI, hands-on', form: demo.thumbTitle || demo.title, lang, year: (demo.checkedOn || '').slice(0, 4), shot, brand }, path.join(out, `${demo.id}.png`)); } catch (e) { console.log('  thumbnail skipped:', e.message.split('\n')[0]); }
  fs.readdirSync(out).filter((f) => f.startsWith('_')).forEach((f) => fs.unlinkSync(path.join(out, f)));
  console.log(`✔ ${final}`);

  if (flag('upload')) {
    if (!qa.ok) { console.log('not uploading: QA failed'); process.exit(1); }
    const { upload } = require('./upload');
    const ai = lang === 'ko' ? '🎙 내레이션은 AI 음성이며, 화면은 실제 앱을 직접 써 본 녹화입니다.' : '🎙 Narration uses an AI voice; the screen is a real recording of the real app.';
    const description = [demo.lead || demo.title, '', (lang === 'ko' ? '확인한 날짜: ' : 'Checked on: ') + demo.checkedOn, (lang === 'ko' ? '출처:' : 'Sources:'), ...demo.sources.map((u) => `• ${u}`), '', ai, '', (demo.hashtags || []).map((h) => `#${h}`).join(' ')].join('\n').slice(0, 4900);
    const ids = cfg.channelIds || {}; const ch = demo.channel;
    const up = await upload(ch, { title: demo.title.slice(0, 100), description, tags: demo.tags || [], categoryId: '28', defaultLanguage: lang }, final, thumb, { review: true, expectChannel: ids[ch] || null, forbidChannel: ids[ch] ? null : Object.entries(ids).filter(([k]) => k !== ch).map(([, v]) => v) });
    console.log(`✔ uploaded PRIVATE ${up.url} — publish only after the owner approves`);
    fs.writeFileSync(path.join(out, `${demo.id}.upload.json`), JSON.stringify(up, null, 1));
  }
})().catch((e) => { console.error(e.stderr?.toString?.() || e); process.exit(1); });
