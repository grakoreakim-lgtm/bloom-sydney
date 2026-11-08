// Overlay layer injected into the page being recorded.
// Everything here runs INSIDE the browser (page.evaluate / addInitScript).
// It draws: step badge, field highlight ring, callout box, full-screen title cards.

const OVERLAY_CSS = `
#yt-ov-style, .yt-ov { font-family: "Pretendard", "Noto Sans KR", "Segoe UI", system-ui, sans-serif; }

/* progress badge, top-left */
#yt-step {
  position: fixed; top: 18px; left: 18px; z-index: 2147483000;
  background: #111; color: #fff; padding: 10px 16px; border-radius: 999px;
  font-size: 18px; font-weight: 700; letter-spacing: .3px;
  box-shadow: 0 4px 16px rgba(0,0,0,.3); display: flex; gap: 10px; align-items: center;
}
#yt-step .dot { width: 10px; height: 10px; border-radius: 50%; background: #ff3b3b; animation: ytblink 1s infinite; }
@keyframes ytblink { 50% { opacity: .2; } }

/* "easy to follow" pill, top-right */
#yt-easy {
  position: fixed; top: 18px; right: 18px; z-index: 2147483000;
  background: #0b7a3b; color: #fff; padding: 10px 16px; border-radius: 999px;
  font-size: 16px; font-weight: 700; box-shadow: 0 4px 16px rgba(0,0,0,.3);
}

/* highlight ring around the current field */
#yt-ring {
  position: absolute; z-index: 2147482000; pointer-events: none;
  border: 4px solid #ff3b3b; border-radius: 10px;
  box-shadow: 0 0 0 6px rgba(255,59,59,.25), 0 0 0 9999px rgba(0,0,0,.35);
  transition: all .35s ease; display: none;
}
#yt-ring.pulse { animation: ytpulse 1.1s ease-in-out infinite; }
@keyframes ytpulse {
  0%,100% { box-shadow: 0 0 0 6px rgba(255,59,59,.25), 0 0 0 9999px rgba(0,0,0,.35); }
  50%     { box-shadow: 0 0 0 14px rgba(255,59,59,.05), 0 0 0 9999px rgba(0,0,0,.35); }
}

/* callout box next to the field */
#yt-callout {
  position: absolute; z-index: 2147483000; max-width: 420px;
  background: #fff; color: #111; border-radius: 14px; padding: 16px 18px;
  box-shadow: 0 10px 40px rgba(0,0,0,.35); font-size: 18px; line-height: 1.45;
  border-left: 8px solid #ff3b3b; display: none;
}
#yt-callout.tip  { border-left-color: #0b7a3b; }
#yt-callout.warn { border-left-color: #f5a623; background: #fff8e6; }
#yt-callout .t { font-weight: 800; font-size: 20px; margin-bottom: 6px; display: flex; gap: 8px; align-items: center; }
#yt-callout .b { white-space: pre-line; }
#yt-callout .ex { margin-top: 8px; font-family: ui-monospace, Menlo, monospace; background: #f1f1f1; padding: 6px 10px; border-radius: 8px; font-size: 16px; }
#yt-callout .ex .bad { color: #c62828; text-decoration: line-through; margin-right: 10px; }
#yt-callout .ex .good { color: #0b7a3b; font-weight: 700; }

/* full-screen title cards (intro / outro / section) */
#yt-card {
  position: fixed; inset: 0; z-index: 2147483600; display: none;
  background: radial-gradient(1200px 600px at 20% 10%, #1e3a8a 0%, #0b1220 60%);
  color: #fff; align-items: center; justify-content: center; text-align: center; padding: 60px;
}
#yt-card .inner { max-width: 1000px; }
#yt-card h1 { font-size: 64px; margin: 0 0 18px; line-height: 1.15; }
#yt-card h2 { font-size: 30px; font-weight: 500; margin: 0 0 30px; opacity: .9; white-space: pre-line; }
#yt-card .chips { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
#yt-card .chip { background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.3); padding: 10px 18px; border-radius: 999px; font-size: 22px; }
#yt-card .big { font-size: 110px; font-weight: 900; color: #7CFF9B; margin-bottom: 10px; }

/* fake cursor so viewers can see where we click */
#yt-cursor {
  position: fixed; z-index: 2147483500; width: 26px; height: 26px; pointer-events: none;
  transform: translate(-4px,-2px); transition: left .35s ease, top .35s ease; display: none;
}
#yt-cursor.click::after {
  content: ""; position: absolute; left: -12px; top: -12px; width: 50px; height: 50px; border-radius: 50%;
  border: 3px solid #ff3b3b; animation: ytclick .45s ease-out forwards;
}
@keyframes ytclick { from { transform: scale(.3); opacity: 1; } to { transform: scale(1.3); opacity: 0; } }
`;

const CURSOR_SVG = `<svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 2l16 9-7 1.5L16.5 20l-3 1.3L10 14.5 5 19z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg>`;

