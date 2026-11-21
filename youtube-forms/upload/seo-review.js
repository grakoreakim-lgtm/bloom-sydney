#!/usr/bin/env node
// Biweekly search review: what people searched to find each video, impressions, CTR — then improve.
//
//   node upload/seo-review.js --config upload/config.ci.json            # report only
//   node upload/seo-review.js --config upload/config.ci.json --apply    # also update tags / rotate titles
//
// Data sources (all read-only except videos.update with --apply):
//   • YouTube Analytics API  — views, watch time, avg % viewed, YouTube-search terms per video
//   • YouTube Reporting API  — thumbnail impressions + CTR (channel_reach_basic_a1; a daily job is created
//                              on the first run, data appears ~2 days later)
// Needs refresh tokens with the yt-analytics.readonly scope (see SETUP-SEO.md).
//
// Outputs: seo/learned.json (real search terms → used by metadata.js for new videos, title variant state)
//          seo/reports/<date>.md (also printed, so it shows in the Actions log / step summary)

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { authorize } = require('./auth');
const { loadSeo, entryFor, fillTitle, fitTags, guessForm } = require('./seo');

const ROOT = path.join(__dirname, '..');
const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : null; };
const flag = (k) => argv.includes(`--${k}`);
const cfg = JSON.parse(fs.readFileSync(opt('config') || path.join(__dirname, 'config.ci.json'), 'utf8'));
const APPLY = flag('apply');
const DAYS = Number(opt('days') || 14);
const R = { minImpressions: 300, minCtr: 0.04, minAgeDays: 7, cooldownDays: 14, minTermViews: 2, maxLearned: 15, ...(cfg.seo?.rules || {}) };

const day = (d) => d.toISOString().slice(0, 10);
const end = new Date(Date.now() - 2 * 864e5);            // analytics lag ~2 days
const start = new Date(end.getTime() - (DAYS - 1) * 864e5);
const pct = (x) => (x == null ? '–' : `${(x * 100).toFixed(1)}%`);
const learnedFile = path.join(ROOT, cfg.seo?.learned || 'seo/learned.json');

