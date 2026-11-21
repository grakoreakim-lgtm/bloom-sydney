// YouTube Data API v3: resumable upload + thumbnail + scheduled publish.
const fs = require('fs');
const { google } = require('googleapis');
const { authorize } = require('./auth');

/**
 * @param channel  'ko' | 'en' … (token file suffix)
 * @param meta     from metadata.js
 * @param videoFile, thumbFile
 * @param opts     { dryRun }
 */
async function upload(channel, meta, videoFile, thumbFile, opts = {}) {
  if (opts.dryRun) return { id: 'DRY-RUN', url: '(dry run — nothing uploaded)' };
  const auth = await authorize(channel);
  const yt = google.youtube({ version: 'v3', auth });
  // duplicate guard: a manual run and the scheduled run must not post the same video twice
  const dup = await findByTitle(yt, meta.title);
  if (dup) { console.log(`  ⏭ already on the channel: ${meta.title}`); return { id: dup, url: `https://youtu.be/${dup}`, duplicate: true }; }
  const size = fs.statSync(videoFile).size;
  const res = await yt.videos.insert({
    part: ['snippet', 'status'],
    notifySubscribers: true,
    requestBody: {
      snippet: { title: meta.title, description: meta.description, tags: meta.tags, categoryId: meta.categoryId, defaultLanguage: meta.defaultLanguage, defaultAudioLanguage: meta.defaultLanguage },
      status: { privacyStatus: 'private', ...(opts.review ? {} : { publishAt: meta.publishAt }), selfDeclaredMadeForKids: false, embeddable: true, license: 'youtube' },
    },
    media: { body: fs.createReadStream(videoFile) },
  }, { onUploadProgress: (e) => process.stdout.write(`\r  upload ${Math.round((e.bytesRead / size) * 100)}%`) });
  process.stdout.write('\n');
  const id = res.data.id;
  if (thumbFile && fs.existsSync(thumbFile)) {
    try { await yt.thumbnails.set({ videoId: id, media: { body: fs.createReadStream(thumbFile) } }); }
    catch (e) { console.warn('  thumbnail failed (channel may need phone verification):', e.message); }
  }
  return { id, url: `https://youtu.be/${id}` };
}

// newest ~100 uploads (private/scheduled included — the owner sees them); 1 quota unit per page
async function findByTitle(yt, title) {
  try {
    const ch = (await yt.channels.list({ part: ['contentDetails'], mine: true })).data.items?.[0];
    const playlistId = ch?.contentDetails?.relatedPlaylists?.uploads; if (!playlistId) return null;
    let pageToken; for (let i = 0; i < 2; i++) {
      const r = await yt.playlistItems.list({ part: ['snippet'], playlistId, maxResults: 50, pageToken });
      const hit = r.data.items.find((it) => it.snippet.title === title); if (hit) return hit.snippet.resourceId.videoId;
      pageToken = r.data.nextPageToken; if (!pageToken) break;
    }
  } catch (e) { console.warn('  duplicate check skipped:', e.message); }
  return null;
}

module.exports = { upload };
