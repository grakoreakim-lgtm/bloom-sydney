// Overlay layer injected into the page being recorded (runs INSIDE the browser).
// Style: "Bold Dark" in-video layer (step badge + progress, yellow field window, black caption bar with
// yellow keyword, dark mistake card) + "Travel Ticket" full-screen cards (intro / section / outro).
// Keyword emphasis: wrap words in **double asterisks** in the form texts → rendered as yellow marks.

const OVERLAY_CSS = `
.yt-ov { font-family: "Pretendard", "Noto Sans KR", "Inter", "Segoe UI", system-ui, sans-serif; }
#yt-dim { position: fixed; inset: 0; z-index: 2147481000; background: rgba(0,0,0,.55); pointer-events: none; display: none; }
#yt-dim.on { display: block; }

/* window onto the current field: a copy of nothing — we just cut a hole with box-shadow and add a yellow frame */
#yt-ring { position: absolute; z-index: 2147482000; pointer-events: none; display: none; border-radius: 10px;
  box-shadow: 0 0 0 4px #facc15, 0 0 0 9999px rgba(0,0,0,.55); transition: left .35s ease, top .35s ease, width .35s ease, height .35s ease; }
#yt-ring.pulse { animation: ytpulse 1.2s ease-in-out infinite; }
@keyframes ytpulse { 50% { box-shadow: 0 0 0 7px #facc15, 0 0 0 9999px rgba(0,0,0,.55); } }
#yt-arrow { position: absolute; z-index: 2147482100; pointer-events: none; display: none; font-size: 44px; color: #facc15; transform: rotate(20deg); text-shadow: 0 4px 12px rgba(0,0,0,.5); }
#yt-arrow.on { display: block; animation: ytbob 1s ease-in-out infinite; }
@keyframes ytbob { 50% { transform: rotate(20deg) translate(-6px, 4px); } }

/* step badge, top-left */
#yt-step { position: fixed; left: 28px; top: 22px; z-index: 2147483000; display: flex; align-items: stretch; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,.5); }
#yt-step .n { background: #facc15; color: #111; font-weight: 900; font-size: 28px; padding: 8px 14px; display: flex; align-items: center; }
#yt-step .l { background: #111; color: #fff; font-weight: 800; font-size: 24px; padding: 10px 16px; display: flex; align-items: center; gap: 12px; }
#yt-step .bar { width: 110px; height: 6px; background: #333; border-radius: 3px; overflow: hidden; } #yt-step .bar i { display: block; height: 100%; background: #facc15; width: 0; transition: width .5s; }
#yt-step .c { color: #9ca3af; font-weight: 700; font-size: 18px; }

/* top-right pill (easy promise) / red warn flag */
#yt-easy { position: fixed; right: 28px; top: 22px; z-index: 2147483000; background: #111; color: #fff; padding: 10px 16px; border-radius: 12px; font-size: 19px; font-weight: 800; box-shadow: 0 10px 30px rgba(0,0,0,.4); }
#yt-easy.warn { background: #ef4444; }

/* black caption bar (tip) — bottom centre */
#yt-cap { position: fixed; left: 0; right: 0; bottom: 42px; z-index: 2147483000; text-align: center; display: none; }
#yt-cap .in { display: inline-block; max-width: 1180px; background: rgba(0,0,0,.9); color: #fff; font-size: 36px; font-weight: 900; padding: 14px 26px; border-radius: 12px; border: 2px solid #222; line-height: 1.35; text-align: left; }
#yt-cap .in small { display: block; font-size: 20px; font-weight: 600; color: #cbd5e1; margin-top: 4px; }
.yt-ov mark { background: #facc15; color: #111; padding: 0 7px; border-radius: 6px; }
#yt-cap.on { display: block; animation: ytup .3s ease; }
@keyframes ytup { from { transform: translateY(14px); opacity: 0; } }

/* dark mistake card — next to the field */
#yt-callout { position: absolute; z-index: 2147483000; width: 500px; background: #111; border: 1px solid #2a2a2a; border-radius: 16px; padding: 18px 20px; color: #fff; box-shadow: 0 30px 60px rgba(0,0,0,.6); display: none; }
#yt-callout.on { display: block; animation: ytup .3s ease; }
#yt-callout .k { display: inline-block; background: #ef4444; color: #fff; font-weight: 900; font-size: 13px; padding: 5px 12px; border-radius: 999px; letter-spacing: .04em; margin-bottom: 8px; font-size: 17px; }
#yt-callout .t { font-size: 29px; font-weight: 900; line-height: 1.25; }
#yt-callout .b { font-size: 19px; color: #cbd5e1; line-height: 1.5; margin-top: 8px; }
#yt-callout .ex { margin-top: 12px; display: grid; gap: 8px; } #yt-callout .ex div { padding: 10px 14px; border-radius: 10px; font-weight: 800; font-size: 23px; }
#yt-callout .bad { background: #2a1215; color: #fca5a5; text-decoration: line-through; } #yt-callout .good { background: #14231a; color: #86efac; }

/* pause card — "type this much, then come back" */
#yt-pause { position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 2147483300; background: #facc15; color: #111; border-radius: 18px; padding: 18px 28px; font-weight: 900; font-size: 38px; display: none; box-shadow: 0 30px 70px rgba(0,0,0,.6); }
#yt-pause small { display: block; font-size: 20px; font-weight: 700; color: #444; margin-top: 4px; }
#yt-pause.on { display: block; animation: ytpop .25s ease; }
@keyframes ytpop { from { transform: translate(-50%, -50%) scale(.9); opacity: 0; } }

/* full-screen TICKET cards */
#yt-card { position: fixed; inset: 0; z-index: 2147483600; display: none; background: #f3ede3; }
#yt-card.on { display: block; }
#yt-card .stripe { position: absolute; inset: 0; background: repeating-linear-gradient(135deg, transparent 0 28px, rgba(28,25,23,.035) 28px 30px); }
#yt-card .pass { position: absolute; left: 60px; top: 90px; right: 60px; bottom: 90px; background: #fff; border-radius: 26px; box-shadow: 0 40px 90px -30px rgba(28,25,23,.4); display: grid; grid-template-columns: 1fr 420px; overflow: hidden; }
#yt-card .l { padding: 44px 48px; position: relative; color: #1c1917; }
#yt-card .r { background: #0f766e; color: #fff; padding: 40px 36px; position: relative; border-left: 3px dashed #e7e5e4; }
#yt-card .r::before, #yt-card .r::after { content: ""; position: absolute; left: -18px; width: 36px; height: 36px; border-radius: 50%; background: #f3ede3; } #yt-card .r::before { top: -18px; } #yt-card .r::after { bottom: -18px; }
#yt-card .route { display: flex; align-items: center; gap: 18px; font-weight: 900; font-size: 54px; letter-spacing: -.02em; } #yt-card .route small { font-size: 15px; color: #78716c; font-weight: 700; display: block; letter-spacing: .1em; } #yt-card .route .pl { font-size: 30px; color: #0f766e; }
#yt-card h1 { margin: 26px 0 0; font-size: 52px; line-height: 1.08; letter-spacing: -.03em; font-weight: 900; white-space: pre-line; color: #1c1917; border: 0; padding: 0; } #yt-card h1 em { font-style: normal; background: linear-gradient(transparent 55%, #fde68a 55%); }
#yt-card .sub { margin-top: 16px; font-size: 20px; color: #57534e; line-height: 1.5; white-space: pre-line; }
#yt-card .meta { margin-top: 24px; display: flex; gap: 32px; } #yt-card .meta div small { display: block; font-size: 12px; letter-spacing: .14em; color: #78716c; font-weight: 800; } #yt-card .meta div b { font-size: 22px; }
#yt-card .stamp { position: absolute; right: 40px; bottom: 36px; width: 140px; height: 140px; border: 5px solid #dc2626; border-radius: 50%; color: #dc2626; font-weight: 900; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 21px; line-height: 1.1; transform: rotate(-14deg); opacity: .85; }
#yt-card .r .flag { font-size: 64px; } #yt-card .r h2 { margin: 12px 0 6px; font-size: 26px; line-height: 1.2; color: #fff; border: 0; padding: 0; font-weight: 800; } #yt-card .r p { margin: 0; color: #fff; opacity: .9; font-size: 16px; line-height: 1.5; white-space: pre-line; }
#yt-card .r .next { margin-top: 18px; display: grid; gap: 10px; } #yt-card .r .next div { background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.3); border-radius: 12px; padding: 10px 12px; font-weight: 800; font-size: 16px; }
#yt-card .r .bar { position: absolute; left: 36px; right: 36px; bottom: 36px; height: 46px; background: repeating-linear-gradient(90deg, #fff 0 3px, transparent 3px 6px, #fff 6px 7px, transparent 7px 12px); opacity: .9; }
#yt-card .brand { position: absolute; left: 60px; bottom: 38px; font-weight: 800; color: #78716c; font-size: 17px; }

/* fake cursor */
#yt-cursor { position: fixed; z-index: 2147483500; width: 26px; height: 26px; pointer-events: none; transform: translate(-4px,-2px); transition: left .35s ease, top .35s ease; display: none; }
#yt-cursor.click::after { content: ""; position: absolute; left: -12px; top: -12px; width: 50px; height: 50px; border-radius: 50%; border: 3px solid #facc15; animation: ytclick .45s ease-out forwards; }
@keyframes ytclick { from { transform: scale(.3); opacity: 1; } to { transform: scale(1.3); opacity: 0; } }
`;

