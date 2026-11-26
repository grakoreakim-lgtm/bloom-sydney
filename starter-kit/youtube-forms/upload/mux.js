// Mux: place each narration clip at its cue time on top of the silent recording.
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * @param videoIn  silent mp4 from the recorder
 * @param cues     [{id, t}] from the recorder timeline (ms)
 * @param clips    { [cueId]: { file, durationMs } } from narration.js
 * @param videoOut output mp4 (h264 copied, aac audio)
 */
function mux(videoIn, cues, clips, videoOut, { bgm = null, bgmVolume = 0.14 } = {}) {
  const placed = cues.filter((c) => clips[c.id]);
  if (!placed.length) throw new Error('no narration clips matched the cue timeline');
  const inputs = [`-i "${videoIn}"`, ...placed.map((c) => `-i "${clips[c.id].file}"`)];
  const filters = placed.map((c, i) => `[${i + 1}:a]adelay=${Math.max(0, c.t)}|${Math.max(0, c.t)}[a${i}]`);
  filters.push(`${placed.map((_, i) => `[a${i}]`).join('')}amix=inputs=${placed.length}:duration=longest:normalize=0,apad[voice]`);
  let out = '[voice]';
  if (bgm) {
    // quiet background music that ducks under the narration (sidechain) and fades in/out
    const dur = Number(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${videoIn}"`).toString().trim()) || 600;
    inputs.push(`-stream_loop -1 -i "${bgm}"`);
    const b = placed.length + 1;
    filters.push(`[voice]asplit=2[v1][vsc]`);
    filters.push(`[${b}:a]aformat=sample_rates=44100:channel_layouts=stereo,volume=${bgmVolume},afade=t=in:d=2,afade=t=out:st=${Math.max(0, dur - 3).toFixed(2)}:d=3[bg]`);
    filters.push(`[vsc]aformat=sample_rates=44100:channel_layouts=stereo[sc]`);
    filters.push(`[bg][sc]sidechaincompress=threshold=0.015:ratio=6:attack=30:release=600[bgd]`);
    filters.push(`[v1]aformat=sample_rates=44100:channel_layouts=stereo[v1s]`);
    filters.push(`[v1s][bgd]amix=inputs=2:duration=first:normalize=0[mix]`);
    out = '[mix]';
  }
  const cmd = `ffmpeg -y -loglevel error ${inputs.join(' ')} -filter_complex "${filters.join(';')}" -map 0:v -map "${out}" -c:v copy -c:a aac -b:a 160k -shortest "${videoOut}"`;
  execSync(cmd, { stdio: 'inherit', shell: '/bin/bash' });
  return videoOut;
}

// pick a background track: cfg.bgm may be a file or a folder of tracks (one is chosen per video, stable by name)
function pickBgm(bgm, key, root) {
  if (!bgm) return null;
  const p = path.isAbsolute(bgm) ? bgm : path.join(root, bgm);
  if (!fs.existsSync(p)) return null;
  if (fs.statSync(p).isFile()) return p;
  const files = fs.readdirSync(p).filter((f) => /\.(mp3|m4a|wav|ogg)$/i.test(f)).sort();
  if (!files.length) return null;
  const h = [...key].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  return path.join(p, files[h % files.length]);
}

module.exports = { mux, pickBgm };
