import { db, storage, $, $$, toast, escapeHtml } from '../admin.js';
import { collection, doc, addDoc, updateDoc, getDocs, query, orderBy, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL }
  from "https://www.gstatic.com/firebasejs/12.12.1/firebase-storage.js";
import { getFunctions, httpsCallable }
  from "https://www.gstatic.com/firebasejs/12.12.1/firebase-functions.js";
import { FREQUENCIES, monthlyEstimate, fmtAUD } from '../../business/tiers.js';

// Active B2B contracts. Each account id == its proposal id.
// Visits live in b2bAccounts/{id}/visits. Marking a visit DONE triggers (Cloud Function):
//   photo-report email · trial → active · next visit auto-scheduled.
// Payment per visit: card off-session / Stripe invoice (chargeB2BVisit) or record terminal payment.

const ACC_STYLE = { PENDING_SETUP: 's-preparing', TRIAL: 's-out_for_delivery', ACTIVE: 's-delivered', PAUSED: 's-new', CANCELLED: 's-cancelled' };
const PAY_STYLE = { PAID: 'p-paid', INVOICED: 'p-manual', PROCESSING: 'p-pending', UNPAID: 'p-pending', FAILED: 'p-pending' };
const PAY_LABEL = { CARD: '💳 Card on file', INVOICE: '🧾 Invoice', TERMINAL: '📟 Terminal' };

let accounts = [];
let visits = {};      // accountId → [visit]
let filter = 'LIVE';
let doneCtx = null;   // { acc, visit }

const chargeFn = () => httpsCallable(getFunctions(db.app), 'chargeB2BVisit');
const todayISO = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export async function render() {
  $('#view-container').innerHTML = `
    <div class="kpi-grid">
      <div class="kpi"><div class="label">Live accounts</div><div class="value" id="k-live">—</div><div class="sub" id="k-live-sub">—</div></div>
      <div class="kpi"><div class="label">Monthly recurring</div><div class="value" id="k-mrr">—</div><div class="sub">AUD, active + trial</div></div>
      <div class="kpi"><div class="label">Trial → kept</div><div class="value" id="k-conv">—</div><div class="sub">after first visit</div></div>
      <div class="kpi"><div class="label">Visits next 7 days</div><div class="value" id="k-week">—</div><div class="sub" id="k-unpaid">—</div></div>
    </div>
    <h2 class="section-title">Upcoming route</h2>
    <div id="route" class="loading">Loading…</div>
    <h2 class="section-title" style="margin-top:28px">Accounts</h2>
    <div class="status-filters" id="acc-filters"></div>
    <div id="acc-list"></div>

    <div class="modal-overlay" id="done-modal" hidden>
      <div class="modal modal-wide">
        <h2 id="done-title">Complete visit</h2>
        <div class="field-row">
          <div class="field"><label>Visit date</label><input id="d-date" type="date"/></div>
          <div class="field"><label>Amount (AUD)</label><input id="d-amount" type="number" step="0.01" min="0"/></div>
        </div>
        <div class="field"><label>Note for the client's photo report</label><input id="d-notes" placeholder="Soft peonies and eucalyptus this week"/></div>
        <div class="field"><label>Photos (up to 3 — emailed to the client)</label><input id="d-photos" type="file" accept="image/*" multiple/></div>
        <div class="field"><label>Payment</label>
          <select id="d-pay">
            <option value="CARD">Charge saved card now</option>
            <option value="INVOICE">Send Stripe tax invoice (14 days)</option>
            <option value="TERMINAL">Paid on our card terminal ✓</option>
            <option value="LINK">Send payment link (SumUp / Zeller…)</option>
            <option value="LATER">Leave unpaid for now</option>
          </select>
        </div>
        <div class="field" id="d-link-wrap" hidden><label>Payment link URL</label><input id="d-link" type="url" placeholder="https://…"/></div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" id="d-cancel">Cancel</button>
          <button type="button" class="btn-primary" id="d-save">Complete visit</button>
        </div>
      </div>
    </div>`;

  $('#d-cancel').addEventListener('click', () => $('#done-modal').hidden = true);
  $('#d-save').addEventListener('click', completeVisit);
  $('#d-pay').addEventListener('change', () => $('#d-link-wrap').hidden = $('#d-pay').value !== 'LINK');
  await load();
}

