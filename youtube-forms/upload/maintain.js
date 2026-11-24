#!/usr/bin/env node
// Channel maintenance (both channels). Idempotent — safe to run after every daily upload.
//
//   node upload/maintain.js --config upload/config.ci.json            # all tasks
//   node upload/maintain.js --config upload/config.ci.json --only playlists
//
// Tasks
//   disclosure  add the AI-narration line to descriptions that lack it and set containsSyntheticMedia
//   playlists   keep one "travel prep" playlist per country (config.playlists) with our videos in order
//   affiliate   add the affiliate block (eSIM / airport transfer / tours) to videos that do not have it yet
//   stats       (only with --only stats) print views per video
//   links       print where each affiliate short link redirects (to check the mapping)
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { authorize } = require('./auth');
const { loadSeo, guessForm } = require('./seo');

const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : null; };
const cfg = JSON.parse(fs.readFileSync(opt('config') || path.join(__dirname, 'config.ci.json'), 'utf8'));
const only = opt('only');
const want = (t) => !only || only.split(',').includes(t);

const AI_LINE = {
  ko: '🎙 내레이션은 AI 음성(Google TTS)이며, 화면과 내용은 직접 확인해 만들었습니다.',
  en: '🎙 Narration uses an AI voice (Google TTS); the steps and content were checked by us.',
};

async function ourVideos(yt) {
  const ch = (await yt.channels.list({ part: ['contentDetails'], mine: true })).data.items?.[0];
  const ids = []; let pageToken;
  do {
    const r = await yt.playlistItems.list({ part: ['contentDetails'], playlistId: ch.contentDetails.relatedPlaylists.uploads, maxResults: 50, pageToken });
    ids.push(...r.data.items.map((i) => i.contentDetails.videoId)); pageToken = r.data.nextPageToken;
  } while (pageToken && ids.length < 500);
  const out = [];
  for (let i = 0; i < ids.length; i += 50) out.push(...(await yt.videos.list({ part: ['snippet', 'status', 'contentDetails', 'statistics'], id: ids.slice(i, i + 50) })).data.items);
  return out;
}

async function disclosure(yt, videos, lang) {
  let n = 0;
  for (const v of videos) {
    const sn = v.snippet, st = v.status;
    const needDesc = !sn.description.includes('AI'), needFlag = st.containsSyntheticMedia !== true;
    if (!needDesc && !needFlag) continue;
    const parts = [];
    if (needDesc) {
      const line = AI_LINE[(sn.defaultLanguage || lang).slice(0, 2)] || AI_LINE.en;
      const lines = sn.description.split('\n');
      const tagAt = lines.findIndex((l) => l.trim().startsWith('#'));   // keep hashtags last
      if (tagAt >= 0) lines.splice(tagAt, 0, line, ''); else lines.push('', line);
      await yt.videos.update({ part: ['snippet'], requestBody: { id: v.id, snippet: { title: sn.title, description: lines.join('\n').slice(0, 4990), tags: sn.tags, categoryId: sn.categoryId, defaultLanguage: sn.defaultLanguage } } });
      parts.push('description');
    }
    if (needFlag) {
      const status = { privacyStatus: st.privacyStatus, embeddable: st.embeddable, license: st.license, publicStatsViewable: st.publicStatsViewable, selfDeclaredMadeForKids: false, containsSyntheticMedia: true, ...(st.publishAt ? { publishAt: st.publishAt } : {}) };
      await yt.videos.update({ part: ['status'], requestBody: { id: v.id, status } });
      parts.push('AI flag');
    }
    n++; console.log(`  ✔ ${v.id} ${parts.join(' + ')}  ${sn.title.slice(0, 50)}`);
  }
  console.log(`  disclosure: ${n} video(s) updated`);
}

