#!/usr/bin/env node
// Studio: local web dashboard + worker.  node studio/server.js [--port 8787] [--no-worker]
// No framework: node:http serves ui/ and a small JSON API.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const store = require('./store');
const { catalog } = require('./topics');
const { plan } = require('./scheduler');
const worker = require('./worker');

const argv = process.argv.slice(2);
const PORT = Number(argv[argv.indexOf('--port') + 1]) || 8787;
const SECRETS = path.join(__dirname, '..', 'upload', 'secrets');
const UI = path.join(__dirname, 'ui');

// ---------- OAuth (multi-account) ----------
function oauthClient() {
  const f = path.join(SECRETS, 'client_secret.json');
  if (!fs.existsSync(f)) return null;
  const j = JSON.parse(fs.readFileSync(f, 'utf8')); const c = j.installed || j.web;
  return new google.auth.OAuth2(c.client_id, c.client_secret, `http://127.0.0.1:${PORT}/oauth/cb`);
}
const SCOPES = ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.readonly'];

// ---------- helpers ----------
const json = (res, code, body) => { res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(body)); };
const body = (req) => new Promise((r) => { let b = ''; req.on('data', (c) => b += c); req.on('end', () => r(b ? JSON.parse(b) : {})); });
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.mp4': 'video/mp4', '.json': 'application/json' };

const routes = {
  'GET /api/overview': () => {
    const ch = store.get('channels'), sc = store.get('schedule'), jobs = store.get('jobs');
    const today = new Date().toISOString().slice(0, 10);
    return { channels: ch.length, connected: ch.filter((c) => c.connected).length, planned: sc.filter((s) => s.status === 'planned').length,
             producedToday: sc.filter((s) => s.date === today && ['produced', 'scheduled'].includes(s.status)).length, errors: sc.filter((s) => s.status === 'error').length,
             running: jobs.filter((j) => j.state === 'running').length, settings: store.settings(), hasClientSecret: fs.existsSync(path.join(SECRETS, 'client_secret.json')) };
  },
  'GET /api/packs': () => catalog(),
  'GET /api/channels': () => store.get('channels'),
  'POST /api/channels': async (req) => {
    const b = await body(req);
    return store.insert('channels', { name: b.name || '새 채널', langs: b.langs || ['ko'], packs: b.packs || ['arrival-card'], perDay: b.perDay || 2, rampDays: b.rampDays ?? 14,
      publishHours: b.publishHours || [7, 12, 18, 20, 22], tz: b.tz || 'Asia/Seoul', startDate: b.startDate || new Date().toISOString().slice(0, 10), affiliate: b.affiliate || {}, connected: false });
  },
  'PUT /api/channels/:id': async (req, p) => store.update('channels', p.id, await body(req)),
  'DELETE /api/channels/:id': (req, p) => ({ ok: store.remove('channels', p.id) }),
  'POST /api/channels/:id/plan': async (req, p) => plan(p.id, (await body(req)).days || 30),
  'GET /api/channels/:id/connect': (req, p) => {
    const oa = oauthClient(); if (!oa) return { error: 'upload/secrets/client_secret.json 이 없습니다 (Google Cloud → OAuth 클라이언트 → 데스크톱 앱)' };
    return { url: oa.generateAuthUrl({ access_type: 'offline', prompt: 'consent', scope: SCOPES, state: p.id }) };
  },
  'GET /api/schedule': (req) => {
    const u = new URL(req.url, 'http://x'); const ch = u.searchParams.get('channel'), from = u.searchParams.get('from'), to = u.searchParams.get('to');
    return store.filter('schedule', (s) => (!ch || s.channelId === ch) && (!from || s.date >= from) && (!to || s.date <= to)).sort((a, b) => a.date.localeCompare(b.date) || a.slot - b.slot);
  },
  'POST /api/schedule': async (req) => { const b = await body(req); return store.insert('schedule', { status: 'planned', ...b }); },
  'PUT /api/schedule/:id': async (req, p) => store.update('schedule', p.id, await body(req)),
  'DELETE /api/schedule/:id': (req, p) => ({ ok: store.remove('schedule', p.id) }),
  'POST /api/schedule/:id/run': async (req, p) => { const b = await body(req); worker.runRow(p.id, b).catch(() => {}); return { started: true }; },
  'GET /api/jobs': () => store.get('jobs').slice(-100).reverse(),
  'GET /api/settings': () => store.settings(),
  'PUT /api/settings': async (req) => store.setSettings(await body(req)),
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    // OAuth callback
    if (url.pathname === '/oauth/cb') {
      const oa = oauthClient(); const code = url.searchParams.get('code'), chId = url.searchParams.get('state');
      const { tokens } = await oa.getToken(code); oa.setCredentials(tokens);
      fs.mkdirSync(SECRETS, { recursive: true }); fs.writeFileSync(path.join(SECRETS, `token-${chId}.json`), JSON.stringify(tokens, null, 1));
      let ytName = null, ytId = null;
      try { const yt = google.youtube({ version: 'v3', auth: oa }); const r = await yt.channels.list({ part: ['snippet'], mine: true }); ytName = r.data.items?.[0]?.snippet?.title; ytId = r.data.items?.[0]?.id; } catch {}
      store.update('channels', chId, { connected: true, youtubeName: ytName, youtubeId: ytId, connectedAt: new Date().toISOString() });
      res.writeHead(302, { location: '/#channels' }); return res.end();
    }
    // API
    for (const [key, fn] of Object.entries(routes)) {
      const [m, pat] = key.split(' '); if (m !== req.method) continue;
      const re = new RegExp('^' + pat.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'); const mm = url.pathname.match(re); if (!mm) continue;
      return json(res, 200, await fn(req, mm.groups || {}));
    }
    // outputs (videos / thumbnails) and UI
    if (url.pathname.startsWith('/out/')) { const f = path.join(__dirname, '..', decodeURIComponent(url.pathname)); if (fs.existsSync(f)) { res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); return fs.createReadStream(f).pipe(res); } }
    const f = path.join(UI, url.pathname === '/' ? 'index.html' : url.pathname);
    if (f.startsWith(UI) && fs.existsSync(f)) { res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'text/plain' }); return fs.createReadStream(f).pipe(res); }
    json(res, 404, { error: 'not found' });
  } catch (e) { json(res, 500, { error: e.message }); }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Studio → http://127.0.0.1:${PORT}`);
  if (!argv.includes('--no-worker')) { worker.start(30000); console.log('worker: on (30s tick)'); }
});
