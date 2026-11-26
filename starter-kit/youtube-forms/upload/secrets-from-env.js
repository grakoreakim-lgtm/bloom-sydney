#!/usr/bin/env node
// CI helper: write upload/secrets/*.json from environment variables (GitHub Actions secrets).
//   YT_CLIENT_SECRET      → secrets/client_secret.json  (just the GOCSPX-… value; preferred)
//   YT_CLIENT_SECRET_JSON → secrets/client_secret.json  (full JSON; used when YT_CLIENT_SECRET is not set)
//   YT_TOKEN_<CH>_JSON    → secrets/token-<ch>.json   (e.g. YT_TOKEN_KO_JSON → token-ko.json)
//   YT_REFRESH_TOKEN_<CH> → secrets/token-<ch>.json   (just the refresh token string, from OAuth Playground)
// GOOGLE_TTS_API_KEY stays in the environment (narration.js reads it directly).
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'secrets');
fs.mkdirSync(dir, { recursive: true });
let n = 0;
// simplest (mobile): YT_CLIENT_SECRET = just the secret value (GOCSPX-…); the client ID is not secret and lives here
const CLIENT_ID = process.env.YT_CLIENT_ID;   // your OAuth client id (GitHub secret YT_CLIENT_ID)
if (!CLIENT_ID && process.env.YT_CLIENT_SECRET) console.warn('⚠ YT_CLIENT_ID is not set — add it as a GitHub secret');
if (process.env.YT_CLIENT_SECRET && process.env.YT_CLIENT_SECRET.trim()) {
  fs.writeFileSync(path.join(dir, 'client_secret.json'), JSON.stringify({ web: { client_id: CLIENT_ID, client_secret: process.env.YT_CLIENT_SECRET.trim() } })); n++;
} else if (process.env.YT_CLIENT_SECRET_JSON) {
  let j; try { j = JSON.parse(process.env.YT_CLIENT_SECRET_JSON); } catch { console.error('YT_CLIENT_SECRET_JSON is not valid JSON'); process.exit(1); }
  const c = j.web || j.installed || {};
  if (!c.client_id || !c.client_secret || /새비밀키|SECRET|여기/.test(c.client_secret)) console.warn('⚠ YT_CLIENT_SECRET_JSON looks incomplete (placeholder or missing client_secret)');
  fs.writeFileSync(path.join(dir, 'client_secret.json'), process.env.YT_CLIENT_SECRET_JSON); n++;
}
for (const [k, v] of Object.entries(process.env)) {
  const m = k.match(/^YT_TOKEN_([A-Z0-9_]+)_JSON$/);
  if (m && v) { fs.writeFileSync(path.join(dir, `token-${m[1].toLowerCase()}.json`), v); n++; continue; }
  // mobile-friendly: a bare refresh token (from Google OAuth Playground) is enough
  const r = k.match(/^YT_REFRESH_TOKEN_([A-Z0-9_]+)$/);
  if (r && v) { fs.writeFileSync(path.join(dir, `token-${r[1].toLowerCase()}.json`), JSON.stringify({ refresh_token: v.trim(), token_type: 'Bearer' })); n++; }
}
console.log(`secrets written: ${n} file(s)`, process.env.GOOGLE_TTS_API_KEY ? '+ TTS key present' : '(no TTS key → use --fake-tts)');
