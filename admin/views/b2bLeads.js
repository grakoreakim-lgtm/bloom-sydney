import { db, $, $$, toast, escapeHtml } from '../admin.js';
import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, query, orderBy, serverTimestamp, writeBatch }
  from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

// B2B CRM: website enquiries (status NEW) + outreach targets imported from CSV.
// Pipeline: NEW/TARGET → EMAILED → REPLIED → PROPOSAL → WON / LOST

const STATUSES = ['NEW', 'TARGET', 'EMAILED', 'REPLIED', 'PROPOSAL', 'WON', 'LOST'];
const STATUS_STYLE = {
  NEW: 's-new', TARGET: 's-cancelled', EMAILED: 's-out_for_delivery', REPLIED: 's-preparing',
  PROPOSAL: 's-preparing', WON: 's-delivered', LOST: 's-cancelled',
};
const FIELDS = ['company', 'industry', 'contactName', 'role', 'email', 'phone', 'address', 'abn', 'tier', 'frequency', 'notes'];

let leads = [];
let filter = 'ALL';
let editingId = null;

export async function render() {
  $('#view-container').innerHTML = `
    <div class="action-bar">
      <span class="helper-text">Website enquiries land here as <b>NEW</b>. Import outreach targets from CSV, track them through the pipeline, then create a proposal.</span>
      <div style="display:flex; gap:8px; flex-wrap:wrap">
        <label class="btn-secondary" style="cursor:pointer">⬆ Import CSV<input type="file" id="csv-input" accept=".csv,text/csv" hidden/></label>
        <button class="btn-primary" id="btn-add-lead">+ New lead</button>
      </div>
    </div>
    <div class="status-filters" id="lead-filters"></div>
    <div id="lead-list" class="loading">Loading…</div>

    <div class="modal-overlay" id="lead-modal" hidden>
      <div class="modal modal-wide">
        <h2 id="lead-form-title">New lead</h2>
        <form id="lead-form">
          <div class="field-row">
            <div class="field"><label>Business *</label><input name="company" required/></div>
            <div class="field"><label>Industry</label><input name="industry" list="industry-list" placeholder="Clinic / dental / medical"/></div>
          </div>
          <div class="field-row">
            <div class="field"><label>Contact name</label><input name="contactName"/></div>
            <div class="field"><label>Role</label><input name="role" placeholder="Practice manager"/></div>
          </div>
          <div class="field-row">
            <div class="field"><label>Email</label><input name="email" type="email"/></div>
            <div class="field"><label>Phone</label><input name="phone"/></div>
          </div>
          <div class="field"><label>Address</label><input name="address"/></div>
          <div class="field-row">
            <div class="field"><label>ABN</label><input name="abn"/></div>
            <div class="field"><label>Status</label><select name="status">${STATUSES.map(s => `<option>${s}</option>`).join('')}</select></div>
          </div>
          <div class="field-row">
            <div class="field"><label>Interested plan</label><select name="tier"><option value="">—</option><option value="essential">Essential</option><option value="signature">Signature</option><option value="grand">Grand</option><option value="custom">Custom</option></select></div>
            <div class="field"><label>Frequency</label><select name="frequency"><option value="weekly">Weekly</option><option value="fortnightly">Fortnightly</option></select></div>
          </div>
          <div class="field"><label>Notes</label><textarea name="notes" rows="3" style="width:100%; padding:10px 12px; border:1px solid var(--border); border-radius:6px; font-family:inherit"></textarea></div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" id="btn-lead-cancel">Cancel</button>
            <button type="submit" class="btn-primary">Save</button>
          </div>
        </form>
        <datalist id="industry-list">
          <option>Clinic / dental / medical</option><option>Hospital / aged care</option><option>Hotel / accommodation</option>
          <option>Office / professional services</option><option>Restaurant / retail / showroom</option>
        </datalist>
      </div>
    </div>`;

  $('#btn-add-lead').addEventListener('click', () => openForm(null));
  $('#btn-lead-cancel').addEventListener('click', () => $('#lead-modal').hidden = true);
  $('#lead-form').addEventListener('submit', onSubmit);
  $('#csv-input').addEventListener('change', onCsv);
  await load();
}

async function load() {
  try {
    const snap = await getDocs(query(collection(db, 'b2bLeads'), orderBy('createdAt', 'desc')));
    leads = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    draw();
  } catch (err) {
    console.error(err);
    $('#lead-list').className = '';
    $('#lead-list').innerHTML = `<div class="placeholder"><h2>Load failed</h2><p>${escapeHtml(err.message)}</p></div>`;
  }
}

