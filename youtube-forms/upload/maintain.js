#!/usr/bin/env node
// Channel maintenance (both channels). Idempotent — safe to run after every daily upload.
//
//   node upload/maintain.js --config upload/config.ci.json            # all tasks
//   node upload/maintain.js --config upload/config.ci.json --only playlists
//
// Tasks
//   disclosure  add the AI-narration line to descriptions that lack it and set containsSyntheticMedia
//   playlists   keep one "travel prep" playlist per country (config.playlists) with our videos in order
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
  for (let i = 0; i < ids.length; i += 50) out.push(...(await yt.videos.list({ part: ['snippet', 'status', 'contentDetails'], id: ids.slice(i, i + 50) })).data.items);
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

(async () => {
  const seo = loadSeo(cfg);
  const chans = Object.entries(cfg.channelIds || { ko: null, en: null });
  for (const [ch] of chans) {
    const lang = ch;   // token key == primary language of that channel
    console.log(`▶ channel ${ch}`);
    try {
      const yt = google.youtube({ version: 'v3', auth: await authorize(ch) });
      const videos = await ourVideos(yt);
      if (want('disclosure')) await disclosure(yt, videos, lang);
      if (want('playlists')) await playlists(yt, videos, lang, seo);
    } catch (e) { console.error(`  ✖ ${ch}: ${e?.response?.data?.error?.message || e.message}`); process.exitCode = 1; }
  }
})();
