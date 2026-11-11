import { db, storage, $, $$, toast, escapeHtml } from '../admin.js';
import { collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, orderBy, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL }
  from "https://www.gstatic.com/firebasejs/12.12.1/firebase-storage.js";
import { TIERS, tierById, priceFor, trialPrice, TRIAL_DISCOUNT_PCT, fmtAUD } from '../../business/tiers.js';

// Proposals: create from a lead → send link → client approves at /business/proposal.html?id={docId}
// The Firestore auto-id (20 random chars) is the secret token in the link.

const STATUS_STYLE = { DRAFT: 's-cancelled', SENT: 's-out_for_delivery', APPROVED: 's-delivered', DECLINED: 's-new' };
let proposals = [];
let editingId = null;
let coverFile = null;

const proposalUrl = id => `${location.origin}${location.pathname.replace(/admin\/.*$/, '')}business/proposal.html?id=${id}`;

export async function render() {
  $('#view-container').innerHTML = `
    <div class="action-bar">
      <span class="helper-text">Create a proposal, then <b>✉️ Send</b> — the client approves with one click and picks card / invoice / on-site payment. Approved proposals become accounts automatically.</span>
      <button class="btn-primary" id="btn-new-prop">+ New proposal</button>
    </div>
    <div id="prop-list" class="loading">Loading…</div>

    <div class="modal-overlay" id="prop-modal" hidden>
      <div class="modal modal-wide">
        <h2 id="prop-form-title">New proposal</h2>
        <form id="prop-form">
          <input type="hidden" name="leadId"/>
          <div class="field-row">
            <div class="field"><label>Business *</label><input name="company" required/></div>
            <div class="field"><label>Industry</label><input name="industry"/></div>
          </div>
          <div class="field-row">
            <div class="field"><label>Contact name</label><input name="contactName"/></div>
            <div class="field"><label>Email *</label><input name="email" type="email" required/></div>
          </div>
          <div class="field-row">
            <div class="field"><label>Phone</label><input name="phone"/></div>
            <div class="field"><label>ABN</label><input name="abn"/></div>
          </div>
          <div class="field"><label>Site address</label><input name="address"/></div>
          <div class="field-row">
            <div class="field"><label>Plan</label><select name="tier">${TIERS.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}<option value="custom">Custom</option></select></div>
            <div class="field"><label>Frequency</label><select name="frequency"><option value="weekly">Weekly</option><option value="fortnightly">Fortnightly</option></select></div>
          </div>
          <div class="field-row">
            <div class="field"><label>Price per visit (AUD, incl. GST) *</label><input name="pricePerVisit" type="number" min="1" step="1" required/></div>
            <div class="field"><label>First-visit discount %</label><input name="trialDiscountPct" type="number" min="0" max="100" step="5"/></div>
          </div>
          <div class="helper-text" id="prop-price-hint" style="margin:-4px 0 10px"></div>
          <div class="field-row">
            <div class="field"><label>Visit day / time</label><input name="visitDay" placeholder="Monday, 7–8 AM"/></div>
            <div class="field"><label>First setup date</label><input name="startDate" type="date"/></div>
          </div>
          <div class="field-row">
            <div class="field"><label>Price held until</label><input name="validUntil" type="date"/></div>
            <div class="field"><label>Concept photo</label><input type="file" id="prop-cover" accept="image/*"/></div>
          </div>
          <div class="field"><label>What's included (one per line — blank = plan defaults)</label><textarea name="items" rows="4" style="width:100%; padding:10px 12px; border:1px solid var(--border); border-radius:6px; font-family:inherit"></textarea></div>
          <div class="field"><label>Personal message to the client</label><textarea name="message" rows="4" style="width:100%; padding:10px 12px; border:1px solid var(--border); border-radius:6px; font-family:inherit" placeholder="Hi Sarah, thanks for showing me around…"></textarea></div>
          <div class="field"><label>Internal notes (not shown to client)</label><input name="internalNotes" placeholder="Allergies, access, brand colours…"/></div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" id="btn-prop-cancel">Cancel</button>
            <button type="submit" class="btn-primary" id="btn-prop-save">Save draft</button>
          </div>
        </form>
      </div>
    </div>`;

  const f = $('#prop-form');
  $('#btn-new-prop').addEventListener('click', () => openForm(null));
  $('#btn-prop-cancel').addEventListener('click', () => $('#prop-modal').hidden = true);
  f.addEventListener('submit', onSubmit);
  $('#prop-cover').addEventListener('change', e => { coverFile = e.target.files[0] || null; });
  const autoPrice = () => {
    const p = priceFor(f.tier.value, f.frequency.value);
    if (p) f.pricePerVisit.value = p;
    updateHint();
  };
  f.tier.addEventListener('change', autoPrice);
  f.frequency.addEventListener('change', autoPrice);
  f.pricePerVisit.addEventListener('input', updateHint);
  f.trialDiscountPct.addEventListener('input', updateHint);

  await load();

  // Arrived from a lead → prefill
  const leadId = new URLSearchParams(location.hash.split('?')[1] || '').get('lead');
  if (leadId) {
    const snap = await getDoc(doc(db, 'b2bLeads', leadId)).catch(() => null);
    if (snap?.exists()) openForm(null, { leadId, ...snap.data() });
    history.replaceState(null, '', '#/b2bProposals');
  }
}

