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
  const size = fs.statSync(videoFile).size;
  const res = await yt.videos.insert({
    part: ['snippet', 'status'],
    notifySubscribers: true,
    requestBody: {
      snippet: { title: meta.title, description: meta.description, tags: meta.tags, categoryId: meta.categoryId, defaultLanguage: meta.defaultLanguage, defaultAudioLanguage: meta.defaultLanguage },
      status: { privacyStatus: 'private', publishAt: meta.publishAt, selfDeclaredMadeForKids: false, embeddable: true, license: 'youtube' },
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

module.exports = { upload };