function draw() {
  const counts = Object.fromEntries(STATUSES.map(s => [s, leads.filter(l => (l.status || 'NEW') === s).length]));
  $('#lead-filters').innerHTML = ['ALL', ...STATUSES].map(s =>
    `<button class="filter-pill${filter === s ? ' on' : ''}" data-f="${s}">${s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()} <span class="count">${s === 'ALL' ? leads.length : counts[s]}</span></button>`).join('');
  $$('#lead-filters .filter-pill').forEach(b => b.addEventListener('click', () => { filter = b.dataset.f; draw(); }));

  const list = $('#lead-list');
  list.className = '';
  const rows = leads.filter(l => filter === 'ALL' || (l.status || 'NEW') === filter);
  if (!rows.length) {
    list.innerHTML = `<div class="placeholder"><h2>No leads${filter === 'ALL' ? ' yet' : ' in this stage'}</h2>
      <p>Import a CSV with columns: <code>company, industry, contactName, role, email, phone, address</code><br/>or wait for enquiries from <a href="../business/" target="_blank">/business/</a>.</p></div>`;
    return;
  }
  list.innerHTML = '<div class="olist">' + rows.map(l => `
    <div class="orow">
      <div class="o-main">
        <div class="o-cust">${escapeHtml(l.company)}
          <span class="status-badge ${STATUS_STYLE[l.status || 'NEW']}" style="margin-left:8px">${escapeHtml(l.status || 'NEW')}</span>
          ${l.source === 'website' ? '<span class="payment-pill p-manual" style="margin-left:4px">WEB</span>' : ''}
        </div>
        <div class="o-meta">${escapeHtml([l.industry, l.contactName && `${l.contactName}${l.role ? ' (' + l.role + ')' : ''}`, l.email, l.phone].filter(Boolean).join(' · '))}</div>
        <div class="o-meta">${escapeHtml([l.address, l.tier && `wants ${l.tier}`, l.frequency].filter(Boolean).join(' · '))}</div>
        ${l.notes ? `<div class="o-meta" style="margin-top:4px">📝 ${escapeHtml(l.notes.slice(0, 160))}</div>` : ''}
      </div>
      <div style="display:flex; gap:6px; flex-wrap:wrap; justify-content:flex-end">
        <select class="lead-status" data-id="${l.id}" style="padding:6px 8px; border:1px solid var(--border); border-radius:6px">
          ${STATUSES.map(s => `<option${(l.status || 'NEW') === s ? ' selected' : ''}>${s}</option>`).join('')}
        </select>
        <button class="btn-secondary btn-email" data-id="${l.id}" title="Copy outreach email">✉️ Email</button>
        <a class="btn-primary" href="#/b2bProposals?lead=${l.id}" style="text-decoration:none">Proposal →</a>
        <button class="btn-secondary btn-edit" data-id="${l.id}">Edit</button>
        <button class="btn-danger btn-del" data-id="${l.id}">✕</button>
      </div>
    </div>`).join('') + '</div>';

  $$('.lead-status').forEach(s => s.addEventListener('change', async () => {
    try {
      await updateDoc(doc(db, 'b2bLeads', s.dataset.id), { status: s.value, updatedAt: serverTimestamp() });
      leads.find(l => l.id === s.dataset.id).status = s.value;
      toast(`Moved to ${s.value}`); draw();
    } catch (err) { toast('Update failed: ' + err.message, true); }
  }));
  $$('.btn-edit').forEach(b => b.addEventListener('click', () => openForm(leads.find(l => l.id === b.dataset.id))));
  $$('.btn-del').forEach(b => b.addEventListener('click', async () => {
    if (!confirm('Delete this lead?')) return;
    await deleteDoc(doc(db, 'b2bLeads', b.dataset.id));
    leads = leads.filter(l => l.id !== b.dataset.id); draw();
  }));
  $$('.btn-email').forEach(b => b.addEventListener('click', () => copyOutreach(leads.find(l => l.id === b.dataset.id))));
}

function openForm(l) {
  editingId = l?.id || null;
  const f = $('#lead-form');
  f.reset();
  $('#lead-form-title').textContent = l ? 'Edit lead' : 'New lead';
  FIELDS.forEach(k => { if (f[k]) f[k].value = l?.[k] || (k === 'frequency' ? 'weekly' : ''); });
  f.status.value = l?.status || 'TARGET';
  $('#lead-modal').hidden = false;
}

async function onSubmit(e) {
  e.preventDefault();
  const f = e.target;
  const data = Object.fromEntries(FIELDS.map(k => [k, (f[k]?.value || '').trim()]));
  data.status = f.status.value;
  data.updatedAt = serverTimestamp();
  try {
    if (editingId) await updateDoc(doc(db, 'b2bLeads', editingId), data);
    else await addDoc(collection(db, 'b2bLeads'), { ...data, source: 'outreach', createdAt: serverTimestamp() });
    $('#lead-modal').hidden = true;
    toast('Saved'); await load();
  } catch (err) { toast('Save failed: ' + err.message, true); }
}