async function channelReport(chKey, seo, out) {
  const auth = await authorize(chKey);
  const yt = google.youtube({ version: 'v3', auth });
  const ya = google.youtubeAnalytics({ version: 'v2', auth });
  const yr = google.youtubereporting({ version: 'v1', auth });

  // 1) public videos on the channel
  const ch = (await yt.channels.list({ part: ['contentDetails', 'snippet'], mine: true })).data.items?.[0];
  if (!ch) throw new Error('no channel for this token');
  const uploads = ch.contentDetails.relatedPlaylists.uploads;
  const ids = []; let pageToken;
  do {
    const r = await yt.playlistItems.list({ part: ['contentDetails'], playlistId: uploads, maxResults: 50, pageToken });
    ids.push(...r.data.items.map((i) => i.contentDetails.videoId)); pageToken = r.data.nextPageToken;
  } while (pageToken && ids.length < 500);
  const videos = [];
  for (let i = 0; i < ids.length; i += 50) {
    const r = await yt.videos.list({ part: ['snippet', 'status', 'statistics'], id: ids.slice(i, i + 50) });
    videos.push(...r.data.items.filter((v) => v.status.privacyStatus === 'public'));
  }
  out.push(`\n## ${ch.snippet.title} (${chKey}) — 공개 영상 ${videos.length}개, 기간 ${day(start)} ~ ${day(end)}\n`);
  if (!videos.length) { out.push('아직 공개된 영상이 없습니다.\n'); return; }

  // 2) views / watch time per video
  const stats = {};
  try {
    const r = await ya.reports.query({ ids: 'channel==MINE', startDate: day(start), endDate: day(end), metrics: 'views,estimatedMinutesWatched,averageViewPercentage', dimensions: 'video', sort: '-views', maxResults: 200 });
    for (const [vid, views, mins, avgPct] of r.data.rows || []) stats[vid] = { views, mins, avgPct };
  } catch (e) { throw scopeHint(e); }

  // 3) impressions + CTR from the Reporting API
  const reach = await reachData(yr, auth, out);

  // 4) search terms per video
  const termsByForm = {};
  const lines = [];
  const state = seo.learned;
  state.videos = state.videos || {};
  for (const v of videos) {
    const vid = v.id; const s = stats[vid] || { views: 0, mins: 0, avgPct: 0 };
    const lang = (v.snippet.defaultLanguage || v.snippet.defaultAudioLanguage || 'en').slice(0, 2);
    const formId = guessForm(seo, lang, `${v.snippet.title} ${(v.snippet.tags || []).join(' ')}`);
    let terms = [];
    if (s.views > 0) {
      try {
        const r = await ya.reports.query({ ids: 'channel==MINE', startDate: day(start), endDate: day(end), metrics: 'views', dimensions: 'insightTrafficSourceDetail', filters: `video==${vid};insightTrafficSourceType==YT_SEARCH`, sort: '-views', maxResults: 25 });
        terms = (r.data.rows || []).map(([term, views]) => ({ term, views }));
      } catch (e) { /* not enough data for this video */ }
    }
    if (formId) {
      const key = `${formId}:${lang}`; termsByForm[key] = termsByForm[key] || {};
      for (const t of terms) termsByForm[key][t.term] = (termsByForm[key][t.term] || 0) + t.views;
    }
    const rc = reach[vid];
    const ctr = rc && rc.impressions ? rc.clicks / rc.impressions : null;
    const ageDays = (Date.now() - Date.parse(v.snippet.publishedAt)) / 864e5;
    const actions = [];

    // a) low CTR with enough impressions → next title variant
    const kw = formId ? entryFor(seo, formId, lang) : null;
    const vs = state.videos[vid] || { variant: 0, history: [] };
    const sinceChange = vs.changedAt ? (Date.now() - Date.parse(vs.changedAt)) / 864e5 : Infinity;
    if (kw?.titles?.length > 1 && rc && rc.impressions >= R.minImpressions && ctr < R.minCtr && ageDays >= R.minAgeDays && sinceChange >= R.cooldownDays) {
      const next = (vs.variant + 1) % kw.titles.length;
      const newTitle = fillTitle(kw.titles[next], kw, v.snippet.publishedAt.slice(0, 4)).slice(0, 100);
      actions.push(`제목 교체 → "${newTitle}" (CTR ${pct(ctr)} < ${pct(R.minCtr)})`);
      if (APPLY) {
        await updateSnippet(yt, v, { title: newTitle });
        vs.history.push({ at: new Date().toISOString(), from: v.snippet.title, to: newTitle, ctr, impressions: rc.impressions });
        state.videos[vid] = { ...vs, variant: next, changedAt: new Date().toISOString() };
      }
    }
    // b) search terms not yet in the tags → add them
    const have = new Set((v.snippet.tags || []).map((t) => t.toLowerCase()));
    const newTerms = terms.filter((t) => t.views >= R.minTermViews && !have.has(t.term.toLowerCase())).map((t) => t.term);
    if (newTerms.length) {
      actions.push(`태그 추가: ${newTerms.join(', ')}`);
      if (APPLY) {
        const tags = v.snippet.tags || [];
        await updateSnippet(yt, v, { tags: fitTags([tags[0], ...newTerms, ...tags.slice(1)]) });
      }
    }
    // c) diagnostics (no automatic action)
    if (rc && rc.impressions < 100 && ageDays >= 14) actions.push('노출 부족 → 제목 앞부분 키워드를 더 많이 검색되는 표현으로 (keywords.json primary 검토)');
    if (ctr != null && ctr >= R.minCtr && s.avgPct && s.avgPct < 30) actions.push(`클릭은 되는데 시청 유지율 ${s.avgPct.toFixed(0)}% → 첫 15초(인트로) 단축 검토`);

    lines.push({ title: v.snippet.title, url: `https://youtu.be/${vid}`, views: s.views, avgPct: s.avgPct, impressions: rc?.impressions, ctr, terms, actions });
  }

  lines.sort((a, b) => (b.impressions || 0) - (a.impressions || 0) || b.views - a.views);
  out.push('| 영상 | 노출 | CTR | 조회 | 평균 시청% | 상위 검색어 |', '|---|---:|---:|---:|---:|---|');
  for (const l of lines) out.push(`| [${l.title.replace(/\|/g, '/')}](${l.url}) | ${l.impressions ?? '–'} | ${pct(l.ctr)} | ${l.views} | ${l.avgPct ? l.avgPct.toFixed(0) + '%' : '–'} | ${l.terms.slice(0, 5).map((t) => `${t.term}(${t.views})`).join(', ') || '–'} |`);
  const todo = lines.filter((l) => l.actions.length);
  out.push('', `### 조치 ${APPLY ? '(적용됨)' : '(제안 — --apply 시 자동 적용)'}`, ...(todo.length ? todo.flatMap((l) => [`- **${l.title}**`, ...l.actions.map((a) => `  - ${a}`)]) : ['- 없음']));

  // 5) learned search terms per form → used for new videos
  state.terms = state.terms || {};
  for (const [key, map] of Object.entries(termsByForm)) {
    const prev = Object.fromEntries((state.terms[key] || []).map((t) => (typeof t === 'string' ? [t, 0] : [t.term, t.views])));
    for (const [term, views] of Object.entries(map)) prev[term] = (prev[term] || 0) + views;
    state.terms[key] = Object.entries(prev).filter(([, v]) => v >= R.minTermViews).sort((a, b) => b[1] - a[1]).slice(0, R.maxLearned).map(([term, views]) => ({ term, views }));
  }
  const learnedNow = Object.entries(termsByForm).map(([k, m]) => `- ${k}: ${Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t, n]) => `${t}(${n})`).join(', ')}`);
  out.push('', '### 이번 기간 실제 검색어 (다음 영상 태그·설명에 자동 반영)', ...(learnedNow.length ? learnedNow : ['- 아직 검색 유입 데이터 없음']));
}