async function load() {
  try {
    const snap = await getDocs(query(collection(db, 'b2bAccounts'), orderBy('createdAt', 'desc')));
    accounts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const lists = await Promise.all(accounts.map(a =>
      getDocs(query(collection(db, 'b2bAccounts', a.id, 'visits'), orderBy('visitNumber', 'asc')))
        .then(s => s.docs.map(d => ({ id: d.id, ...d.data() })))
        .catch(() => [])));
    visits = Object.fromEntries(accounts.map((a, i) => [a.id, lists[i]]));
    drawKpis(); drawRoute(); drawAccounts();
  } catch (err) {
    console.error(err);
    $('#route').className = '';
    $('#route').innerHTML = `<div class="placeholder"><h2>Load failed</h2><p>${escapeHtml(err.message)}</p></div>`;
  }
}

function drawKpis() {
  const live = accounts.filter(a => ['PENDING_SETUP', 'TRIAL', 'ACTIVE'].includes(a.status));
  const mrr = live.filter(a => a.status !== 'PENDING_SETUP').reduce((s, a) => s + (monthlyEstimate(a.pricePerVisit, a.frequency) || 0), 0);
  const tried = accounts.filter(a => (a.visitsCompleted || 0) >= 1);
  const kept = tried.filter(a => ['ACTIVE', 'TRIAL'].includes(a.status) && ((a.visitsCompleted || 0) >= 2 || a.status === 'ACTIVE'));
  const in7 = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  const all = Object.values(visits).flat();
  const week = all.filter(v => v.status === 'SCHEDULED' && v.date && v.date <= in7);
  const unpaid = all.filter(v => v.status === 'DONE' && ['UNPAID', 'FAILED'].includes(v.paymentStatus));
  $('#k-live').textContent = live.length;
  $('#k-live-sub').textContent = `${live.filter(a => a.status === 'PENDING_SETUP').length} awaiting setup`;
  $('#k-mrr').textContent = fmtAUD(mrr);
  $('#k-conv').textContent = tried.length ? Math.round(kept.length / tried.length * 100) + '%' : '—';
  $('#k-week').textContent = week.length;
  $('#k-unpaid').textContent = unpaid.length ? `⚠️ ${unpaid.length} unpaid visit${unpaid.length > 1 ? 's' : ''}` : 'all visits paid';
}

function drawRoute() {
  const el = $('#route');
  el.className = '';
  const upcoming = [];
  accounts.forEach(a => (visits[a.id] || []).forEach(v => { if (v.status === 'SCHEDULED') upcoming.push({ a, v }); }));
  upcoming.sort((x, y) => (x.v.date || '9999').localeCompare(y.v.date || '9999'));
  if (!upcoming.length) { el.innerHTML = '<div class="helper-text">No visits scheduled.</div>'; return; }
  const byDate = {};
  upcoming.slice(0, 40).forEach(x => (byDate[x.v.date || 'Unscheduled'] ||= []).push(x));
  el.innerHTML = Object.entries(byDate).map(([date, xs]) => `
    <div class="section-card" style="margin-bottom:10px">
      <div style="font-weight:600; margin-bottom:8px">${date === todayISO() ? '📍 Today' : escapeHtml(date)} · ${xs.length} stop${xs.length > 1 ? 's' : ''}
        <a class="helper-text" style="margin-left:8px" target="_blank" href="https://www.google.com/maps/dir/${xs.map(x => encodeURIComponent(x.a.address || x.a.company)).join('/')}">Open route in Maps ↗</a></div>
      ${xs.map(({ a, v }) => `
        <div style="display:flex; justify-content:space-between; gap:10px; align-items:center; padding:6px 0; border-top:1px solid var(--border); flex-wrap:wrap">
          <div><b>${escapeHtml(a.company)}</b> <span class="helper-text">· ${escapeHtml(a.tierName)} · ${escapeHtml(a.address || '')}${v.visitNumber === 1 ? ' · <b>FIRST SETUP (50%)</b>' : ''}</span></div>
          <div style="display:flex; gap:6px"><span class="payment-pill">${fmtAUD(v.amount)}</span>
            <button class="btn-primary btn-done" data-acc="${a.id}" data-v="${v.id}">✓ Done</button></div>
        </div>`).join('')}
    </div>`).join('');
  bindVisitButtons(el);
}