const CURSOR_SVG = `<svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 2l16 9-7 1.5L16.5 20l-3 1.3L10 14.5 5 19z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg>`;

function install() {
  if (document.getElementById('yt-ov-style')) return;
  const style = document.createElement('style'); style.id = 'yt-ov-style'; style.textContent = OVERLAY_CSS; document.documentElement.appendChild(style);
  const mk = (id, html) => { const el = document.createElement('div'); el.id = id; el.className = 'yt-ov'; el.innerHTML = html || ''; document.documentElement.appendChild(el); return el; };   // outside <body>, so body zoom never scales the overlay
  mk('yt-ring'); mk('yt-arrow', '➜');
  mk('yt-step', '<span class="n">1</span><span class="l"><span class="lbl"></span><span class="bar"><i></i></span><span class="c"></span></span>');
  mk('yt-easy'); mk('yt-cap', '<div class="in"></div>'); mk('yt-callout', '<div class="k"></div><div class="t"></div><div class="b"></div><div class="ex"></div>');
  mk('yt-pause'); mk('yt-card'); mk('yt-cursor', CURSOR_SVG);
}
const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const mark = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<mark>$1</mark>');

function setStep(current, total, label) {
  install();
  document.querySelector('#yt-step .n').textContent = current;
  document.querySelector('#yt-step .lbl').textContent = label;
  document.querySelector('#yt-step .c').textContent = `${current}/${total}`;
  document.querySelector('#yt-step .bar i').style.width = Math.round((current / total) * 100) + '%';
}
function setEasyPill(text, warn = false) { install(); const el = document.getElementById('yt-easy'); el.textContent = text || ''; el.className = 'yt-ov' + (warn ? ' warn' : ''); el.style.display = text ? 'block' : 'none'; }

