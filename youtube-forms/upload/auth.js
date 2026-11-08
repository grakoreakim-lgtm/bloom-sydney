#!/usr/bin/env node
// One-time OAuth for each channel. Run on your own PC (a browser window opens):
//   node upload/auth.js ko      → writes upload/secrets/token-ko.json
//   node upload/auth.js en      → writes upload/secrets/token-en.json
// Needs upload/secrets/client_secret.json (Google Cloud → OAuth client, type "Desktop app").
const fs = require('fs');
const path = require('path');
const http = require('http');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube'];
const SECRETS = path.join(__dirname, 'secrets');

function client() {
  const f = path.join(SECRETS, 'client_secret.json');
  if (!fs.existsSync(f)) throw new Error(`missing ${f} — download it from Google Cloud Console → APIs & Services → Credentials`);
  const j = JSON.parse(fs.readFileSync(f, 'utf8')); const c = j.installed || j.web;
  return new google.auth.OAuth2(c.client_id, c.client_secret, 'http://127.0.0.1:53682/cb');
}

async function authorize(channel) {
  const tokenFile = path.join(SECRETS, `token-${channel}.json`);
  const oauth = client();
  if (fs.existsSync(tokenFile)) { oauth.setCredentials(JSON.parse(fs.readFileSync(tokenFile, 'utf8'))); return oauth; }
  const url = oauth.generateAuthUrl({ access_type: 'offline', prompt: 'consent', scope: SCOPES });
  console.log(`\nOpen this URL in the browser that is signed in to the "${channel}" channel:\n\n${url}\n`);
  const code = await new Promise((resolve, reject) => {
    const srv = http.createServer((req, res) => {
      const u = new URL(req.url, 'http://127.0.0.1:53682');
      if (u.pathname !== '/cb') return res.end();
      res.end('Authorized. You can close this tab.'); srv.close();
      u.searchParams.get('code') ? resolve(u.searchParams.get('code')) : reject(new Error(u.searchParams.get('error')));
    }).listen(53682);
  });
  const { tokens } = await oauth.getToken(code); oauth.setCredentials(tokens);
  fs.mkdirSync(SECRETS, { recursive: true }); fs.writeFileSync(tokenFile, JSON.stringify(tokens, null, 1));
  console.log('saved', tokenFile);
  return oauth;
}

if (require.main === module) authorize(process.argv[2] || 'ko').then(() => process.exit(0)).catch((e) => { console.error(e.message); process.exit(1); });
module.exports = { authorize };