function updateHint() {
  const f = $('#prop-form');
  const price = Number(f.pricePerVisit.value) || 0;
  const pct = Number(f.trialDiscountPct.value || TRIAL_DISCOUNT_PCT);
  $('#prop-price-hint').textContent = price ? `First visit ${fmtAUD(trialPrice(price, pct))} → then ${fmtAUD(price)} per visit` : '';
}

async function load() {
  try {
    const snap = await getDocs(query(collection(db, 'b2bProposals'), orderBy('createdAt', 'desc')));
    proposals = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    draw();
  } catch (err) {
    console.error(err);
    $('#prop-list').className = '';
    $('#prop-list').innerHTML = `<div class="placeholder"><h2>Load failed</h2><p>${escapeHtml(err.message)}</p></div>`;
  }
}

function draw() {
  const list = $('#prop-list');
  list.className = '';
  if (!proposals.length) {
    list.innerHTML = `<div class="placeholder"><h2>No proposals yet</h2><p>Open a lead in <a href="#/b2bLeads">B2B Leads</a> and click <b>Proposal →</b>, or create one here.<br/>Preview the client view: <a href="../business/proposal.html?demo=1" target="_blank">demo proposal</a>.</p></div>`;
    return;
  }
  list.innerHTML = '<div class="olist">' + proposals.map(p => {
    const st = p.status || 'DRAFT';
    const pay = p.approval?.paymentMethod;
    return `
    <div class="orow">
      <div class="o-main">
        <div class="o-cust">${escapeHtml(p.company)}
          <span class="status-badge ${STATUS_STYLE[st] || ''}" style="margin-left:8px">${st}</span>
          ${pay ? `<span class="payment-pill p-paid" style="margin-left:4px">${escapeHtml(pay)}</span>` : ''}
          ${p.accountStatus ? `<span class="payment-pill p-manual" style="margin-left:4px">${escapeHtml(p.accountStatus)}</span>` : ''}
        </div>
        <div class="o-meta">${escapeHtml(p.tierName || p.tier)} · ${escapeHtml(p.frequency)} · ${fmtAUD(p.pricePerVisit)}/visit · first ${fmtAUD(trialPrice(p.pricePerVisit || 0, p.trialDiscountPct ?? 50))}</div>
        <div class="o-meta">${escapeHtml([p.contactName, p.email, p.startDate && 'start ' + p.startDate].filter(Boolean).join(' · '))}</div>
        ${st === 'APPROVED' ? `<div class="o-meta">✅ Approved by ${escapeHtml(p.approval?.name || '')}${p.approval?.title ? ' (' + escapeHtml(p.approval.title) + ')' : ''}${p.approval?.poNumber ? ' · PO ' + escapeHtml(p.approval.poNumber) : ''}</div>` : ''}
        ${st === 'DECLINED' && p.approval?.declineReason ? `<div class="o-meta">💬 ${escapeHtml(p.approval.declineReason)}</div>` : ''}
      </div>
      <div style="display:flex; gap:6px; flex-wrap:wrap; justify-content:flex-end">
        <a class="btn-secondary" href="${proposalUrl(p.id)}" target="_blank" style="text-decoration:none">👁 View</a>
        <button class="btn-secondary btn-copy" data-id="${p.id}">🔗 Link</button>
        ${st === 'DRAFT' || st === 'SENT' ? `<button class="btn-primary btn-send" data-id="${p.id}">✉️ ${st === 'SENT' ? 'Resend' : 'Send'}</button>
          <button class="btn-secondary btn-edit" data-id="${p.id}">Edit</button>` : ''}
        ${st === 'APPROVED' ? `<a class="btn-primary" href="#/b2bAccounts" style="text-decoration:none">Account →</a>` : ''}
        ${st !== 'APPROVED' ? `<button class="btn-danger btn-del" data-id="${p.id}">✕</button>` : ''}
      </div>
    </div>`;
  }).join('') + '</div>';

  $$('.btn-copy').forEach(b => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(proposalUrl(b.dataset.id)); toast('Proposal link copied'); }
    catch { prompt('Copy this link:', proposalUrl(b.dataset.id)); }
  }));
  $$('.btn-send').forEach(b => b.addEventListener('click', () => sendProposal(proposals.find(p => p.id === b.dataset.id))));
  $$('.btn-edit').forEach(b => b.addEventListener('click', () => openForm(proposals.find(p => p.id === b.dataset.id))));
  $$('.btn-del').forEach(b => b.addEventListener('click', async () => {
    if (!confirm('Delete this proposal? The client link will stop working.')) return;
    await deleteDoc(doc(db, 'b2bProposals', b.dataset.id));
    toast('Deleted'); await load();
  }));
}

