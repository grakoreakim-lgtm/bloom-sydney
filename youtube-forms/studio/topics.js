// Topic catalog = packs (forms/_packs.js) × form definitions (forms/*.js). Roadmap ids without a file are "planned".
const fs = require('fs');
const path = require('path');
const FORMS = path.join(__dirname, '..', 'forms');
const packs = require(path.join(FORMS, '_packs.js'));

function loadForm(id) {
  const f = path.join(FORMS, `${id}.js`);
  if (!fs.existsSync(f)) return null;
  delete require.cache[require.resolve(f)];
  return require(f);
}

function catalog() {
  const ready = fs.readdirSync(FORMS).filter((f) => f.endsWith('.js') && !f.startsWith('_')).map((f) => loadForm(f.replace(/\.js$/, '')));
  return packs.map((p) => ({
    ...p,
    topics: p.roadmap.map((fid) => {
      const form = ready.find((r) => r.id === fid && (r.pack || 'arrival-card') === p.id) || null;
      return form
        ? { id: fid, ready: true, title: form.title, country: form.country, flag: form.flag, langs: Object.keys(form.strings || {}), fee: form.fee, when: form.when, captcha: !!form.captcha, official: form.url?.live }
        : { id: fid, ready: false, title: { ko: fid, en: fid }, langs: [] };
    }),
  }));
}

module.exports = { catalog, loadForm, packs };
