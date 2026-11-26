// SEO helpers: keyword bank (seo/keywords.json) + learned search terms (seo/learned.json, biweekly review).
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const readJson = (p, fb) => { try { return JSON.parse(fs.readFileSync(path.isAbsolute(p) ? p : path.join(ROOT, p), 'utf8')); } catch { return fb; } };

function loadSeo(cfg = {}) {
  return {
    keywords: readJson(cfg.seo?.keywords || 'seo/keywords.json', {}),
    learned: readJson(cfg.seo?.learned || 'seo/learned.json', { terms: {}, videos: {} }),
  };
}

// keyword entry for a form/lang (null if the bank has none)
function entryFor(seo, formId, lang) {
  const e = seo.keywords?.[formId]?.[lang];
  if (!e) return null;
  const learned = (seo.learned?.terms?.[`${formId}:${lang}`] || []).map((t) => (typeof t === 'string' ? t : t.term));
  return { ...e, learned };
}

function fillTitle(tpl, e, year) {
  return tpl.replace('{primary}', e.primary).replace('{year}', year).replace('{hook}', e.hook || '').replace(/\s+\|\s*$/, '').replace(/\s{2,}/g, ' ').trim();
}

// YouTube: max 500 chars of tags; a tag containing a space counts with its quotes (+2)
function fitTags(list, limit = 480) {
  const out = []; const seen = new Set(); let used = 0;
  for (const raw of list) {
    const t = String(raw || '').replace(/[<>,]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!t || t.length > 100 || seen.has(t.toLowerCase())) continue;
    const cost = t.length + (t.includes(' ') ? 2 : 0) + (out.length ? 1 : 0);
    if (used + cost > limit) continue;
    out.push(t); seen.add(t.toLowerCase()); used += cost;
  }
  return out;
}

// which form a published video belongs to: the form whose primary/secondary phrases match most of title+tags
function guessForm(seo, lang, text) {
  const hay = text.toLowerCase(); let best = null, bestScore = 0;
  for (const [formId, langs] of Object.entries(seo.keywords || {})) {
    const e = langs?.[lang]; if (!e) continue;
    const score = [e.primary, ...(e.secondary || [])].filter((k) => hay.includes(k.toLowerCase())).length;
    if (score > bestScore) { best = formId; bestScore = score; }
  }
  return best;
}

module.exports = { loadSeo, entryFor, fillTitle, fitTags, guessForm };