const FORM_KEYS = ['leadId', 'company', 'industry', 'contactName', 'email', 'phone', 'abn', 'address', 'tier', 'frequency',
  'pricePerVisit', 'trialDiscountPct', 'visitDay', 'startDate', 'validUntil', 'message', 'internalNotes'];

function openForm(p, prefill = null) {
  editingId = p?.id || null;
  coverFile = null;
  const f = $('#prop-form');
  f.reset();
  $('#prop-form-title').textContent = p ? `Edit proposal — ${p.company}` : 'New proposal';
  const src = p || prefill || {};
  FORM_KEYS.forEach(k => { if (f[k] && src[k] != null) f[k].value = src[k]; });
  if (!tierById(src.tier) && src.tier !== 'custom') f.tier.value = 'signature';
  if (!src.frequency) f.frequency.value = 'weekly';
  if (!p) f.pricePerVisit.value = priceFor(f.tier.value, f.frequency.value) || '';
  if (f.trialDiscountPct.value === '') f.trialDiscountPct.value = TRIAL_DISCOUNT_PCT;
  f.items.value = (p?.items || []).join('\n');
  if (!p && !f.validUntil.value) {
    const d = new Date(); d.setDate(d.getDate() + 21);
    f.validUntil.value = d.toISOString().slice(0, 10);
  }
  if (!p && prefill?.notes) f.internalNotes.value = prefill.notes;
  updateHint();
  $('#prop-modal').hidden = false;
}

async function onSubmit(e) {
  e.preventDefault();
  const f = e.target;
  const btn = $('#btn-prop-save');
  const data = Object.fromEntries(FORM_KEYS.map(k => [k, (f[k].value || '').trim()]));
  data.pricePerVisit = Number(data.pricePerVisit);
  data.trialDiscountPct = Number(data.trialDiscountPct || TRIAL_DISCOUNT_PCT);
  data.tierName = tierById(data.tier)?.name || 'Custom';
  data.items = f.items.value.split('\n').map(s => s.trim()).filter(Boolean);
  data.updatedAt = serverTimestamp();
  if (!data.leadId) data.leadId = null;
  if (!(data.pricePerVisit > 0)) return toast('Enter a price per visit', true);

  btn.disabled = true; btn.textContent = 'Saving…';
  try {
    if (coverFile) {
      const path = `b2b/proposals/${Date.now()}_${coverFile.name.replace(/[^\w.-]/g, '_')}`;
      const r = ref(storage, path);
      await uploadBytes(r, coverFile);
      data.coverImage = await getDownloadURL(r);
      data.coverImagePath = path;
    }
    if (editingId) {
      await updateDoc(doc(db, 'b2bProposals', editingId), data);
    } else {
      await addDoc(collection(db, 'b2bProposals'), { ...data, status: 'DRAFT', createdAt: serverTimestamp() });
      if (data.leadId) await updateDoc(doc(db, 'b2bLeads', data.leadId), { status: 'PROPOSAL', updatedAt: serverTimestamp() }).catch(() => {});
    }
    $('#prop-modal').hidden = true;
    toast('Proposal saved — click ✉️ Send when ready');
    await load();
  } catch (err) {
    toast('Save failed: ' + err.message, true);
  } finally {
    btn.disabled = false; btn.textContent = 'Save draft';
  }
}

async function sendProposal(p) {
  const url = proposalUrl(p.id);
  const first = (p.contactName || '').split(' ')[0] || 'there';
  const subject = `Your flower proposal — ${p.company} (first visit ${p.trialDiscountPct ?? 50}% off)`;
  const body =
`Hi ${first},

Thanks for your time. Here's your proposal for fresh, fully-maintained flowers at ${p.company}:

• Plan: ${p.tierName} — ${p.frequency}
• First visit: ${fmtAUD(trialPrice(p.pricePerVisit, p.trialDiscountPct ?? 50))} (${p.trialDiscountPct ?? 50}% off), charged only after the setup
• Then: ${fmtAUD(p.pricePerVisit)} per visit incl. GST — no contract, pause or cancel any time
${p.startDate ? `• First setup: ${p.startDate}${p.visitDay ? ` (${p.visitDay})` : ''}\n` : ''}
View and approve with one click (choose card, invoice or pay on site):
${url}

Once you approve, I'll call to confirm the setup time.

Ji-sun
Bloom & Vine`;

  try { await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`); } catch { /* ignore */ }
  if (p.email) window.open(`mailto:${encodeURIComponent(p.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  if (p.status !== 'SENT') {
    await updateDoc(doc(db, 'b2bProposals', p.id), { status: 'SENT', sentAt: serverTimestamp() });
    toast('Marked as SENT — the approval link is now live (email text also copied)');
    await load();
  } else {
    toast('Email text copied');
  }
}
