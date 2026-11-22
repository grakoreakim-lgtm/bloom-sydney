// QA (검수) for one finished video: narration ↔ screen sync and on-screen values.
// Returns { ok, problems[], summary } — run-day.js only auto-publishes when ok is true.
//
// Checks
//  1. every step has its narration cue(s): tip always, mistake when the step has one
//  2. each narration clip ends before the next cue starts (no talking over the next step)
//  3. each step's narration is heard while that step is on screen (cue order = step order)
//  4. the value on screen after each action matches what the narration says (recorder read-back)
//  5. the audio does not run past the end of the video
const { execSync } = require('child_process');

const dur = (f) => Math.round(Number(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${f}"`).toString().trim()) * 1000);

function qa(timeline, clips, videoFile, { toleranceMs = 150 } = {}) {
  const problems = [];
  const cues = [...timeline.cues].sort((a, b) => a.t - b.t);
  const ids = new Set(cues.map((c) => c.id));

  // 1) cues present
  for (const st of timeline.steps || []) {
    if (st.hasTip && !ids.has(`s${st.n}-tip`)) problems.push(`step ${st.n} (${st.field}): tip narration missing`);
    if (st.hasMistake && !ids.has(`s${st.n}-mistake`)) problems.push(`step ${st.n} (${st.field}): mistake narration missing`);
  }
  // 2) no overlap, 3) order
  let lastStep = 0;
  cues.forEach((c, i) => {
    const clip = clips[c.id];
    if (!clip) { if (!/^card-/.test(c.id)) problems.push(`cue ${c.id}: no narration clip`); return; }
    const next = cues[i + 1];
    if (next && c.t + clip.durationMs > next.t + toleranceMs) problems.push(`cue ${c.id}: narration (${clip.durationMs} ms) runs ${c.t + clip.durationMs - next.t} ms into the next step (${next.id})`);
    const m = c.id.match(/^s(\d+)-/); if (m) { const n = Number(m[1]); if (n < lastStep) problems.push(`cue ${c.id}: out of order`); lastStep = n; }
  });
  // 4) read-back of values on screen
  for (const ch of timeline.checks || []) if (!ch.ok) problems.push(`step ${ch.step} (${ch.field}): screen shows "${ch.actual ?? ch.why}" but narration expects "${ch.expected}"`);
  // 5) audio fits the video
  if (videoFile) {
    const vd = dur(videoFile); const lastCue = cues[cues.length - 1];
    const end = lastCue && clips[lastCue.id] ? lastCue.t + clips[lastCue.id].durationMs : 0;
    if (end > vd + toleranceMs) problems.push(`narration ends at ${end} ms but the video is ${vd} ms`);
  }
  const ok = problems.length === 0;
  const steps = (timeline.steps || []).length, checked = (timeline.checks || []).length;
  return { ok, problems, summary: `${ok ? 'PASS' : 'FAIL'} — ${steps} steps, ${cues.length} cues, ${checked} on-screen checks${ok ? '' : `, ${problems.length} problem(s)`}` };
}

module.exports = { qa };