async function playlists(yt, videos, lang, seo) {
  const plan = cfg.playlists?.[lang]; if (!plan) return;
  const mine = []; let pageToken;
  do { const r = await yt.playlists.list({ part: ['snippet'], mine: true, maxResults: 50, pageToken }); mine.push(...r.data.items); pageToken = r.data.nextPageToken; } while (pageToken);
  // videos by form (newest first; Shorts excluded)
  const byForm = {};
  for (const v of videos) {
    if (/#Shorts/i.test(v.snippet.title) || v.status.privacyStatus === 'private' && !v.status.publishAt) continue;
    const f = guessForm(seo, lang, `${v.snippet.title} ${(v.snippet.tags || []).join(' ')}`);
    if (f && !byForm[f]) byForm[f] = v;
  }
  for (const [title, forms] of Object.entries(plan)) {
    const vids = forms.map((f) => byForm[f]).filter(Boolean);
    if (!vids.length) continue;
    let pl = mine.find((p) => p.snippet.title === title), fresh = false;
    if (!pl) {
      pl = (await yt.playlists.insert({ part: ['snippet', 'status'], requestBody: { snippet: { title, description: cfg.playlistDescription?.[lang] || '', defaultLanguage: lang }, status: { privacyStatus: 'public' } } })).data;
      console.log(`  ＋ playlist "${title}"`); fresh = true;
    }
    // a just-created playlist can take a few seconds to become visible → retry on "not found"
    const retry = async (fn) => { for (let i = 0; ; i++) { try { return await fn(); } catch (e) { if (i < 6 && !/quota/i.test(e.message)) await new Promise((r) => setTimeout(r, 3000 * (i + 1))); else throw e; } } };
    const items = fresh ? [] : (await retry(() => yt.playlistItems.list({ part: ['contentDetails'], playlistId: pl.id, maxResults: 50 }))).data.items.map((i) => i.contentDetails.videoId);
    let pos = 0;
    for (const v of vids) {
      if (!items.includes(v.id)) {
        await retry(() => yt.playlistItems.insert({ part: ['snippet'], requestBody: { snippet: { playlistId: pl.id, position: Math.min(pos, items.length), resourceId: { kind: 'youtube#video', videoId: v.id } } } }));
        items.splice(Math.min(pos, items.length), 0, v.id);
        console.log(`  ✔ "${title}" ← ${v.snippet.title.slice(0, 40)}`);
      }
      pos = items.indexOf(v.id) + 1;
    }
  }
}

const AFF = {
  ko: { disclosure: '※ 아래 링크로 구매하시면 채널에 수수료가 지급될 수 있습니다. 가격은 동일합니다.', esim: '📱 eSIM', pickup: '🚆 공항 픽업·교통', hotel: '🏨 호텔', tour: '🎟 투어·입장권' },
  en: { disclosure: '※ Links below may earn this channel a commission at no extra cost to you.', esim: '📱 eSIM', pickup: '🚆 Airport transfer', hotel: '🏨 Hotels', tour: '🎟 Tours & tickets' },
};
async function affiliate(yt, videos, lang, seo) {
  let n = 0;
  for (const v of videos) {
    const sn = v.snippet;
    // drop placeholder links (".../REPLACE...") and their old disclosure line, then add the real block once
    const t0 = AFF[(sn.defaultLanguage || lang).slice(0, 2)] || AFF.en;
    const base = sn.description.split('\n').filter((x) => !/REPLACE/.test(x) && x !== t0.disclosure);
    if (/tpk\.lv|tp\.st/.test(base.join('\n'))) continue;   // already has real affiliate links
    sn.description = base.join('\n');
    const l = (sn.defaultLanguage || lang).slice(0, 2); const t = AFF[l] || AFF.en;
    const form = guessForm(seo, l, `${sn.title} ${(sn.tags || []).join(' ')}`);
    const country = form && cfg.affiliateByForm?.[form];
    const aff = (country && cfg.affiliate?.default?.[country]) || cfg.affiliate?.fallback || {};
    const lines = ['esim', 'pickup', 'hotel', 'tour'].filter((k) => aff[k]).map((k) => `${t[k]}: ${aff[k]}`);
    if (!lines.length) continue;
    const d = sn.description.split('\n');
    const at = Math.max(0, d.findIndex((x) => /^📌/.test(x)) + 1) || Math.min(2, d.length);   // right after the official-site line
    d.splice(at, 0, t.disclosure, ...lines, '');
    await yt.videos.update({ part: ['snippet'], requestBody: { id: v.id, snippet: { title: sn.title, description: d.join('\n').slice(0, 4990), tags: sn.tags, categoryId: sn.categoryId, defaultLanguage: sn.defaultLanguage } } });
    n++; console.log(`  ✔ affiliate → ${v.id} (${form || 'general'})  ${sn.title.slice(0, 40)}`);
  }
  console.log(`  affiliate: ${n} video(s) updated`);
}
async function checkLinks() {
  const urls = new Set(); const all = [cfg.affiliate?.fallback, ...Object.values(cfg.affiliate?.default || {})];
  for (const a of all) for (const [k, u] of Object.entries(a || {})) if (/^https?:/.test(u)) urls.add(`${k}|${u}`);
  for (const x of urls) {
    const [k, u] = x.split('|');
    let loc = ''; try { const r = await fetch(u, { redirect: 'manual' }); loc = r.headers.get('location') || `(status ${r.status})`; } catch (e) { loc = 'ERR ' + e.message; }
    const target = decodeURIComponent(loc).match(/https?:\/\/(www\.)?(airalo|klook|agoda)[^\s&"]*/i)?.[0] || loc.slice(0, 160);
    console.log(`  link ${k.padEnd(6)} ${u} → ${target}`);
  }
}

(async () => {
  const seo = loadSeo(cfg);
  if (want('links')) await checkLinks();
  const chans = Object.entries(cfg.channelIds || { ko: null, en: null });
  for (const [ch] of chans) {
    const lang = ch;   // token key == primary language of that channel
    console.log(`▶ channel ${ch}`);
    try {
      const yt = google.youtube({ version: 'v3', auth: await authorize(ch) });
      const videos = await ourVideos(yt);
      if (only && want('stats')) {   // read-only: views per video (only when asked: --only stats)
        let pub = 0, views = 0;
        for (const v of videos) { const p = v.status.privacyStatus, n = Number(v.statistics?.viewCount || 0); if (p === 'public') { pub++; views += n; }
          console.log(`  STAT ${ch} ${p.padEnd(8)} ${String(n).padStart(6)} views  ${(v.snippet.publishedAt || '').slice(0, 10)}  ${v.status.publishAt ? '(scheduled ' + v.status.publishAt.slice(0, 16) + ') ' : ''}${v.id}  ${v.snippet.title.slice(0, 60)}`); }
        console.log(`  STAT ${ch} TOTAL public ${pub} of ${videos.length} uploaded, ${views} views`);
      }
      if (want('disclosure')) await disclosure(yt, videos, lang);
      if (want('playlists')) await playlists(yt, videos, lang, seo);
      if (want('affiliate')) await affiliate(yt, videos, lang, seo);
    } catch (e) { console.error(`  ✖ ${ch}: ${e?.response?.data?.error?.message || e.message}`); process.exitCode = 1; }
  }
})();
