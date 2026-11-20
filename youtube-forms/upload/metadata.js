// Metadata: title / description / tags / chapters / publish time for one calendar row.
const L = {
  ko: { official: '📌 공식 사이트(무료)', disclosure: '※ 아래 링크로 구매하시면 채널에 수수료가 지급될 수 있습니다. 가격은 동일합니다.', chapters: '⏱ 구간', esim: '📱 eSIM', hotel: '🏨 호텔', pickup: '🚆 공항 픽업·교통', tour: '🎟 투어·입장권',
        outro: '구독하면 서식이 바뀔 때 최신판을 보내드립니다. 질문은 댓글에 남겨주세요 — 분기마다 모아서 답변 영상을 올립니다.', sample: '영상 속 개인정보는 모두 가상의 샘플입니다. 제출은 반드시 공식 사이트에서만 하세요.' },
  en: { official: '📌 Official site (free)', disclosure: '※ Links below may earn this channel a commission at no extra cost to you.', chapters: '⏱ Chapters', esim: '📱 eSIM', hotel: '🏨 Hotels', pickup: '🚆 Airport transfer', tour: '🎟 Tours & tickets',
        outro: 'Subscribe — we re-upload whenever the form changes. Questions in the comments; we answer them in a quarterly Q&A.', sample: 'All personal data on screen is fictional sample data. Only ever submit on the official site.' },
};
const T = (lang) => L[lang] || L.en;

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
  const title = row['제목(초안)'].slice(0, 100);
  const chapters = [{ t: 0, label: lang === 'ko' ? '시작' : 'Intro' }, ...(timeline?.chapters || [])];
  const affLines = [aff.esim && `${t.esim}: ${aff.esim}`, aff.pickup && `${t.pickup}: ${aff.pickup}`, aff.hotel && `${t.hotel}: ${aff.hotel}`, aff.tour && `${t.tour}: ${aff.tour}`].filter(Boolean);
  const facts = [row['비용'] && row['비용'] !== '-' ? `💰 ${row['비용']}` : null, row['제출 시점·유효'] && row['제출 시점·유효'] !== '-' ? `🗓 ${row['제출 시점·유효']}` : null].filter(Boolean).join('   ');
  const description = [
    `${t.official}: ${official}`,
    affLines.length ? t.disclosure : null,
    ...affLines,
    '',
    facts || null,
    '',
    t.chapters,
    ...chapters.map((c) => `${mmss(c.t)} ${c.label}`),
    '',
    t.outro,
    t.sample,
    '',
    (cfg.hashtags?.[lang] || cfg.hashtags?.en || []).map((h) => `#${h}`).join(' '),
  ].filter((x) => x !== null).join('\n').slice(0, 4900);
  const tags = [...new Set([row['서식/주제'], row['국가'].replace(/^\S+\s/, ''), ...(cfg.tags?.[lang] || cfg.tags?.en || [])])].filter(Boolean).slice(0, 30);
  // publish time: slot → local hour in the channel's timezone
  const hours = cfg.publishHours?.[lang] || cfg.publishHours?.default || [7, 10, 13, 17, 20];
  const hour = hours[(Number(row['슬롯']) - 1) % hours.length];
  const tz = cfg.timezone?.[lang] || cfg.timezone?.default || 'Asia/Seoul';
  const publishAt = localToIso(row['날짜'], hour, tz);
  return { title, description, tags, publishAt, categoryId: '27', defaultLanguage: lang, chapters };
}

// "YYYY-MM-DD" + hour in IANA tz → RFC3339 UTC
function localToIso(dateStr, hour, tz) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d, hour, 0, 0));
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  const parts = Object.fromEntries(fmt.formatToParts(guess).map((p) => [p.type, p.value]));
  const asLocal = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour) % 24, Number(parts.minute));
  const offset = asLocal - guess.getTime();
  return new Date(guess.getTime() - offset).toISOString();
}

module.exports = { buildMetadata, mmss };
