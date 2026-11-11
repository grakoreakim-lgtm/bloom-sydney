// pipeline.produce(): one video from a form definition — record → narrate → mux → thumbnail → metadata → (upload)
// Shared by upload/run-day.js (calendar CSV) and studio/worker.js (dashboard schedule).
const fs = require('fs');
const path = require('path');
const { Recorder } = require('../lib/recorder');
const { narrate } = require('./narration');
const { mux } = require('./mux');
const { thumbnail } = require('./thumbnail');
const { buildMetadata } = require('./metadata');
const { upload } = require('./upload');

const ROOT = path.join(__dirname, '..');

/**
 * @param job {
 *   form: object (forms/<id>.js), lang: 'ko'|'en'…, date: 'YYYY-MM-DD', slot: 1..n,
 *   title: string (optional; else form.videoTitle[lang]), officialUrl?: string,
 *   channelToken: 'ko' (token file suffix) | null, affiliate: {esim,hotel,pickup,tour},
 *   outDir: string, cfg: config object, dry: bool, fakeTts: bool, onLog?: (msg)=>void
 * }
 */
async function produce(job) {
  const { form, lang, cfg } = job;
  const log = (m) => { job.onLog?.(m); };
  if (!form.strings?.[lang]) throw new Error(`form "${form.id}" has no "${lang}" text`);
  fs.mkdirSync(job.outDir, { recursive: true });
  const base = path.join(job.outDir, `${form.id}-${lang}`);
  const year = String(job.date || new Date().toISOString().slice(0, 10)).slice(0, 4);

  log('narration');
  const clips = await narrate(form, lang, path.join(ROOT, 'out', 'tts-cache'), { dryRun: job.fakeTts, voices: cfg.tts?.voices, speakingRate: cfg.tts?.speakingRate });
  const narration = Object.fromEntries(Object.entries(clips).map(([k, v]) => [k, v.durationMs]));

  log('record');
  const rec = new Recorder(form, { target: cfg.target || 'mock', lang, outDir: path.join(job.outDir, 'rec'), narration });
  const r = await rec.run();

  log('mux');
  const video = mux(r.mp4, r.timeline.cues, clips, `${base}.mp4`, { bgm: cfg.bgm || null });

  log('thumbnail');
  const shot = r.shots.find((s) => /step1-/.test(s)) || r.shots[1];
  const country = form.country?.[lang] || form.country?.en || '';
  const thumb = await thumbnail({ flag: form.flag || '', country, form: form.title?.[lang] || form.title?.en || form.id, lang, year, shot }, `${base}.png`);

  log('metadata');
  const title = (job.title || form.videoTitle?.[lang] || form.title?.[lang] || form.id).replace('{year}', year);
  const row = { '언어': lang.toUpperCase(), '제목(초안)': title, '공식 URL(설명란 1줄)': job.officialUrl || form.url?.live || '', '비용': form.fee || '', '제출 시점·유효': form.when || '',
                '서식/주제': form.title?.[lang] || form.id, '국가': `${form.flag || ''} ${country}`.trim(), '슬롯': String(job.slot || 1), '날짜': job.date };
  const meta = buildMetadata(row, form, r.timeline, job.affiliate || {}, cfg);
  fs.writeFileSync(`${base}.meta.json`, JSON.stringify(meta, null, 1));

  log(job.dry ? 'dry run — skipping upload' : 'upload');
  const up = job.channelToken ? await upload(job.channelToken, meta, video, thumb, { dryRun: job.dry }) : { id: null, url: '(no channel)' };
  return { video, thumb, meta, url: up.url, videoId: up.id, duration: r.timeline.cues.at(-1)?.t };
}

module.exports = { produce };