function drawAccounts() {
  const groups = { LIVE: a => ['PENDING_SETUP', 'TRIAL', 'ACTIVE'].includes(a.status), PAUSED: a => a.status === 'PAUSED', CANCELLED: a => a.status === 'CANCELLED', ALL: () => true };
  $('#acc-filters').innerHTML = Object.keys(groups).map(k =>
    `<button class="filter-pill${filter === k ? ' on' : ''}" data-f="${k}">${k.charAt(0) + k.slice(1).toLowerCase()} <span class="count">${accounts.filter(groups[k]).length}</span></button>`).join('');
  $$('#acc-filters .filter-pill').forEach(b => b.addEventListener('click', () => { filter = b.dataset.f; drawAccounts(); }));

  const rows = accounts.filter(groups[filter]);
  const list = $('#acc-list');
  if (!rows.length) {
    list.innerHTML = `<div class="placeholder"><h2>No accounts here</h2><p>Accounts are created automatically when a client approves a proposal in <a href="#/b2bProposals">B2B Proposals</a>.</p></div>`;
    return;
  }
  list.innerHTML = '<div class="olist">' + rows.map(a => {
    const vs = visits[a.id] || [];
    const done = vs.filter(v => v.status === 'DONE');
    const paid = done.filter(v => v.paymentStatus === 'PAID').reduce((s, v) => s + (Number(v.amount) || 0), 0);
    return `
    <details class="orow" style="display:block">
      <summary style="cursor:pointer; list-style:none; display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap">
        <div class="o-main">
          <div class="o-cust">${escapeHtml(a.company)}
            <span class="status-badge ${ACC_STYLE[a.status] || ''}" style="margin-left:8px">${escapeHtml(a.status)}</span>
            <span class="payment-pill" style="margin-left:4px">${PAY_LABEL[a.paymentMethod] || escapeHtml(a.paymentMethod)}${a.paymentMethod === 'CARD' ? (a.cardOnFile ? ` ···${escapeHtml(a.cardLast4 || '')}` : ' — not saved') : ''}</span>
          </div>
          <div class="o-meta">${escapeHtml(a.tierName)} · ${escapeHtml(FREQUENCIES[a.frequency]?.label || a.frequency)} · ${fmtAUD(a.pricePerVisit)}/visit · ${escapeHtml(a.visitDay || 'day TBC')} · ${done.length} visits · ${fmtAUD(paid)} collected</div>
          <div class="o-meta">${escapeHtml([a.contactName, a.email, a.phone, a.address].filter(Boolean).join(' · '))}</div>
          ${a.lastCustomerRequest ? `<div class="o-meta">💬 Client: ${escapeHtml(a.lastCustomerRequest.action)}${a.lastCustomerRequest.note ? ' — ' + escapeHtml(a.lastCustomerRequest.note) : ''}</div>` : ''}
        </div>
      </summary>
      <div style="margin-top:12px; border-top:1px solid var(--border); padding-top:12px">
        <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:12px">
          <button class="btn-secondary btn-add-visit" data-acc="${a.id}">+ Schedule visit</button>
          ${a.status === 'PAUSED' || a.status === 'CANCELLED'
            ? `<button class="btn-secondary btn-acc-status" data-acc="${a.id}" data-s="${(a.visitsCompleted || 0) >= 1 ? 'ACTIVE' : 'PENDING_SETUP'}">▶ Reactivate</button>`
            : `<button class="btn-secondary btn-acc-status" data-acc="${a.id}" data-s="PAUSED">⏸ Pause</button>
               <button class="btn-danger btn-acc-status" data-acc="${a.id}" data-s="CANCELLED">Cancel</button>`}
          <select class="acc-pay" data-acc="${a.id}" style="padding:6px 8px; border:1px solid var(--border); border-radius:6px">
            ${Object.entries(PAY_LABEL).map(([k, l]) => `<option value="${k}"${a.paymentMethod === k ? ' selected' : ''}>${l}</option>`).join('')}
          </select>
          <button class="btn-secondary btn-acc-price" data-acc="${a.id}">Edit price / day</button>
          <a class="btn-secondary" style="text-decoration:none" target="_blank" href="${location.origin}${location.pathname.replace(/admin\/.*$/, '')}business/proposal.html?id=${a.id}">Client page ↗</a>
        </div>
        ${a.notes ? `<div class="helper-text" style="margin-bottom:10px">📝 ${escapeHtml(a.notes)}</div>` : ''}
        ${vs.length ? vs.slice().reverse().map(v => visitRow(a, v)).join('') : '<div class="helper-text">No visits yet.</div>'}
      </div>
    </details>`;
  }).join('') + '</div>';

  bindVisitButtons(list);
  $$('.btn-add-visit', list).forEach(b => b.addEventListener('click', () => addVisit(b.dataset.acc)));
  $$('.btn-acc-status', list).forEach(b => b.addEventListener('click', () => setAccountStatus(b.dataset.acc, b.dataset.s)));
  $$('.acc-pay', list).forEach(s => s.addEventListener('change', async () => {
    await updateDoc(doc(db, 'b2bAccounts', s.dataset.acc), { paymentMethod: s.value, updatedAt: serverTimestamp() });
    accounts.find(a => a.id === s.dataset.acc).paymentMethod = s.value;
    toast('Payment method updated'); drawAccounts();
  }));
  $$('.btn-acc-price', list).forEach(b => b.addEventListener('click', () => editPrice(b.dataset.acc)));
}

