// Worker: every tick, produce schedule rows that are due (date <= today + leadDays), one at a time.
const path = require('path');
const store = require('./store');
const { loadForm } = require('./topics');
const { produce } = require('../upload/pipeline');

let busy = false;
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (d, n) => { const x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };

async function tick() {
  if (busy) return; busy = true;
  try {
    const s = store.settings();
    const horizon = addDays(today(), s.leadDays ?? 1);
    const row = store.filter('schedule', (r) => r.status === 'planned' && r.date <= horizon).sort((a, b) => a.date.localeCompare(b.date) || a.slot - b.slot)[0];
    if (!row) return;
    await runRow(row.id);
  } finally { busy = false; }
}

async function runRow(rowId, opts = {}) {
  const row = store.find('schedule', (r) => r.id === rowId); if (!row) throw new Error('row not found');
  const ch = store.find('channels', (c) => c.id === row.channelId);
  const s = store.settings();
  const form = loadForm(row.topicId); if (!form) { store.update('schedule', row.id, { status: 'error', error: 'form definition missing' }); return; }
  const job = store.insert('jobs', { scheduleId: row.id, channelId: ch.id, state: 'running', log: [], startedAt: new Date().toISOString() });
  store.update('schedule', row.id, { status: 'producing', jobId: job.id });
  const onLog = (m) => { job.log.push(`${new Date().toISOString().slice(11, 19)} ${m}`); store.save(); };
  try {
    const cfg = { target: s.target, tts: s.tts, bgm: s.bgm || null, timezone: { default: ch.tz || 'Asia/Seoul' }, publishHours: { default: ch.publishHours || [7, 12, 18, 20, 22] }, hashtags: ch.hashtags || {}, tags: ch.tags || {} };
    const country = form.country?.[row.lang] || form.country?.en || '';
    const affiliate = (ch.affiliate || {})[country] || (ch.affiliate || {}).fallback || {};
    const res = await produce({ form, lang: row.lang, date: row.date, slot: row.slot, title: row.title, channelToken: ch.connected ? ch.id : null, affiliate, cfg,
                                outDir: path.join(__dirname, '..', 'out', 'studio', ch.id, row.date, `${row.slot}-${row.topicId}-${row.lang}`), dry: opts.dry ?? s.dry, fakeTts: opts.fakeTts ?? s.fakeTts, onLog });
    store.update('jobs', job.id, { state: 'done', finishedAt: new Date().toISOString(), outputs: { video: res.video, thumb: res.thumb, url: res.url, videoId: res.videoId, publishAt: res.meta.publishAt } });
    store.update('schedule', row.id, { status: (opts.dry ?? s.dry) ? 'produced' : 'scheduled', videoUrl: res.url, publishAt: res.meta.publishAt, video: res.video, thumb: res.thumb });
  } catch (e) {
    onLog('ERROR ' + e.message);
    store.update('jobs', job.id, { state: 'error', error: e.message, finishedAt: new Date().toISOString() });
    store.update('schedule', row.id, { status: 'error', error: e.message });
  }
}

function start(intervalMs = 30000) { setInterval(() => tick().catch((e) => console.error('worker', e)), intervalMs); }

module.exports = { start, tick, runRow };
