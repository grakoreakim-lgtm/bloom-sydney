// Align narration cues to the recorded video's own clock.
// The recorder changes two small corner squares (lib/overlay.js mark) at every cue; here we find the first frame where
// each cue's colour pair appears and return that time. Busy machines record video slower than real time, so the
// wall-clock cue times drift; these times do not.
const { execSync } = require('child_process');

const FPS = 25;

/** codes per frame (0..63, or -1 when unreadable) from the bottom-left 72x12 marker of the original recording */
function readMarks(video) {
  // average each 12x8 block's brightness: 6 values per frame
  const buf = execSync(`ffmpeg -v error -i "${video}" -vf "fps=${FPS},crop=72:12:0:ih-12,crop=72:8:0:2,scale=6:1:flags=area,format=gray" -f rawvideo -pix_fmt gray -`, { maxBuffer: 1 << 28 });
  const codes = [];
  for (let i = 0; i + 6 <= buf.length; i += 6) {
    let code = 0, ok = true;
    for (let b = 0; b < 6; b++) { const v = buf[i + b]; if (v > 170) code |= 1 << b; else if (v >= 85) ok = false; }
    codes.push(ok ? code : -1);
  }
  return codes;
}

/**
 * @param video  the original recording (webm, before scaling/patching)
 * @param cues   [{ id, t, mark }] from the recorder (t = wall clock ms)
 * @returns { cues: [{ id, t, tWall, mark, found }], found, total, maxShiftMs }
 */
function align(video, cues) {
  const codes = readMarks(video);
  let from = 0; const out = [];
  for (const c of cues) {
    const want = c.mark % 64; let at = -1;
    // the code must hold for 2 frames (avoids a single mis-read frame), and cues only move forward
    for (let i = from; i < codes.length - 1; i++) if (codes[i] === want && codes[i + 1] === want) { at = i; break; }
    if (at >= 0) from = at + 1;
    out.push({ ...c, tWall: c.t, t: at >= 0 ? Math.round((at * 1000) / FPS) : null, found: at >= 0 });
  }
  // cues whose marker was not seen: interpolate between found neighbours (by wall-clock position)
  for (let i = 0; i < out.length; i++) {
    if (out[i].found) continue;
    let p = i - 1; while (p >= 0 && !out[p].found) p--;
    let n = i + 1; while (n < out.length && !out[n].found) n++;
    if (p >= 0 && n < out.length) out[i].t = Math.round(out[p].t + ((out[i].tWall - out[p].tWall) * (out[n].t - out[p].t)) / Math.max(1, out[n].tWall - out[p].tWall));
    else if (p >= 0) out[i].t = out[p].t + (out[i].tWall - out[p].tWall);
    else if (n < out.length) out[i].t = Math.max(0, out[n].t - (out[n].tWall - out[i].tWall));
    else out[i].t = out[i].tWall;
  }
  const found = out.filter((c) => c.found).length;
  const maxShiftMs = Math.max(0, ...out.map((c) => Math.abs(c.t - c.tWall)));
  return { cues: out, found, total: out.length, maxShiftMs };
}

module.exports = { align, readMarks };