function visitRow(a, v) {
  const unpaidDone = v.status === 'DONE' && !['PAID', 'INVOICED', 'PROCESSING'].includes(v.paymentStatus);
  return `
  <div style="display:flex; justify-content:space-between; gap:10px; align-items:center; padding:8px 0; border-top:1px dashed var(--border); flex-wrap:wrap">
    <div>
      <b>#${v.visitNumber || '–'}</b> · ${escapeHtml(v.date || 'no date')} · ${fmtAUD(v.amount)}${v.discountPct ? ` <span class="helper-text">(${v.discountPct}% off)</span>` : ''}
      <span class="status-badge ${v.status === 'DONE' ? 's-delivered' : v.status === 'SKIPPED' ? 's-cancelled' : 's-preparing'}" style="margin-left:6px">${escapeHtml(v.status)}</span>
      ${v.status !== 'SKIPPED' ? `<span class="payment-pill ${PAY_STYLE[v.paymentStatus] || ''}" style="margin-left:4px">${escapeHtml(v.paymentStatus || 'UNPAID')}${v.paymentMethod && v.paymentStatus === 'PAID' ? ' · ' + escapeHtml(v.paymentMethod) : ''}</span>` : ''}
      ${v.invoiceUrl ? ` <a class="helper-text" href="${escapeHtml(v.invoiceUrl)}" target="_blank">invoice ↗</a>` : ''}
      ${v.paymentLink ? ` <a class="helper-text" href="${escapeHtml(v.paymentLink)}" target="_blank">pay link ↗</a>` : ''}
      ${v.paymentFailureReason && v.paymentStatus === 'FAILED' ? `<div class="helper-text">⚠️ ${escapeHtml(v.paymentFailureReason)}</div>` : ''}
    </div>
    <div style="display:flex; gap:6px; flex-wrap:wrap">
      ${v.status === 'SCHEDULED' ? `<button class="btn-primary btn-done" data-acc="${a.id}" data-v="${v.id}">✓ Done</button>
        <button class="btn-secondary btn-skip" data-acc="${a.id}" data-v="${v.id}">Skip</button>` : ''}
      ${unpaidDone ? `
        ${a.cardOnFile ? `<button class="btn-secondary btn-charge" data-acc="${a.id}" data-v="${v.id}" data-mode="CARD">💳 Charge</button>` : ''}
        <button class="btn-secondary btn-charge" data-acc="${a.id}" data-v="${v.id}" data-mode="INVOICE">🧾 Invoice</button>
        <button class="btn-secondary btn-paid" data-acc="${a.id}" data-v="${v.id}" data-m="TERMINAL">📟 Paid on terminal</button>
        <button class="btn-secondary btn-paid" data-acc="${a.id}" data-v="${v.id}" data-m="OTHER">Paid (other)</button>` : ''}
    </div>
  </div>`;
}

