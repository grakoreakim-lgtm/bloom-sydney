// Tiny JSON document store: studio/data/db.json. Single-tenant for now; every record carries ids so a
// real database can replace this file without touching the API.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const FILE = path.join(__dirname, 'data', 'db.json');
const EMPTY = { channels: [], schedule: [], jobs: [], settings: { target: 'mock', tts: { provider: 'google', speakingRate: 0.97 }, leadDays: 1, dry: true, fakeTts: true } };

let db = null;
function load() { if (db) return db; db = fs.existsSync(FILE) ? { ...EMPTY, ...JSON.parse(fs.readFileSync(FILE, 'utf8')) } : structuredClone(EMPTY); return db; }
function save() { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(db, null, 1)); }
const id = (p) => `${p}_${crypto.randomBytes(5).toString('hex')}`;

module.exports = {
  load, save, id,
  get: (col) => load()[col],
  find: (col, pred) => load()[col].find(pred),
  filter: (col, pred) => load()[col].filter(pred),
  insert(col, doc) { const d = { id: id(col.slice(0, 3)), createdAt: new Date().toISOString(), ...doc }; load()[col].push(d); save(); return d; },
  update(col, docId, patch) { const d = load()[col].find((x) => x.id === docId); if (!d) return null; Object.assign(d, patch, { updatedAt: new Date().toISOString() }); save(); return d; },
  remove(col, docId) { const c = load()[col]; const i = c.findIndex((x) => x.id === docId); if (i >= 0) c.splice(i, 1); save(); return i >= 0; },
  settings() { return load().settings; },
  setSettings(patch) { Object.assign(load().settings, patch); save(); return load().settings; },
};