function rectOf(selector) {
  const el = document.querySelector(selector); if (!el) return null;
  el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
  const r = el.getBoundingClientRect();
  return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height, vx: r.left, vy: r.top };
}
function highlight(selector, pulse = true) {
  install(); const r = rectOf(selector); const ring = document.getElementById('yt-ring'); const ar = document.getElementById('yt-arrow');
  if (!r) { ring.style.display = 'none'; ar.className = 'yt-ov'; return null; }
  const pad = 10;
  Object.assign(ring.style, { display: 'block', left: (r.x - pad) + 'px', top: (r.y - pad) + 'px', width: (r.w + pad * 2) + 'px', height: (r.h + pad * 2) + 'px' });
  ring.classList.toggle('pulse', pulse);
  Object.assign(ar.style, { left: (r.x + Math.min(r.w, 360) - 10) + 'px', top: (r.y - 62) + 'px' }); ar.className = 'yt-ov on';
  return r;
}
function clearHighlight() { install(); document.getElementById('yt-ring').style.display = 'none'; document.getElementById('yt-arrow').className = 'yt-ov'; document.getElementById('yt-callout').className = 'yt-ov'; document.getElementById('yt-cap').className = 'yt-ov'; setEasyPill(window.__ytEasy || '', false); }

// tip → caption bar at the bottom; warn → dark card beside the field + red flag top-right
function callout(selector, { kind = 'tip', title, body, bad, good }) {
  install();
  if (kind === 'tip') {
    const cap = document.getElementById('yt-cap');
    cap.querySelector('.in').innerHTML = mark(body || title) + (title && body ? `<small>${esc(title)}</small>` : '');
    cap.className = 'yt-ov on'; return;
  }
  const r = rectOf(selector); const box = document.getElementById('yt-callout');
  box.querySelector('.k').textContent = title || ''; box.querySelector('.t').innerHTML = mark(body || '');
  box.querySelector('.b').innerHTML = ''; const ex = box.querySelector('.ex');
  ex.innerHTML = (bad ? `<div class="bad">${esc(bad)}</div>` : '') + (good ? `<div class="good">${esc(good)}</div>` : ''); ex.style.display = bad || good ? 'grid' : 'none';
  box.className = 'yt-ov on'; setEasyPill(window.__ytWarn || '⚠ 많이 틀리는 곳', true);
  if (!r) return;
  const vw = window.innerWidth, boxW = 500; let left = r.x + r.w + 28, top = r.y - 6;
  if (r.vx + r.w + 28 + boxW > vw) { left = Math.max(20, r.x + r.w - boxW); top = r.y + r.h + 22; }
  box.style.left = left + 'px'; box.style.top = top + 'px';
  // keep clear of the caption bar at the bottom: move above the field, or hide the caption if there is no room
  const h = box.offsetHeight, capTop = window.innerHeight - 170;
  if (top - window.scrollY + h > capTop) {
    const above = r.y - h - 22;
    if (above - window.scrollY > 90) box.style.top = above + 'px';
    else document.getElementById('yt-cap').className = 'yt-ov';
  }
}
// browser-style zoom of the page content (not the overlay) so form fields are readable on a phone
function setZoom(z) { if (document.body) document.body.style.zoom = String(z || 1); }
function pause(text, sub) { install(); const p = document.getElementById('yt-pause'); p.innerHTML = esc(text) + (sub ? `<small>${esc(sub)}</small>` : ''); p.className = 'yt-ov on'; }
function hidePause() { install(); document.getElementById('yt-pause').className = 'yt-ov'; }