function bindVisitButtons(root) {
  const find = b => {
    const acc = accounts.find(a => a.id === b.dataset.acc);
    return { acc, visit: (visits[acc.id] || []).find(v => v.id === b.dataset.v) };
  };
  $$('.btn-done', root).forEach(b => b.addEventListener('click', e => { e.preventDefault(); openDone(find(b)); }));
  $$('.btn-skip', root).forEach(b => b.addEventListener('click', async e => {
    e.preventDefault();
    const { acc, visit } = find(b);
    if (!confirm('Skip this visit? (not charged)')) return;
    await updateDoc(doc(db, 'b2bAccounts', acc.id, 'visits', visit.id), { status: 'SKIPPED', skippedReason: 'admin' });
    toast('Visit skipped'); await load();
  }));
  $$('.btn-charge', root).forEach(b => b.addEventListener('click', async e => {
    e.preventDefault();
    const { acc, visit } = find(b);
    await charge(acc, visit, b.dataset.mode);
    await load();
  }));
  $$('.btn-paid', root).forEach(b => b.addEventListener('click', async e => {
    e.preventDefault();
    const { acc, visit } = find(b);
    await markPaid(acc, visit, b.dataset.m);
    await load();
  }));
}

function openDone(ctx) {
  doneCtx = ctx;
  const { acc, visit } = ctx;
  $('#done-title').textContent = `Complete visit #${visit.visitNumber || ''} — ${acc.company}`;
  $('#d-date').value = visit.date && visit.date <= todayISO() ? visit.date : todayISO();
  $('#d-amount').value = visit.amount ?? acc.pricePerVisit;
  $('#d-notes').value = '';
  $('#d-photos').value = '';
  $('#d-link').value = '';
  const def = acc.paymentMethod === 'CARD' && acc.cardOnFile ? 'CARD' : acc.paymentMethod === 'INVOICE' ? 'INVOICE' : 'TERMINAL';
  $('#d-pay').value = def;
  $('#d-pay').querySelector('option[value=CARD]').disabled = !acc.cardOnFile;
  $('#d-link-wrap').hidden = true;
  $('#done-modal').hidden = false;
}

