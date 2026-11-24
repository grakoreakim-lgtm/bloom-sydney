// Metadata: title / description / tags / chapters / publish time for one calendar row.
// SEO: titles, the first description lines, tags and hashtags are composed from seo/keywords.json
// (+ real search terms learned by the biweekly seo-review) — see upload/seo.js.
const { loadSeo, entryFor, fillTitle, fitTags } = require('./seo');
const L = {
  ko: { official: '📌 공식 사이트(무료)', disclosure: '※ 아래 링크로 구매하시면 채널에 수수료가 지급될 수 있습니다. 가격은 동일합니다.', chapters: '⏱ 구간', esim: '📱 eSIM', hotel: '🏨 호텔', pickup: '🚆 공항 픽업·교통', tour: '🎟 투어·입장권',
        lead: (p, c, f) => `${p} — ${c} 가기 전 꼭 해야 하는 ${f}, 실제 화면 그대로 따라 하면 5분이면 끝납니다.`, faq: '🔎 이 영상에서 답하는 질문', search: '함께 찾는 검색어',
        outro: '구독하면 서식이 바뀔 때 최신판을 보내드립니다. 질문은 댓글에 남겨주세요 — 분기마다 모아서 답변 영상을 올립니다.', sample: '영상 속 개인정보는 모두 가상의 샘플입니다. 제출은 반드시 공식 사이트에서만 하세요.', ai: '🎙 내레이션은 AI 음성(Google TTS)이며, 화면과 내용은 직접 확인해 만들었습니다.' },
  en: { official: '📌 Official site (free)', disclosure: '※ Links below may earn this channel a commission at no extra cost to you.', chapters: '⏱ Chapters', esim: '📱 eSIM', hotel: '🏨 Hotels', pickup: '🚆 Airport transfer', tour: '🎟 Tours & tickets',
        lead: (p, c, f) => `${p} — fill in the ${f} for ${c} by copying the real screen, step by step, in about 5 minutes.`, faq: '🔎 Questions answered in this video', search: 'Related searches',
        outro: 'Subscribe — we re-upload whenever the form changes. Questions in the comments; we answer them in a quarterly Q&A.', sample: 'All personal data on screen is fictional sample data. Only ever submit on the official site.', ai: '🎙 Narration uses an AI voice (Google TTS); the steps and content were checked by us.' },
};
const T = (lang) => L[lang] || L.en;
// one-tap subscribe link for the channel this video goes to (null when the channel id is not known yet)
const subLine = (cfg, ch, lang) => { const id = cfg?.channelIds?.[ch]; return id ? `${lang === 'ko' ? '🔔 구독하기' : '🔔 Subscribe'}: https://www.youtube.com/channel/${id}?sub_confirmation=1` : null; };
const FACT_EN = { '무료': 'Free', '도착 3일 전': 'Within 3 days before arrival', '도착 72시간 전': 'Within 72 hours before arrival' };

const mmss = (ms) => { const s = Math.round(ms / 1000); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };

/**
 * @param row       calendar row (from upload-calendar CSV) — 국가, 서식/주제, 언어, 제목(초안), 공식 URL(설명란 1줄), 비용, 제출 시점·유효
 * @param form      form definition (for the official url fallback)
 * @param timeline  recorder timeline { chapters:[{t,label}] }
 * @param aff       affiliate links for this country/language { esim, hotel, pickup, tour }
 */
