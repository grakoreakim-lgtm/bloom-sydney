#!/usr/bin/env node
// Comments: read new viewer comments into an inbox, and post replies the owner approved.
//
//   node upload/comments.js scopes                 # which permissions the channel tokens have (no secrets printed)
//   node upload/comments.js fetch [--days 14]      # → ops/comments/inbox-<date>.json (comments we have not answered)
//   node upload/comments.js post ops/comments/replies-<date>.json   # posts entries with "approved": true, once
//
// Replies are written by Claude (see ops/roles/comments.md), never by this script.
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { authorize } = require('./auth');

const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : null; };
const cfg = JSON.parse(fs.readFileSync(opt('config') || path.join(__dirname, 'config.ci.json'), 'utf8'));
const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'ops', 'comments');
const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);   // KST date
const chans = Object.keys(cfg.channelIds || { ko: 1, en: 1 });
const MAX_POST = 20, MAX_LEN = 600;

async function scopes() {
  for (const ch of chans) {
    try {
      const auth = await authorize(ch); const { token } = await auth.getAccessToken();
      const info = await (await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${token}`)).json();
      const s = String(info.scope || '').split(' ').map((x) => x.replace('https://www.googleapis.com/auth/', ''));
      console.log(`${ch}: ${s.join(', ')}  → read comments: ${s.some((x) => /^youtube(\.force-ssl|\.readonly)?$/.test(x)) ? 'yes' : 'no'}, reply: ${s.includes('youtube.force-ssl') ? 'yes' : 'needs youtube.force-ssl'}`);
    } catch (e) { console.log(`${ch}: ✖ ${e.message}`); }
  }
}

async function fetchInbox() {
  const days = Number(opt('days') || 14); const since = Date.now() - days * 86400e3;
  const inbox = [];
  for (const ch of chans) {
    try {
      const yt = google.youtube({ version: 'v3', auth: await authorize(ch) });
      const me = (await yt.channels.list({ part: ['id'], mine: true })).data.items?.[0]?.id;
      let pageToken, n = 0;
      do {
        const r = await yt.commentThreads.list({ part: ['snippet', 'replies'], allThreadsRelatedToChannelId: me, maxResults: 100, order: 'time', textFormat: 'plainText', pageToken });
        for (const t of r.data.items || []) {
          const top = t.snippet.topLevelComment; const s = top.snippet;
          if (Date.parse(s.publishedAt) < since) { pageToken = null; break; }
          const replies = t.replies?.comments || [];
          const answered = replies.some((c) => c.snippet.authorChannelId?.value === me);
          if (s.authorChannelId?.value === me || answered) continue;
          inbox.push({ n: ++n, channel: ch, videoId: s.videoId, threadId: t.id, commentId: top.id, author: s.authorDisplayName, text: s.textOriginal, likes: s.likeCount, at: s.publishedAt, replies: replies.length });
        }
        pageToken = pageToken === null ? null : r.data.nextPageToken;
      } while (pageToken);
    } catch (e) { console.log(`✖ ${ch}: ${e?.response?.data?.error?.message || e.message}`); process.exitCode = 1; }
  }
  // video titles for context
  const ids = [...new Set(inbox.map((c) => c.videoId))];
  if (ids.length) for (const ch of chans) {
    try { const yt = google.youtube({ version: 'v3', auth: await authorize(ch) });
      for (let i = 0; i < ids.length; i += 50) for (const v of (await yt.videos.list({ part: ['snippet'], id: ids.slice(i, i + 50) })).data.items || []) inbox.filter((c) => c.videoId === v.id).forEach((c) => { c.video = v.snippet.title; }); } catch {}
  }
  fs.mkdirSync(DIR, { recursive: true });
  const f = path.join(DIR, `inbox-${today}.json`);
  fs.writeFileSync(f, JSON.stringify({ fetchedAt: new Date().toISOString(), days, comments: inbox }, null, 1));
  console.log(`inbox: ${inbox.length} unanswered comment(s) → ${path.relative(ROOT, f)}`);
  inbox.slice(0, 30).forEach((c) => console.log(`  [${c.channel}] ${c.video?.slice(0, 40) || c.videoId} — ${c.text.replace(/\s+/g, ' ').slice(0, 100)}`));
}

async function post(file) {
  const offers = JSON.parse(fs.readFileSync(path.join(__dirname, 'offers.json'), 'utf8'));
  const allowed = new Set(offers.offers.flatMap((o) => Object.values(o.link)));
  const j = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
  // owner's rules: not pushy, not repetitive — checked against this file and every earlier replies-*.json
  const PUSHY = /지금 바로|놓치지|강추|무조건|최저가|한정|서두르|대박|buy now|don't miss|hurry|limited time|best deal|must[- ]have/i;
  const sentences = (t) => t.split(/(?<=[.!?。…])\s+|\n+/).map((x) => x.trim()).filter(Boolean);
  const norm = (x) => x.replace(/[\s.!?。…~,]+/g, ' ').trim().toLowerCase();
  const earlier = fs.readdirSync(DIR).filter((f) => /^replies-.*\.json$/.test(f) && path.resolve(DIR, f) !== path.resolve(file))
    .flatMap((f) => { try { return JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')).replies || []; } catch { return []; } }).filter((r) => r.postedId);
  const pool = [...earlier, ...(j.replies || []).filter((r) => r.approved)];
  const firsts = {}, lasts = {}, longs = {};
  for (const r of pool) { const ss = sentences(r.reply); if (!ss.length) continue;
    firsts[norm(ss[0])] = (firsts[norm(ss[0])] || 0) + 1; lasts[norm(ss[ss.length - 1])] = (lasts[norm(ss[ss.length - 1])] || 0) + 1;
    for (const x of ss) if (x.split(/\s+/).length > 8) longs[norm(x)] = (longs[norm(x)] || 0) + 1; }
  const withOffer = (j.replies || []).filter((r) => r.approved && r.offer).length, total = (j.replies || []).filter((r) => r.approved).length;
  let posted = 0;
  for (const r of j.replies || []) {
    if (!r.approved || r.postedId) continue;
    if (posted >= MAX_POST) { console.log('  ⏭ limit reached for this run'); break; }
    const links = (r.reply.match(/https?:\/\/\S+/g) || []);
    const problems = [];
    if (r.reply.length > MAX_LEN) problems.push(`longer than ${MAX_LEN} characters`);
    if (links.length > 1) problems.push('more than one link');
    if (links.some((l) => !allowed.has(l.replace(/[).,]+$/, '')) && !/youtu\.be\/|youtube\.com\//.test(l))) problems.push('link not in offers.json');
    if (links.some((l) => allowed.has(l.replace(/[).,]+$/, ''))) && !/제휴|affiliate|commission|수수료/i.test(r.reply)) problems.push('affiliate link without disclosure');
    if (PUSHY.test(r.reply)) problems.push('pushy wording');
    const ss = sentences(r.reply);
    if (ss.length && firsts[norm(ss[0])] > 1) problems.push('same opening as another reply');
    if (ss.length > 1 && lasts[norm(ss[ss.length - 1])] > 1) problems.push('same closing as another reply');
    if (ss.some((x) => x.split(/\s+/).length > 8 && longs[norm(x)] > 1)) problems.push('repeats a sentence from another reply');
    if (r.offer && total >= 1 && withOffer > Math.max(1, Math.floor(total / 5))) problems.push(`too many product replies today (${withOffer} of ${total}; max 1 in 5)`);
    if (problems.length) { console.log(`  ✖ #${r.n}: ${problems.join('; ')} — not posted`); continue; }
    try {
      const yt = google.youtube({ version: 'v3', auth: await authorize(r.channel) });
      const res = await yt.comments.insert({ part: ['snippet'], requestBody: { snippet: { parentId: r.commentId, textOriginal: r.reply } } });
      r.postedId = res.data.id; r.postedAt = new Date().toISOString(); posted++;
      console.log(`  ✔ #${r.n} replied on ${r.videoId}`);
    } catch (e) { r.error = e?.response?.data?.error?.message || e.message; console.log(`  ✖ #${r.n}: ${r.error}`); process.exitCode = 1; }
  }
  fs.writeFileSync(path.resolve(file), JSON.stringify(j, null, 1));
  console.log(`posted ${posted}`);
}

(async () => {
  const cmd = argv[0];
  if (cmd === 'scopes') return scopes();
  if (cmd === 'fetch') return fetchInbox();
  if (cmd === 'post') return post(argv[1]);
  console.log('usage: comments.js scopes | fetch [--days N] | post <replies.json>');
})().catch((e) => { console.error(e.message); process.exit(1); });
