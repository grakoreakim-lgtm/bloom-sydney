// Shorts: cut the "common mistake" moments out of a finished tutorial into one vertical (1080x1920) clip
// under 60 s, with a big headline on top and a "full video" pointer at the bottom.
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TXT = {
  ko: { head: (c) => `${c}\n이것만 조심하세요`, sub: (n) => `실수 TOP ${n}`, foot: '▶ 아래 링크에서 전체 영상 보기', title: (f, n) => `${f} 실수 TOP ${n} | 이것만 조심하세요 #Shorts` },
  en: { head: (c) => `${c}\nAvoid these mistakes`, sub: (n) => `${n} mistakes to avoid`, foot: '▶ Full step-by-step video: tap the link below', title: (f, n) => `${f}: ${n} Mistakes to Avoid #Shorts` },
};

function fontFile() {
  const cands = ['/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc', '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'];
  for (const f of cands) if (fs.existsSync(f)) return f;
  try { return execSync('fc-match -f "%{file}" "Noto Sans CJK KR:bold"').toString().trim(); } catch { return ''; }
}

/** pick up to `max` mistake segments, each [start,end) ms, total ≤ limitMs */
function segments(cues, { max = 3, limitMs = 56000, leadMs = 1800, capMs = 17000 } = {}) {
  const out = []; let total = 0;
  for (let i = 0; i < cues.length && out.length < max; i++) {
    const c = cues[i]; if (!/-mistake$/.test(c.id)) continue;
    const next = cues[i + 1]?.t ?? c.t + capMs;
    const start = Math.max(0, c.t - leadMs), end = Math.min(next, c.t + capMs);
    if (end - start < 3000 || total + (end - start) > limitMs) continue;
    out.push({ start, end }); total += end - start;
  }
  return out;
}

/**
 * @param videoIn   finished tutorial mp4 (with narration)
 * @param cues      recorder timeline cues
 * @param info      { lang, country, form }  (display strings in the video's language)
 * @returns { file, title, description } or null when there are no usable mistake moments
 */
function makeShort(videoIn, cues, info, outFile) {
  const segs = segments(cues);
  if (!segs.length) return null;
  const t = TXT[info.lang] || TXT.en;
  const dir = path.dirname(outFile);
  const tf = (name, s) => { const f = path.join(dir, `.short-${name}.txt`); fs.writeFileSync(f, s); return f; };
  const head = tf('head', t.head(info.short || info.country)), sub = tf('sub', t.sub(segs.length)), foot = tf('foot', t.foot);
  const font = fontFile(); const ff = font ? `fontfile='${font}':` : '';
  const parts = segs.map((s, i) => `[0:v]trim=start=${s.start / 1000}:end=${s.end / 1000},setpts=PTS-STARTPTS[v${i}];[0:a]atrim=start=${s.start / 1000}:end=${s.end / 1000},asetpts=PTS-STARTPTS[a${i}]`);
  const cat = segs.map((_, i) => `[v${i}][a${i}]`).join('') + `concat=n=${segs.length}:v=1:a=1[cv][ca]`;
  // 16:9 frame scaled to 1080 wide, sitting in the middle of a dark 1080x1920 canvas
  const layout = `[cv]scale=1080:-2,pad=1080:1920:0:(oh-ih)/2:color=0x0b1220,`
    + `drawtext=${ff}textfile='${head}':fontcolor=white:fontsize=70:line_spacing=18:x=(w-text_w)/2:y=230,`
    + `drawtext=${ff}textfile='${sub}':fontcolor=0x111111:fontsize=64:box=1:boxcolor=0xffd400:boxborderw=22:x=(w-text_w)/2:y=520,`
    + `drawtext=${ff}textfile='${foot}':fontcolor=white:fontsize=46:x=(w-text_w)/2:y=1500[ov]`;
  const cmd = `ffmpeg -y -loglevel error -i "${videoIn}" -filter_complex "${parts.join(';')};${cat};${layout}" -map "[ov]" -map "[ca]" -c:v libx264 -preset veryfast -crf 21 -pix_fmt yuv420p -c:a aac -b:a 160k -r 30 "${outFile}"`;
  execSync(cmd, { stdio: 'inherit', shell: '/bin/bash' });
  [head, sub, foot].forEach((f) => fs.unlinkSync(f));
  return { file: outFile, title: t.title(info.form, segs.length).slice(0, 100), seconds: Math.round(segs.reduce((a, s) => a + s.end - s.start, 0) / 1000) };
}

module.exports = { makeShort, segments };
