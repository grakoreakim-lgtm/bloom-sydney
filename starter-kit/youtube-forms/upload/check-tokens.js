#!/usr/bin/env node
// Check each channel token without revealing it: prints the channel it belongs to and whether
// the analytics permission works.   node upload/check-tokens.js
const { google } = require('googleapis');
const { authorize } = require('./auth');

(async () => {
  let bad = 0;
  const fs = require('fs'); const path = require('path');
  for (const ch of ['ko', 'en', 'gov', 'apps'].filter((c) => ['ko', 'en'].includes(c) || fs.existsSync(path.join(__dirname, 'secrets', `token-${c}.json`)))) {
    try {
      const auth = await authorize(ch);
      const yt = google.youtube({ version: 'v3', auth });
      const c = (await yt.channels.list({ part: ['snippet'], mine: true })).data.items?.[0];
      let analytics = 'OK';
      try {
        const end = new Date(Date.now() - 864e5).toISOString().slice(0, 10), start = new Date(Date.now() - 8 * 864e5).toISOString().slice(0, 10);
        await google.youtubeAnalytics({ version: 'v2', auth }).reports.query({ ids: 'channel==MINE', startDate: start, endDate: end, metrics: 'views' });
      } catch (e) { analytics = 'FAIL: ' + (e?.response?.data?.error?.message || e.message); bad++; }
      console.log(`${ch.toUpperCase()} token → channel "${c?.snippet?.title || '?'}" (${c?.id || '-'}) | analytics: ${analytics}`);
    } catch (e) { bad++; console.log(`${ch.toUpperCase()} token → FAIL: ${e?.response?.data?.error_description || e?.response?.data?.error?.message || e.message}`); }
  }
  if (bad) process.exitCode = 1;
})();
