#!/usr/bin/env node
// Change visibility now:  node upload/set-public.js [--privacy public|private|unlisted] <videoId> [<videoId> ...]
// Tries each channel token until it finds the owner.
const { google } = require('googleapis');
const { authorize } = require('./auth');

(async () => {
  const argv = process.argv.slice(2); const pi = argv.indexOf('--privacy'); const privacy = pi >= 0 ? argv.splice(pi, 2)[1] : 'public';
  const ids = argv.flatMap((a) => a.split(/[\s,]+/)).map((s) => s.replace(/.*(?:youtu\.be\/|v=)/, '').trim()).filter(Boolean);
  if (!ids.length) { console.error('usage: set-public.js <videoId...>'); process.exit(1); }
  let failed = 0;
  for (const id of ids) {
    let done = false;
    for (const ch of ['ko', 'en']) {
      try {
        const yt = google.youtube({ version: 'v3', auth: await authorize(ch) });
        const v = (await yt.videos.list({ part: ['status', 'snippet'], id: [id] })).data.items?.[0];
        if (!v || !v.status.uploadStatus) continue;
        const status = { privacyStatus: privacy, embeddable: v.status.embeddable, license: v.status.license, selfDeclaredMadeForKids: false, publicStatsViewable: v.status.publicStatsViewable };
        await yt.videos.update({ part: ['status'], requestBody: { id, status } });
        console.log(`✔ ${privacy.toUpperCase()}  https://youtu.be/${id}  (${ch})  ${v.snippet.title}`);
        done = true; break;
      } catch (e) { if (/not found|forbidden/i.test(e.message)) continue; console.error(`  ${ch}: ${e.message}`); }
    }
    if (!done) { failed++; console.log(`✖ ${id} — not changed (not found on ko/en channels)`); }
  }
  if (failed) process.exitCode = 1;
})();
