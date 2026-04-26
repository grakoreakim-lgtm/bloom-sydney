import { db, $, $$, toast, escapeHtml } from '../admin.js';
import { collection, doc, getDoc, getDocs, updateDoc, query, orderBy, where, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

let allCustomers = [];

export async function render() {
  const container = $('#view-container');
  container.innerHTML = `
    <div class="action-bar">
      <span class="helper-text">Customers are auto-created when an order is placed. Click any row to view their order history.</span>
    </div>

    <div id="customers-list" class="loading">Loading…</div>

    <!-- Detail modal -->
    <div class="modal-overlay" id="cust-modal" hidden>
      <div class="modal modal-wide">
        <div id="cust-content"></div>
      </div>
    </div>
  `;

  await loadCustomers();
}

async function loadCustomers() {
  const list = $('#customers-list');
  list.className = 'loading';
  list.innerHTML = 'Loading…';
  try {
    const snap = await getDocs(query(collection(db, 'customers'), orderBy('lastOrderAt', 'desc')));
    allCustomers = [];
    snap.forEach(d => allCustomers.push({ email: d.id, ...d.data() }));
    renderList();
  } catch (err) {
    list.className = '';
    list.innerHTML = `<div class="placeholder"><h2>Load failed</h2><p>${escapeHtml(err.message)}</p></div>`;
    console.error(err);
  }
}

function renderList() {
  const list = $('#customers-list');
  list.className = '';
  if (!allCustomers.length) {
    list.innerHTML = `
      <div class="placeholder">
        <h2>No customers yet</h2>
        <p>Customers appear here automatically when an order is placed (manually or via the customer site).<br/>
        To see this populated, head to <strong>Orders</strong> and click <strong>Seed sample data</strong>.</p>
      </div>
    `;
    return;
  }
  list.innerHTML = '<div class="olist">' + allCustomers.map(c => `
    <div class="crow" data-email="${escapeHtml(c.email)}">
      <div>
        <div class="c-name">${escapeHtml(c.name || c.email)}</div>
        <div class="c-contact">${escapeHtml(c.email || '')} ${c.phone ? '· ' + escapeHtml(c.phone) : ''}</div>
      </div>
      <div class="c-stats">
        <strong>${c.totalOrders || 0}</strong> orders<br/>
        <span style="font-size:12px">$${c.lifetimeValue ?? 0} lifetime</span>
      </div>
      <div class="c-stats" style="font-size:12px">
        Last order<br/>
        <strong style="font-size:13px">${formatDate(c.lastOrderAt)}</strong>
      </div>
    </div>
  `).join('') + '</div>';

  list.querySelectorAll('.crow').forEach(row =>
    row.addEventListener('click', () => openDetail(row.dataset.email)));
}

function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' });
}

async function openDetail(email) {
  const c = allCustomers.find(x => x.email === email);
  if (!c) return;
  const content = $('#cust-content');

  content.innerHTML = `
    <div style="margin-bottom:18px">
      <h2 style="margin:0 0 4px">${escapeHtml(c.name || c.email)}</h2>
      <div class="muted" style="color:var(--subtle); font-size:13px">${escapeHtml(c.email)} ${c.phone ? '· ' + escapeHtml(c.phone) : ''}</div>
    </div>

    <div class="detail-grid" style="margin-bottom:18px">
      <div class="detail-block">
        <h3>Address</h3>
        <div class="row">${escapeHtml(c.address || '—')}</div>
        <div class="row muted">${escapeHtml(c.suburb || '')} ${escapeHtml(c.postcode || '')}</div>
      </div>
      <div class="detail-block">
        <h3>Stats</h3>
        <div class="row"><strong>${c.totalOrders || 0}</strong> orders · <strong>$${c.lifetimeValue ?? 0}</strong> lifetime</div>
        <div class="row muted">First: ${formatDate(c.firstOrderAt)} · Last: ${formatDate(c.lastOrderAt)}</div>
      </div>
    </div>

    <div class="detail-block" style="margin-bottom:18px">
      <h3>Notes</h3>
      <textarea id="cust-notes" rows="3" style="width:100%; padding:10px 12px; border:1px solid var(--border); border-radius:6px; font-family:inherit">${escapeHtml(c.notes || '')}</textarea>
      <div style="text-align:right; margin-top:6px">
        <button class="btn-secondary" id="btn-save-notes">Save notes</button>
      </div>
    </div>

    <div class="detail-block" style="margin-bottom:18px">
      <h3>Order history</h3>
      <div id="order-history" class="loading" style="padding:20px">Loading…</div>
    </div>

    <div class="modal-footer">
      <button class="btn-secondary" id="btn-cust-close">Close</button>
    </div>
  `;
  $('#cust-modal').hidden = false;

  $('#btn-cust-close').addEventListener('click', () => $('#cust-modal').hidden = true);
  $('#btn-save-notes').addEventListener('click', () => saveNotes(email));

  // Load order history
  try {
    const snap = await getDocs(query(
      collection(db, 'orders'),
      where('customerEmail', '==', email),
      orderBy('createdAt', 'desc')
    ));
    const hist = $('#order-history');
    hist.className = '';
    const orders = [];
    snap.forEach(d => orders.push({ id: d.id, ...d.data() }));
    if (!orders.length) {
      hist.innerHTML = '<div class="muted" style="color:var(--subtle); font-size:13px">No orders yet.</div>';
    } else {
      hist.innerHTML = orders.map(o => `
        <div class="history-row">
          <div class="h-num">#${(o.id || '').slice(-5).toUpperCase()}</div>
          <div>
            <div>${(o.items || []).map(it => escapeHtml(it.name)).join(', ')}</div>
            <div class="muted" style="color:var(--subtle); font-size:12px">${formatDate(o.createdAt)} · <span class="status-badge s-${o.status}" style="margin-left:4px">${escapeHtml(o.status)}</span></div>
          </div>
          <div style="font-weight:600">$${o.total ?? 0}</div>
        </div>
      `).join('');
    }
  } catch (err) {
    $('#order-history').className = '';
    $('#order-history').innerHTML = `<div class="muted" style="color:var(--subtle); font-size:13px">Failed: ${escapeHtml(err.message)}</div>`;
    if (String(err.message).includes('index')) {
      $('#order-history').innerHTML += `<div class="muted" style="color:var(--subtle); font-size:12px; margin-top:6px">Tip: Firestore may ask you to create a composite index — open browser console for the link.</div>`;
    }
    console.error(err);
  }
}

async function saveNotes(email) {
  const notes = $('#cust-notes').value;
  const btn = $('#btn-save-notes');
  btn.disabled = true; btn.textContent = 'Saving…';
  try {
    await updateDoc(doc(db, 'customers', email), { notes, updatedAt: serverTimestamp() });
    toast('Notes saved');
    // update local cache
    const c = allCustomers.find(x => x.email === email);
    if (c) c.notes = notes;
  } catch (err) {
    toast('Save failed: ' + err.message, true);
  } finally {
    btn.disabled = false; btn.textContent = 'Save notes';
  }
}