async function updateSnippet(yt, v, patch) {
  const sn = v.snippet;
  const snippet = { title: sn.title, description: sn.description, tags: sn.tags, categoryId: sn.categoryId, defaultLanguage: sn.defaultLanguage, ...patch };
  await yt.videos.update({ part: ['snippet'], requestBody: { id: v.id, snippet } });
  Object.assign(v.snippet, patch);
}

// thumbnail impressions + CTR per video, summed over the window
async function reachData(yr, auth, out) {
  const result = {};
  try {
    const types = (await yr.reportTypes.list({})).data.reportTypes || [];
    const type = ['channel_reach_basic_a1', 'channel_reach_combined_a1'].find((t) => types.some((x) => x.id === t));
    if (!type) { out.push('_노출/CTR 리포트 유형을 찾지 못함 (채널이 아직 대상이 아닐 수 있음)_\n'); return result; }
    let job = ((await yr.jobs.list({})).data.jobs || []).find((j) => j.reportTypeId === type);
    if (!job) {
      job = (await yr.jobs.create({ requestBody: { reportTypeId: type, name: 'follow-done reach' } })).data;
      out.push(`_노출/CTR 일일 리포트 작업을 새로 만들었습니다 (${type}). 데이터는 약 2일 뒤부터 쌓입니다._\n`);
      return result;
    }
    const reports = (await yr.jobs.reports.list({ jobId: job.id, startTimeAtOrAfter: start.toISOString() })).data.reports || [];
    for (const rep of reports) {
      const csv = (await auth.request({ url: rep.downloadUrl, responseType: 'text' })).data;
      const [head, ...rows] = String(csv).trim().split('\n');
      const cols = head.split(',');
      const iv = cols.indexOf('video_id'), ii = cols.indexOf('video_thumbnail_impressions'), ic = cols.indexOf('video_thumbnail_impressions_ctr');
      if (iv < 0 || ii < 0) continue;
      for (const r of rows) {
        const c = r.split(','); const imp = Number(c[ii]) || 0; const ctr = Number(c[ic]) || 0;
        const o = (result[c[iv]] = result[c[iv]] || { impressions: 0, clicks: 0 });
        o.impressions += imp; o.clicks += imp * ctr;
      }
    }
    if (!reports.length) out.push('_노출/CTR 데이터가 아직 없습니다 (리포트 생성 대기 중)._\n');
  } catch (e) {
    out.push(`_노출/CTR 조회 실패: ${scopeHint(e).message}_\n`);
  }
  return result;
}

function scopeHint(e) {
  const msg = e?.response?.data?.error?.message || e.message || String(e);
  if (/insufficient|scope|403|has not been used|disabled/i.test(msg)) {
    return new Error(`${msg}\n→ 할 일: SETUP-SEO.md — ① YouTube Analytics API·YouTube Reporting API 사용 설정 ② yt-analytics.readonly 범위로 토큰 재발급`);
  }
  return new Error(msg);
}

(async () => {
  const seo = loadSeo(cfg);
  const out = [`# 검색 성과 리뷰 ${day(new Date())}`, `기준: 노출 ≥ ${R.minImpressions} & CTR < ${pct(R.minCtr)} 이면 제목 교체(쿨다운 ${R.cooldownDays}일), 검색어 조회 ≥ ${R.minTermViews} 이면 태그 추가`];
  const channels = [...new Set(Object.values(cfg.channels || { ko: 'ko', en: 'en' }))];
  let failed = 0;
  for (const ch of channels) {
    try { await channelReport(ch, seo, out); }
    catch (e) { failed++; out.push(`\n## 채널 ${ch}: 실패\n\n${scopeHint(e).message}\n`); }
  }
  seo.learned.updatedAt = new Date().toISOString();
  fs.writeFileSync(learnedFile, JSON.stringify(seo.learned, null, 1) + '\n');
  const report = out.join('\n') + '\n';
  const dir = path.join(ROOT, 'seo', 'reports'); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${day(new Date())}.md`), report);
  console.log(report);
  if (failed === channels.length) process.exitCode = 1;
})().catch((e) => { console.error(e); process.exit(1); });