// ticket card: { route:{from,fromCity,to,toCity}, title (may contain **em**), subtitle, meta:[{k,v}], stamp, flag, rightTitle, rightText, next:[...], brand }
function card(c) {
  install(); const el = document.getElementById('yt-card');
  const route = c.route ? `<div class="route"><div>${esc(c.route.from)}<small>${esc(c.route.fromCity || '')}</small></div><span class="pl">✈</span><div>${esc(c.route.to)}<small>${esc(c.route.toCity || '')}</small></div></div>` : '';
  const meta = (c.meta || []).map((m) => `<div><small>${esc(m.k)}</small><b>${esc(m.v)}</b></div>`).join('');
  const next = (c.next || []).map((n) => `<div>${esc(n)}</div>`).join('');
  el.innerHTML = `<div class="stripe"></div><div class="pass"><div class="l">${route}<h1>${mark(c.title || '')}</h1>${c.subtitle ? `<div class="sub">${esc(c.subtitle)}</div>` : ''}${meta ? `<div class="meta">${meta}</div>` : ''}${c.stamp ? `<div class="stamp">${esc(c.stamp).replace(/\n/g, '<br>')}</div>` : ''}</div>
    <div class="r"><div class="flag">${c.flag || ''}</div><h2>${esc(c.rightTitle || '')}</h2><p>${esc(c.rightText || '')}</p>${next ? `<div class="next">${next}</div>` : ''}<div class="bar"></div></div></div><div class="brand">${esc(c.brand || '▶ 따라하면 끝')}</div>`;
  el.className = 'yt-ov on';
}
function hideCard() { install(); document.getElementById('yt-card').className = 'yt-ov'; }
function moveCursor(selector) { install(); const r = rectOf(selector); const cur = document.getElementById('yt-cursor'); if (!r) return; cur.style.display = 'block'; cur.style.left = (r.vx + Math.min(r.w / 2, 40)) + 'px'; cur.style.top = (r.vy + r.h / 2) + 'px'; }
function clickCursor() { const cur = document.getElementById('yt-cursor'); cur.classList.remove('click'); void cur.offsetWidth; cur.classList.add('click'); }
function setStrings(easy, warn) { window.__ytEasy = easy; window.__ytWarn = warn; setEasyPill(easy, false); }

module.exports = {
  bundle: `
    window.__ytOverlay = (function(){
      const OVERLAY_CSS = ${JSON.stringify(OVERLAY_CSS)}; const CURSOR_SVG = ${JSON.stringify(CURSOR_SVG)};
      ${install.toString()} const esc = ${esc.toString()}; const mark = ${mark.toString()};
      ${setStep.toString()} ${setEasyPill.toString()} ${rectOf.toString()} ${highlight.toString()} ${clearHighlight.toString()}
      ${callout.toString()} ${pause.toString()} ${hidePause.toString()} ${card.toString()} ${hideCard.toString()} ${moveCursor.toString()} ${clickCursor.toString()} ${setStrings.toString()} ${setZoom.toString()}
      return { install, setStep, setEasyPill, setStrings, highlight, clearHighlight, callout, pause, hidePause, card, hideCard, moveCursor, clickCursor, setZoom };
    })();
  `,
};
