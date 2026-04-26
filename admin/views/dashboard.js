import { db, $, escapeHtml } from '../admin.js';
import { collection, getDocs, query, orderBy, limit }
  from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

export async function render() {
  const container = $('#view-container');
  container.innerHTML = `
    <div class="kpi-grid" id="kpi-grid">
      <div class="kpi"><div class="label">Today's orders</div><div class="value" id="kpi-today">—</div><div class="sub" id="kpi-today-sub">—</div></div>
      <div class="kpi"><div class="label">Today's revenue</div><div class="value" id="kpi-revenue">—</div><div class="sub">AUD</div></div>
      <div class="kpi"><div class="label">Pending</div><div class="value" id="kpi-pending">—</div><div class="sub">need action</div></div>
      <div class="kpi"><div class="label">Total customers</div><div class="value" id="kpi-customers">—</div><div class="sub">all time</div></div>
    </div>

    <h2 class="section-title">Recent orders</h2>
    <div id="recent-orders" class="loading">Loading…</div>
  `;

  await Promise.all([loadKpis(), loadRecent()]);
}

async function loadKpis() {
  try {
    const [oSnap, cSnap] = await Promise.all([
      getDocs(collection(db, 'orders')),
      getDocs(collection(db, 'customers')),
    ]);
    const orders = [];
    oSnap.forEach(d => orders.push({ id: d.id, ...d.data() }));
    const todayStr = new Date().toLocaleDateString('en-AU', { year:'numeric', month:'2-digit', day:'2-digit' });

    let todayCount = 0, todayRevenue = 0, pendingCount = 0;
    orders.forEach(o => {
      const created = o.createdAt?.toDate ? o.createdAt.toDate() : null;
      const isToday = created && created.toLocaleDateString('en-AU', { year:'numeric', month:'2-digit', day:'2-digit' }) === todayStr;
      if (isToday) {
        todayCount += 1;
        if (o.status !== 'cancelled') todayRevenue += (o.total || 0);
      }
      if (o.status === 'new' || o.status === 'preparing') pendingCount += 1;
    });

    $('#kpi-today').textContent     = todayCount;
    $('#kpi-today-sub').textContent = todayCount === 0 ? 'no orders yet' : `${todayCount} today`;
    $('#kpi-revenue').textContent   = '$' + todayRevenue;
    $('#kpi-pending').textContent   = pendingCount;
    $('#kpi-customers').textContent = cSnap.size;
  } catch (err) {
    console.error('KPI load failed', err);
    ['kpi-today','kpi-revenue','kpi-pending','kpi-customers'].forEach(id => $('#' + id).textContent = '—');
  }
}

const STATUS_LABEL = {
  new: 'New', preparing: 'Preparing', out_for_delivery: 'Out for delivery',
  delivered: 'Delivered', cancelled: 'Cancelled',
};

async function loadRecent() {
  const list = $('#recent-orders');
  try {
    const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(8)));
    list.className = '';
    if (snap.empty) {
      list.innerHTML = `
        <div class="placeholder">
          <h2>No orders yet</h2>
          <p>Add a manual order or seed sample data from the <strong>Orders</strong> page to populate this view.</p>
        </div>`;
      return;
    }
    const orders = [];
    snap.forEach(d => orders.push({ id: d.id, ...d.data() }));
    list.innerHTML = '<div class="olist">' + orders.map(o => `
      <div class="orow" onclick="location.hash='#/orders'">
        <div class="o-num">#${(o.id || '').slice(-5).toUpperCase()}</div>
        <div class="o-main">
          <div class="o-cust">
            ${escapeHtml(o.customerName || 'Unknown')}
            <span class="status-badge s-${o.status || 'new'}">${escapeHtml(STATUS_LABEL[o.status] || o.status)}</span>
          </div>
          <div class="o-meta">
            ${escapeHtml(o.deliverySuburb || o.deliveryPostcode || '')}
            ${o.deliverySlot ? `<span class="dot">·</span> ${escapeHtml(o.deliverySlot)}` : ''}
          </div>
        </div>
        <div class="o-right">
          <div class="o-total">$${o.total ?? 0}</div>
          <div class="o-time">${formatTime(o.createdAt)}</div>
        </div>
      </div>
    `).join('') + '</div>';
  } catch (err) {
    list.className = '';
    list.innerHTML = `<div class="placeholder"><p>Load failed: ${escapeHtml(err.message)}</p></div>`;
    console.error(err);
  }
}

function formatTime(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
  return d.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
}