async function completeVisit() {
  const { acc, visit } = doneCtx;
  const btn = $('#d-save');
  btn.disabled = true; btn.textContent = 'Saving…';
  try {
    const files = Array.from($('#d-photos').files || []).slice(0, 3);
    const photos = [];
    for (const f of files) {
      const r = ref(storage, `b2b/visits/${acc.id}/${Date.now()}_${f.name.replace(/[^\w.-]/g, '_')}`);
      await uploadBytes(r, f);
      photos.push(await getDownloadURL(r));
    }
    const pay = $('#d-pay').value;
    const vRef = doc(db, 'b2bAccounts', acc.id, 'visits', visit.id);
    const amount = Number($('#d-amount').value);
    const update = {
      status: 'DONE',
      date: $('#d-date').value || todayISO(),
      amount: isNaN(amount) ? visit.amount : amount,
      notes: $('#d-notes').value.trim(),
      photos,
      completedAt: serverTimestamp(),
    };
    if (pay === 'TERMINAL') Object.assign(update, { paymentStatus: 'PAID', paymentMethod: 'TERMINAL', paidAt: serverTimestamp() });
    if (pay === 'LINK') {
      const link = $('#d-link').value.trim();
      if (!/^https:\/\//.test(link)) { toast('Paste a valid https payment link', true); return; }
      Object.assign(update, { paymentLink: link, paymentMethod: 'LINK' });
    }
    await updateDoc(vRef, update);   // → Cloud Function: photo email, next visit, trial/active
    $('#done-modal').hidden = true;
    toast('Visit completed ✓ — photo report is being emailed');
    if (pay === 'CARD' || pay === 'INVOICE') await charge(acc, { ...visit, ...update }, pay);
    if (pay === 'LINK') await emailPayLink(acc, { ...visit, ...update });
    await load();
  } catch (err) {
    console.error(err);
    toast('Failed: ' + err.message, true);
  } finally {
    btn.disabled = false; btn.textContent = 'Complete visit';
  }
}

async function charge(acc, visit, mode) {
  try {
    toast(mode === 'CARD' ? 'Charging card…' : 'Creating invoice…');
    const { data } = await chargeFn()({ accountId: acc.id, visitId: visit.id, mode });
    if (data.status === 'succeeded') toast(`💳 Charged ${fmtAUD(visit.amount)} ✓`);
    else if (data.status === 'invoiced') toast('🧾 Invoice emailed to client ✓');
    else toast(`Status: ${data.status}`);
  } catch (err) {
    console.error(err);
    toast(err.message || 'Charge failed', true);
  }
}

async function markPaid(acc, visit, method) {
  const ref_ = method === 'OTHER' ? prompt('How was it paid? (e.g. bank transfer, cash)', 'Bank transfer') : 'TERMINAL';
  if (ref_ === null) return;
  await updateDoc(doc(db, 'b2bAccounts', acc.id, 'visits', visit.id), {
    paymentStatus: 'PAID', paymentMethod: method === 'OTHER' ? 'OTHER' : 'TERMINAL',
    paymentNote: method === 'OTHER' ? String(ref_).slice(0, 120) : '', paidAt: serverTimestamp(),
  });
  toast('Recorded as paid ✓');
}

async function emailPayLink(acc, visit) {
  const subject = `Payment for this week's flowers — ${acc.company}`;
  const body = `Hi ${(acc.contactName || '').split(' ')[0] || 'there'},\n\nThanks again! Here's the payment link for visit #${visit.visitNumber} (${visit.date}): ${fmtAUD(visit.amount)} incl. GST.\n\n${visit.paymentLink}\n\nJi-sun · Bloom & Vine`;
  window.open(`mailto:${encodeURIComponent(acc.billingEmail || acc.email || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
}

async function addVisit(accId) {
  const acc = accounts.find(a => a.id === accId);
  const date = prompt('Visit date (YYYY-MM-DD)', todayISO());
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
  const vs = visits[accId] || [];
  const isFirst = !vs.some(v => v.status === 'DONE') && !vs.some(v => v.status === 'SCHEDULED' && v.visitNumber === 1);
  const pct = isFirst ? (acc.trialDiscountPct ?? 50) : 0;
  await addDoc(collection(db, 'b2bAccounts', accId, 'visits'), {
    visitNumber: Math.max(0, ...vs.map(v => v.visitNumber || 0)) + 1,
    date, regularPrice: acc.pricePerVisit, discountPct: pct,
    amount: Math.round(acc.pricePerVisit * (100 - pct)) / 100,
    status: 'SCHEDULED', paymentStatus: 'UNPAID', paymentMethod: acc.paymentMethod,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'b2bAccounts', accId), { nextVisitDate: date, updatedAt: serverTimestamp() });
  toast('Visit scheduled'); await load();
}

async function setAccountStatus(accId, status) {
  const label = { PAUSED: 'pause', CANCELLED: 'cancel', ACTIVE: 'reactivate', PENDING_SETUP: 'reactivate' }[status];
  if (!confirm(`Really ${label} this account?`)) return;
  await updateDoc(doc(db, 'b2bAccounts', accId), { status, updatedAt: serverTimestamp() });
  await updateDoc(doc(db, 'b2bProposals', accId), { accountStatus: status }).catch(() => {});
  if (status === 'PAUSED' || status === 'CANCELLED') {
    await Promise.all((visits[accId] || []).filter(v => v.status === 'SCHEDULED').map(v =>
      updateDoc(doc(db, 'b2bAccounts', accId, 'visits', v.id), { status: 'SKIPPED', skippedReason: status })));
  }
  toast(`Account ${label}d${status === 'ACTIVE' || status === 'PENDING_SETUP' ? ' — schedule the next visit' : ''}`);
  await load();
}

async function editPrice(accId) {
  const acc = accounts.find(a => a.id === accId);
  const price = prompt('Price per visit (AUD incl. GST) — applies to newly scheduled visits', acc.pricePerVisit);
  if (price === null) return;
  const day = prompt('Visit day / time', acc.visitDay || '');
  if (day === null) return;
  const n = Number(price);
  if (!(n > 0)) return toast('Invalid price', true);
  await updateDoc(doc(db, 'b2bAccounts', accId), { pricePerVisit: n, visitDay: day.trim(), updatedAt: serverTimestamp() });
  toast('Updated'); await load();
}
