// Scheduler: turn a channel's configuration into dated schedule rows.
// channel = { packs:[], langs:[], perDay:n, startDate, publishHours:[], tz }
const store = require('./store');
const { catalog } = require('./topics');

const addDays = (d, n) => { const x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };

/** Candidate (topic, lang) pairs for a channel, ready topics only, in pack order, languages interleaved. */
function candidates(channel) {
  const cat = catalog().filter((p) => channel.packs.includes(p.id));
  const topics = cat.flatMap((p) => p.topics.filter((t) => t.ready).map((t) => ({ ...t, pack: p.id })));
  const out = [];
  for (const lang of channel.langs) for (const t of topics) if (t.langs.includes(lang)) out.push({ topicId: t.id, pack: t.pack, lang, title: t.title[lang] || t.title.en });
  // interleave languages: ko, en, ko, en … so both channels' audiences get something daily
  const byLang = Object.fromEntries(channel.langs.map((l) => [l, out.filter((o) => o.lang === l)]));
  const mixed = []; while (Object.values(byLang).some((q) => q.length)) for (const l of channel.langs) if (byLang[l].length) mixed.push(byLang[l].shift());
  return mixed;
}

/** Plan `days` days from channel.startDate (or today), skipping (topic,lang) already on this channel's schedule. */
function plan(channelId, days = 30) {
  const ch = store.find('channels', (c) => c.id === channelId); if (!ch) throw new Error('channel not found');
  const existing = new Set(store.filter('schedule', (s) => s.channelId === channelId && s.status !== 'skipped').map((s) => `${s.topicId}|${s.lang}`));
  const queue = candidates(ch).filter((c) => !existing.has(`${c.topicId}|${c.lang}`));
  const lastDate = store.filter('schedule', (s) => s.channelId === channelId).map((s) => s.date).sort().at(-1);
  let date = lastDate ? addDays(lastDate, 1) : (ch.startDate || new Date().toISOString().slice(0, 10));
  const created = [];
  for (let d = 0; d < days && queue.length; d++, date = addDays(date, 1)) {
    const n = ch.rampDays && d < ch.rampDays ? Math.max(1, Math.ceil(ch.perDay / 2)) : ch.perDay;
    for (let slot = 1; slot <= n && queue.length; slot++) {
      const c = queue.shift();
      created.push(store.insert('schedule', { channelId, date, slot, topicId: c.topicId, pack: c.pack, lang: c.lang, title: c.title.replace('{year}', date.slice(0, 4)), status: 'planned' }));
    }
  }
  return { created: created.length, remaining: queue.length, created_rows: created };
}

module.exports = { plan, candidates };
