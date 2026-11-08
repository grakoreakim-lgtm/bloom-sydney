// Mux: place each narration clip at its cue time on top of the silent recording.
const { execSync } = require('child_process');

/**
 * @param videoIn  silent mp4 from the recorder
 * @param cues     [{id, t}] from the recorder timeline (ms)
 * @param clips    { [cueId]: { file, durationMs } } from narration.js
 * @param videoOut output mp4 (h264 copied, aac audio)
 */
function mux(videoIn, cues, clips, videoOut, { bgm = null, bgmVolume = 0.08 } = {}) {
  const placed = cues.filter((c) => clips[c.id]);
  if (!placed.length) throw new Error('no narration clips matched the cue timeline');
  const inputs = [`-i "${videoIn}"`, ...placed.map((c) => `-i "${clips[c.id].file}"`)];
  let filters = placed.map((c, i) => `[${i + 1}:a]adelay=${Math.max(0, c.t)}|${Math.max(0, c.t)}[a${i}]`);
  let mixIn = placed.map((_, i) => `[a${i}]`).join('');
  let n = placed.length;
  if (bgm) { inputs.push(`-stream_loop -1 -i "${bgm}"`); filters.push(`[${n + 1}:a]volume=${bgmVolume}[bgm]`); mixIn += '[bgm]'; n += 1; }
  filters.push(`${mixIn}amix=inputs=${n}:duration=first:normalize=0[out]`);
  // duration=first keeps the mix as long as the first audio input; pad to video length with apad + -shortest
  const cmd = `ffmpeg -y -loglevel error ${inputs.join(' ')} -filter_complex "${filters.join(';')};[out]apad[outp]" -map 0:v -map "[outp]" -c:v copy -c:a aac -b:a 160k -shortest "${videoOut}"`;
  execSync(cmd, { stdio: 'inherit', shell: '/bin/bash' });
  return videoOut;
}

module.exports = { mux };
