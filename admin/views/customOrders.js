import { db, $, $$, toast, escapeHtml } from '../admin.js';
import { collection, doc, updateDoc, deleteDoc, getDocs, query, orderBy, serverTimestamp, onSnapshot }
  from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

const STATUSES = [
  { key: 'new',       label: 'New' },
  { key: 'quoted',    label: 'Quoted' },
  { key: 'accepted',  label: 'Accepted' },
  { key: 'declined',  label: 'Declined' },
  { key: 'completed', label: 'Completed' },
];
const STATUS_LABEL = Object.fromEntries(STATUSES.map(s => [s.key, s.label]));

const OCC_LABEL = {
  wedding: '💒 Wedding',
  anniversary: '💍 Anniversary',
  corporate: '🏢 Corporate',
  other: '✦ Other',
};

let unsubscribe = null;
let allReqs = [];
let currentFilter = 'all';

export async function render() {
  const container = $('#view-container');
  container.innerHTML = `
    <div class="status-filters">
      <button class="filter-pill on" data-filter="all">All <span class="count" id="cnt-all">0</span></button>
      ${STATUSES.map(s => `
        <button class="filter-pill" data-filter="${s.key}">${s.label} <span class="count" id="cnt-${s.key}">0</span></button>
      `).join('')}
    </div>

    <div class="action-bar">
      <span class="helper-text">Wedding, corporate, and 30+ day pre-order requests submitted from the customer site.</span>
    </div>

    <div id="creq-list" class="loading">Loading…</div>

    <div class="modal-overlay" id="creq-modal" hidden>
      <div class="modal modal-wide">
        <div id="creq-detail"></div>
      </div>
    </div>
  `;

  $$('.filter-pill').forEach(btn =>
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter;
      $$('.filter-pill').forEach(b => b.classList.toggle('on', b === btn));
      renderList();
    })
  );

  if (unsubscribe) { try { unsubscribe(); } catch {} }
  unsubscribe = onSnapshot(
    query(collection(db, 'customOrders'), orderBy('createdAt', 'desc')),
    (snap) => {
      allReqs = [];
      snap.forEach(d => allReqs.push({ id: d.id, ...d.data() }));
      $('#creq-list').className = '';
      renderList();
    },
    (err) => {
      $('#creq-list').className = '';
      $('#creq-list').innerHTML = `<div class="placeholder"><h2>Load failed</h2><p>${escapeHtml(err.message)}</p></div>`;
      console.error(err);
    }
  );
}

function renderList() {
  const counts = { all: allReqs.length };
  STATUSES.forEach(s => counts[s.key] = 0);
  allReqs.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
  Object.entries(counts).forEach(([k, v]) => {
    const el = $('#cnt-' + k);
    if (el) el.textContent = v;
  });

  const filtered = currentFilter === 'all' ? allReqs : allReqs.filter(r => r.status === currentFilter);
  const list = $('#creq-list');
  if (!filtered.length) {
    list.innerHTML = `<div class="placeholder"><h2>No requests ${currentFilter === 'all' ? 'yet' : 'in this status'}</h2><p>${currentFilter === 'all' ? "Custom order requests appear here when customers submit them from the website." : 'Switch filters or wait for new requests.'}</p></div>`;
    return;
  }
  list.innerHTML = '<div class="olist">' + filtered.map(r => `
    <div class="orow" data-id="${r.id}">
      <div class="o-num">#${(r.id || '').slice(-5).toUpperCase()}</div>
      <div class="o-main">
        <div class="o-cust">
          ${escapeHtml(r.customerName || 'Unknown')}
          <span class="status-badge s-${r.status === 'new' ? 'new' : (r.status === 'quoted' ? 'preparing' : (r.status === 'accepted' ? 'out_for_delivery' : (r.status === 'completed' ? 'delivered' : 'cancelled')))}">${escapeHtml(STATUS_LABEL[r.status] || r.status)}</span>
        </div>
        <div class="o-meta">
          ${escapeHtml(OCC_LABEL[r.occasion] || r.occasion || '')} · ${escapeHtml(r.eventDate || 'no date')}
          ${r.suburb ? `<span class="dot">·</span> ${escapeHtml(r.suburb)}` : ''}
        </div>
      </div>
      <div class="o-right">
        <div class="o-total">${escapeHtml(r.budget || '')}</div>
        <div class="o-time">${formatDate(r.createdAt)}</div>
      </div>
    </div>
  `).join('') + '</div>';

  list.querySelectorAll('.orow').forEach(row => row.addEventListener('click', () => openDetail(row.dataset.id)));
}

function formatDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' }) + ' · ' +
         d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
}

function openDetail(id) {
  const r = allReqs.find(x => x.id === id);
  if (!r) return;
  $('#creq-detail').innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
      <div>
        <h2 style="margin:0">Request #${(r.id || '').slice(-5).toUpperCase()}</h2>
        <div class="muted" style="margin-top:4px; color:var(--subtle); font-size:13px">${formatDate(r.createdAt)}</div>
      </div>
      <span class="status-badge s-${r.status === 'new' ? 'new' : (r.status === 'quoted' ? 'preparing' : (r.status === 'accepted' ? 'out_for_delivery' : (r.status === 'completed' ? 'delivered' : 'cancelled')))}">${escapeHtml(STATUS_LABEL[r.status] || r.status)}</span>
    </div>

    <div class="detail-grid" style="margin-bottom:18px">
      <div class="detail-block">
        <h3>Customer</h3>
        <div class="row"><strong>${escapeHtml(r.customerName || '')}</strong></div>
        <div class="row muted">${escapeHtml(r.customerPhone || '')}</div>
        <div class="row muted">${escapeHtml(r.customerEmail || '')}</div>
      </div>
      <div class="detail-block">
        <h3>Occasion</h3>
        <div class="row">${escapeHtml(OCC_LABEL[r.occasion] || r.occasion || '')}</div>
        <div class="row" style="margin-top:6px"><strong>${escapeHtml(r.eventDate || '—')}</strong></div>
        <div class="row muted">${escapeHtml(r.suburb || '')} ${escapeHtml(r.address || '')}</div>
      </div>
    </div>

    <div class="detail-block" style="margin-bottom:18px">
      <h3>Budget</h3>
      <div class="row" style="font-weight:600; font-size:16px">${escapeHtml(r.budget || '—')}</div>
    </div>

    ${r.details ? `
    <div class="detail-block" style="margin-bottom:18px">
      <h3>Details</h3>
      <div class="row" style="white-space:pre-wrap; background:var(--bg); padding:12px; border-radius:6px; font-style:italic">${escapeHtml(r.details)}</div>
    </div>` : ''}

    <div class="detail-block" style="margin-bottom:18px">
      <h3>Admin notes</h3>
      <textarea id="creq-notes" rows="3" style="width:100%; padding:10px 12px; border:1px solid var(--border); border-radius:6px; font-family:inherit">${escapeHtml(r.adminNotes || '')}</textarea>
      <div style="text-align:right; margin-top:6px">
        <button class="btn-secondary" id="btn-creq-save-notes">Save notes</button>
      </div>
    </div>

    <div class="status-actions">
      ${STATUSES.filter(s => s.key !== r.status).map(s =>
        `<button class="${s.key === 'declined' ? 'cancel' : 'advance'}" data-action="set-${s.key}">→ ${s.label}</button>`
      ).join('')}
      <button class="cancel" data-action="delete" style="margin-left:auto">Delete</button>
      <button class="btn-secondary" data-action="close">Close</button>
    </div>
  `;
  $('#creq-modal').hidden = false;

  $('#btn-creq-save-notes').addEventListener('click', async () => {
    const notes = $('#creq-notes').value;
    try {
      await updateDoc(doc(db, 'customOrders', r.id), { adminNotes: notes, updatedAt: serverTimestamp() });
      toast('Notes saved');
      r.adminNotes = notes;
    } catch (err) { toast('Save failed: ' + err.message, true); }
  });

  $$('#creq-detail [data-action]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const a = btn.dataset.action;
      if (a === 'close') { $('#creq-modal').hidden = true; return; }
      if (a === 'delete') {
        if (!confirm('Delete this request? Cannot be undone.')) return;
        try {
          await deleteDoc(doc(db, 'customOrders', r.id));
          toast('Deleted');
          $('#creq-modal').hidden = true;
        } catch (err) { toast('Delete failed: ' + err.message, true); }
        return;
      }
      if (a.startsWith('set-')) {
        const newStatus = a.replace('set-', '');
        try {
          await updateDoc(doc(db, 'customOrders', r.id), { status: newStatus, updatedAt: serverTimestamp() });
          toast('Status → ' + STATUS_LABEL[newStatus]);
          $('#creq-modal').hidden = true;
        } catch (err) { toast('Update failed: ' + err.message, true); }
      }
    });
  });
}