function buildMetadata(row, form, timeline, aff, cfg) {
  const lang = row['언어'].toLowerCase();
  const t = T(lang);
  const official = (row['공식 URL(설명란 1줄)'] && row['공식 URL(설명란 1줄)'].startsWith('http')) ? row['공식 URL(설명란 1줄)'] : (form?.url?.live || '');
  const seo = loadSeo(cfg);
  const kw = form?.id ? entryFor(seo, form.id, lang) : null;
  const year = row['날짜'].slice(0, 4);
  const country = row['국가'].replace(/^\S+\s/, '');
  const formName = form?.title?.[lang] || row['서식/주제'];
  const title = (kw ? fillTitle((kw.titles && kw.titles[0]) || '{primary} {year} | {hook}', kw, year) : row['제목(초안)']).slice(0, 100);
  const chapters = [{ t: 0, label: lang === 'ko' ? '시작' : 'Intro' }, ...(timeline?.chapters || [])];
  const affLines = [aff.esim && `${t.esim}: ${aff.esim}`, aff.pickup && `${t.pickup}: ${aff.pickup}`, aff.hotel && `${t.hotel}: ${aff.hotel}`, aff.tour && `${t.tour}: ${aff.tour}`].filter(Boolean);
  const tr = (v) => (lang === 'ko' ? v : (FACT_EN[v] || v));
  const facts = [row['비용'] && row['비용'] !== '-' ? `💰 ${tr(row['비용'])}` : null, row['제출 시점·유효'] && row['제출 시점·유효'] !== '-' ? `🗓 ${tr(row['제출 시점·유효'])}` : null].filter(Boolean).join('   ');
  const lead = kw?.lead || (kw && t.lead ? t.lead(kw.primary, form?.country?.[lang] || country, formName) : null);   // keywords.json may give its own first line
  const hashtags = [...new Set([...(kw?.hashtags || []), ...(cfg.hashtags?.[lang] || cfg.hashtags?.en || [])])].slice(0, 8);
  const searchTerms = kw ? [...new Set([...(kw.learned || []), ...(kw.secondary || [])])].slice(0, 12) : [];
  const description = [
    lead,                                   // first ~150 chars show in search results: keyword first
    /^https?:/.test(official) ? `${t.official}: ${official}` : null,
    affLines.length ? t.disclosure : null,
    ...affLines,
    '',
    facts || null,
    '',
    t.chapters,
    ...chapters.map((c) => `${mmss(c.t)} ${c.label}`),
    '',
    kw?.questions?.length ? t.faq : null,
    ...(kw?.questions || []).map((q) => `• ${q}`),
    kw?.questions?.length ? '' : null,
    t.outro,
    subLine(cfg, form?.channel || lang, lang),
    t.sample,
    t.ai || null,
    '',
    searchTerms.length ? `${t.search}: ${searchTerms.join(' · ')}` : null,
    hashtags.map((h) => `#${h.replace(/\s+/g, '')}`).join(' '),   // first 3 appear above the title
  ].filter((x) => x !== null).join('\n').slice(0, 4900);
  const localCountry = form?.country?.[lang] || (lang === 'ko' ? country : null);
  const tags = fitTags([kw?.primary, ...(kw?.learned || []), ...(kw?.secondary || []), lang === 'ko' ? row['서식/주제'] : null, formName, localCountry, ...(cfg.tags?.[lang] || cfg.tags?.en || [])]);
  // publish time in the channel's timezone:
  //  - publishWindow {from, to}: a random minute inside the window (stable per date+slot+lang, so re-runs agree)
  //  - otherwise publishHours by slot
  const tz = cfg.timezone?.[lang] || cfg.timezone?.default || 'Asia/Seoul';
  const win = cfg.publishWindow?.[lang] || cfg.publishWindow?.default || null;
  let minuteOfDay;
  if (win) {
    const seed = [...`${row['날짜']}|${row['슬롯']}|${lang}`].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
    minuteOfDay = win.from * 60 + (seed % ((win.to - win.from) * 60));
  } else {
    const hours = cfg.publishHours?.[lang] || cfg.publishHours?.default || [7, 10, 13, 17, 20];
    minuteOfDay = hours[(Number(row['슬롯']) - 1) % hours.length] * 60;
  }
  let publishAt = localToIso(row['날짜'], Math.floor(minuteOfDay / 60), tz, minuteOfDay % 60);
  // YouTube needs publishAt in the future; if the run is late, publish 30 min from now instead
  const earliest = Date.now() + 30 * 60 * 1000;
  if (Date.parse(publishAt) < earliest) publishAt = new Date(earliest).toISOString();
  return { title, description, tags, publishAt, categoryId: '27', defaultLanguage: lang, chapters, seo: kw ? { form: form.id, primary: kw.primary, titleVariant: 0 } : null };
}

// "YYYY-MM-DD" + hour[:minute] in IANA tz → RFC3339 UTC
function localToIso(dateStr, hour, tz, minute = 0) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d, hour, minute, 0));
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  const parts = Object.fromEntries(fmt.formatToParts(guess).map((p) => [p.type, p.value]));
  const asLocal = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour) % 24, Number(parts.minute));
  const offset = asLocal - guess.getTime();
  return new Date(guess.getTime() - offset).toISOString();
}

module.exports = { subLine, buildMetadata, mmss };