/* ─── CSV import (header row required; flexible column names) ─── */
function parseCsv(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(x => x.trim()));
}

const ALIASES = {
  company: ['company', 'business', 'name', 'business name'], industry: ['industry', 'type', 'category'],
  contactName: ['contactname', 'contact', 'contact name', 'person'], role: ['role', 'title', 'position'],
  email: ['email', 'e-mail'], phone: ['phone', 'mobile', 'tel'], address: ['address', 'location', 'suburb'],
  abn: ['abn'], notes: ['notes', 'note', 'comments'],
};

async function onCsv(e) {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  const rows = parseCsv(await file.text());
  if (rows.length < 2) return toast('CSV needs a header row and at least one data row', true);
  const header = rows[0].map(h => h.trim().toLowerCase());
  const idx = Object.fromEntries(Object.entries(ALIASES).map(([k, names]) => [k, header.findIndex(h => names.includes(h))]));
  if (idx.company < 0) return toast('CSV must have a "company" (or "business") column', true);

  const existing = new Set(leads.map(l => (l.company || '').toLowerCase().trim()));
  const fresh = rows.slice(1)
    .map(r => Object.fromEntries(Object.entries(idx).filter(([, i]) => i >= 0).map(([k, i]) => [k, (r[i] || '').trim()])))
    .filter(l => l.company && !existing.has(l.company.toLowerCase()));
  if (!fresh.length) return toast('Nothing new to import (duplicates skipped)');
  if (!confirm(`Import ${fresh.length} new leads as TARGET?`)) return;

  for (let i = 0; i < fresh.length; i += 400) {
    const batch = writeBatch(db);
    fresh.slice(i, i + 400).forEach(l => batch.set(doc(collection(db, 'b2bLeads')), {
      ...l, status: 'TARGET', source: 'outreach', frequency: 'weekly', createdAt: serverTimestamp(),
    }));
    await batch.commit();
  }
  toast(`Imported ${fresh.length} leads`);
  await load();
}

/* ─── Outreach email templates (see docs/B2B_PLAN.md §9) ─── */
function outreachFor(l) {
  const first = (l.contactName || '').split(' ')[0] || 'there';
  const ind = (l.industry || '').toLowerCase();
  const site = `${location.origin}${location.pathname.replace(/admin\/.*$/, '')}business/`;
  const optOut = '\n\nNot the right person? Reply "no thanks" and I won’t contact you again.';
  if (/hotel|accommodation|motel|b&b|apartment/.test(ind)) {
    return { subject: `A lobby that guests photograph — weekly flowers for ${l.company}`,
      body: `Hi ${first},\n\nFirst impressions show up in reviews. We design and maintain lobby flowers for boutique hotels — sourced each morning at Flemington and set up before check-in. We swap, water and remove everything; your team does nothing.\n\nTry one week at 50% off with no contract. We can also pair VIP-room flowers with Hunter Valley wine.\n\nPlans: ${site}\n\nJi-sun · Bloom & Vine${optOut}` };
  }
  if (/clinic|dental|medical|hospital|aged|health|physio|derm/.test(ind)) {
    return { subject: `Fresh, low-pollen flowers for ${l.company}'s reception — first week 50% off`,
      body: `Hi ${first},\n\nI'm Ji-sun, a florist based in Carlingford. Every week I personally refresh reception flowers for local clinics — low-pollen, scent-free stems that are safe for patients, set up before you open.\n\nNo contract. Your first visit is 50% off, and you only pay after you've seen it on your desk.\n\nCould I drop off a small complimentary arrangement next week so you can see the quality?\n\nPlans: ${site}\n\nJi-sun · Bloom & Vine${optOut}` };
  }
  return { subject: `Reception flowers, handled — ${l.company}`,
    body: `Hi ${first},\n\nFresh flowers at reception are one of the simplest ways to look premium to clients — but nobody has time to buy and maintain them. We do it weekly or fortnightly from $89 a visit, fully managed.\n\nFirst visit 50% off, cancel any time with one click. Can I send you a quick proposal with a photo mock-up for your space?\n\nPlans: ${site}\n\nJi-sun · Bloom & Vine${optOut}` };
}

async function copyOutreach(l) {
  const { subject, body } = outreachFor(l);
  try {
    await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    toast('Email copied — paste into Gmail');
  } catch { /* clipboard blocked */ }
  if (l.email) window.open(`mailto:${encodeURIComponent(l.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  if (['NEW', 'TARGET'].includes(l.status || 'NEW') && confirm('Mark this lead as EMAILED?')) {
    await updateDoc(doc(db, 'b2bLeads', l.id), { status: 'EMAILED', emailedAt: serverTimestamp(), updatedAt: serverTimestamp() });
    l.status = 'EMAILED'; draw();
  }
}
