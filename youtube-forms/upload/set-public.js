#!/usr/bin/env node
// Make uploaded videos public now:  node upload/set-public.js <videoId> [<videoId> ...]
// Tries each channel token until it finds the owner.
const { google } = require('googleapis');
const { authorize } = require('./auth');

(async () => {
  const ids = process.argv.slice(2).flatMap((a) => a.split(/[\s,]+/)).map((s) => s.replace(/.*(?:youtu\.be\/|v=)/, '').trim()).filter(Boolean);
  if (!ids.length) { console.error('usage: set-public.js <videoId...>'); process.exit(1); }
  let failed = 0;
  for (const id of ids) {
    let done = false;
    for (const ch of ['ko', 'en']) {
      try {
        const yt = google.youtube({ version: 'v3', auth: await authorize(ch) });
        const v = (await yt.videos.list({ part: ['status', 'snippet'], id: [id] })).data.items?.[0];
        if (!v || !v.status.uploadStatus) continue;
        const status = { privacyStatus: 'public', embeddable: v.status.embeddable, license: v.status.license, selfDeclaredMadeForKids: false, publicStatsViewable: v.status.publicStatsViewable };
        await yt.videos.update({ part: ['status'], requestBody: { id, status } });
        console.log(`✔ PUBLIC  https://youtu.be/${id}  (${ch})  ${v.snippet.title}`);
        done = true; break;
      } catch (e) { if (/not found|forbidden/i.test(e.message)) continue; console.error(`  ${ch}: ${e.message}`); }
    }
    if (!done) { failed++; console.log(`✖ ${id} — not changed (not found on ko/en channels)`); }
  }
  if (failed) process.exitCode = 1;
})();