function install() {
  if (document.getElementById('yt-ov-style')) return;
  const style = document.createElement('style');
  style.id = 'yt-ov-style';
  style.textContent = OVERLAY_CSS;
  document.documentElement.appendChild(style);

  const mk = (id, cls, html) => {
    const el = document.createElement('div');
    el.id = id; el.className = 'yt-ov ' + (cls || ''); el.innerHTML = html || '';
    document.body.appendChild(el); return el;
  };
  mk('yt-step', '', '<span class="dot"></span><span class="txt"></span>');
  mk('yt-easy', '', '');
  mk('yt-ring', '', '');
  mk('yt-callout', '', '<div class="t"></div><div class="b"></div><div class="ex"></div>');
  mk('yt-card', '', '<div class="inner"></div>');
  mk('yt-cursor', '', CURSOR_SVG);
}

function setStep(current, total, label) {
  install();
  document.querySelector('#yt-step .txt').textContent = `STEP ${current}/${total}  ·  ${label}`;
}

function setEasyPill(text) {
  install();
  const el = document.getElementById('yt-easy');
  el.textContent = text || '';
  el.style.display = text ? 'block' : 'none';
}

function rectOf(selector) {
  const el = document.querySelector(selector);
  if (!el) return null;
  el.scrollIntoView({ block: 'center', behavior: 'instant' });
  const r = el.getBoundingClientRect();
  return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height,
           vx: r.left, vy: r.top };
}

function highlight(selector, pulse = true) {
  install();
  const r = rectOf(selector);
  const ring = document.getElementById('yt-ring');
  if (!r) { ring.style.display = 'none'; return null; }
  const pad = 8;
  Object.assign(ring.style, {
    display: 'block', left: (r.x - pad) + 'px', top: (r.y - pad) + 'px',
    width: (r.w + pad * 2) + 'px', height: (r.h + pad * 2) + 'px',
  });
  ring.classList.toggle('pulse', pulse);
  return r;
}

function clearHighlight() {
  install();
  document.getElementById('yt-ring').style.display = 'none';
  document.getElementById('yt-callout').style.display = 'none';
}

// kind: 'tip' | 'warn' | 'error'
function callout(selector, { kind = 'tip', title, body, bad, good }) {
  install();
  const r = rectOf(selector);
  const box = document.getElementById('yt-callout');
  box.className = 'yt-ov ' + kind;
  box.querySelector('.t').textContent = (kind === 'tip' ? '✅ ' : '⚠️ ') + (title || '');
  box.querySelector('.b').textContent = body || '';
  const ex = box.querySelector('.ex');
  if (bad || good) {
    ex.style.display = 'block';
    ex.innerHTML = (bad ? `<span class="bad">${bad}</span>` : '') + (good ? `<span class="good">${good}</span>` : '');
  } else ex.style.display = 'none';
  box.style.display = 'block';
  if (!r) return;
  // place to the right of the field if there is room, otherwise below
  const vw = window.innerWidth;
  const boxW = Math.min(420, vw - 40);
  let left = r.x + r.w + 24, top = r.y - 10;
  if (r.vx + r.w + 24 + boxW > vw) { left = Math.max(20, r.x); top = r.y + r.h + 18; }
  box.style.left = left + 'px'; box.style.top = top + 'px';
}

function card({ title, subtitle, chips = [], big }) {
  install();
  const c = document.getElementById('yt-card');
  c.querySelector('.inner').innerHTML =
    (big ? `<div class="big">${big}</div>` : '') +
    `<h1>${title || ''}</h1>` +
    (subtitle ? `<h2>${subtitle}</h2>` : '') +
    (chips.length ? `<div class="chips">${chips.map(x => `<span class="chip">${x}</span>`).join('')}</div>` : '');
  c.style.display = 'flex';
}
function hideCard() { install(); document.getElementById('yt-card').style.display = 'none'; }

function moveCursor(selector) {
  install();
  const r = rectOf(selector);
  const cur = document.getElementById('yt-cursor');
  if (!r) return;
  cur.style.display = 'block';
  cur.style.left = (r.vx + Math.min(r.w / 2, 40)) + 'px';
  cur.style.top = (r.vy + r.h / 2) + 'px';
}
function clickCursor() {
  const cur = document.getElementById('yt-cursor');
  cur.classList.remove('click'); void cur.offsetWidth; cur.classList.add('click');
}

module.exports = {
  // exposed as a single string so it can be injected with addInitScript
  bundle: `
    window.__ytOverlay = (function(){
      const OVERLAY_CSS = ${JSON.stringify(OVERLAY_CSS)};
      const CURSOR_SVG = ${JSON.stringify(CURSOR_SVG)};
      ${install.toString()}
      ${setStep.toString()}
      ${setEasyPill.toString()}
      ${rectOf.toString()}
      ${highlight.toString()}
      ${clearHighlight.toString()}
      ${callout.toString()}
      ${card.toString()}
      ${hideCard.toString()}
      ${moveCursor.toString()}
      ${clickCursor.toString()}
      return { install, setStep, setEasyPill, highlight, clearHighlight, callout, card, hideCard, moveCursor, clickCursor };
    })();
  `,
};
