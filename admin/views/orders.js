import { db, $, $$, toast, escapeHtml } from '../admin.js';
import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, setDoc,
  query, orderBy, serverTimestamp, increment
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

const STATUSES = [
  { key: 'new',              label: 'New' },
  { key: 'preparing',        label: 'Preparing' },
  { key: 'out_for_delivery', label: 'Out for delivery' },
  { key: 'delivered',        label: 'Delivered' },
  { key: 'cancelled',        label: 'Cancelled' },
];

const STATUS_FLOW = {
  new:              'preparing',
  preparing:        'out_for_delivery',
  out_for_delivery: 'delivered',
};

const STATUS_LABEL = {
  new: 'New', preparing: 'Preparing', out_for_delivery: 'Out for delivery',
  delivered: 'Delivered', cancelled: 'Cancelled',
};

const ADVANCE_LABEL = {
  new:              'Mark as preparing →',
  preparing:        'Mark out for delivery →',
  out_for_delivery: 'Mark delivered →',
};

const PAYMENT_OPTIONS = [
  { key: 'pending', label: 'Pending' },
  { key: 'paid',    label: 'Paid' },
  { key: 'manual',  label: 'Manual (cash / in-person)' },
];

const DELIVERY_SLOTS = ['11AM-1PM', '1PM-3PM', '3PM-5PM', '5PM-7PM'];

let currentFilter = 'all';
let allOrders     = [];
let availableProducts = [];

export async function render() {
  const container = $('#view-container');
  container.innerHTML = `
    <div class="status-filters" id="status-filters">
      <button class="filter-pill on" data-filter="all">All <span class="count" id="cnt-all">0</span></button>
      ${STATUSES.map(s => `
        <button class="filter-pill" data-filter="${s.key}">${s.label} <span class="count" id="cnt-${s.key}">0</span></button>
      `).join('')}
    </div>

    <div class="action-bar">
      <span class="helper-text">Manage incoming and manually-entered orders.</span>
      <button class="btn-primary" id="btn-new-order">+ New manual order</button>
    </div>

    <div id="orders-list" class="loading">Loading…</div>

    <!-- Detail modal -->
    <div class="modal-overlay" id="detail-modal" hidden>
      <div class="modal modal-wide">
        <div id="detail-content"></div>
      </div>
    </div>

    <!-- Manual order form -->
    <div class="modal-overlay" id="form-modal" hidden>
      <div class="modal modal-wide">
        <h2>New manual order</h2>
        <form id="order-form">
          <div class="section-card" style="padding:18px; margin-bottom:14px">
            <h3 class="section-title">Customer</h3>
            <div class="field-row">
              <div class="field"><label>Name *</label><input name="customerName" type="text" required/></div>
              <div class="field"><label>Phone *</label><input name="customerPhone" type="tel" required placeholder="+61 4xx xxx xxx"/></div>
            </div>
            <div class="field"><label>Email *</label><input name="customerEmail" type="email" required/></div>
          </div>

          <div class="section-card" style="padding:18px; margin-bottom:14px">
            <h3 class="section-title">Delivery</h3>
            <div class="field"><label>Address *</label><input name="deliveryAddress" type="text" required placeholder="15 Beecroft Rd"/></div>
            <div class="field-row">
              <div class="field"><label>Suburb</label><input name="deliverySuburb" type="text" placeholder="Epping"/></div>
              <div class="field"><label>Postcode *</label><input name="deliveryPostcode" type="text" required placeholder="2121"/></div>
            </div>
            <div class="field-row">
              <div class="field">
                <label>Delivery date *</label>
                <input name="deliveryDate" type="date" required/>
              </div>
              <div class="field">
                <label>Time slot</label>
                <select name="deliverySlot">
                  ${DELIVERY_SLOTS.map(s => `<option value="${s}">${s}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="field"><label>Card message</label><textarea name="cardMessage" rows="2" placeholder="Happy birthday Mum! 🌷" style="width:100%; padding:10px 12px; border:1px solid var(--border); border-radius:6px; font-family:inherit"></textarea></div>
          </div>

          <div class="section-card" style="padding:18px; margin-bottom:14px">
            <h3 class="section-title">Items</h3>
            <div id="line-items"></div>
            <button type="button" class="btn-secondary" id="btn-add-item" style="margin-top:8px">+ Add item</button>
          </div>

          <div class="section-card" style="padding:18px; margin-bottom:14px">
            <h3 class="section-title">Payment</h3>
            <div class="field-row">
              <div class="field">
                <label>Delivery fee (AUD)</label>
                <input name="deliveryFee" type="number" min="0" step="1" value="0"/>
              </div>
              <div class="field">
                <label>Payment status</label>
                <select name="paymentStatus">
                  ${PAYMENT_OPTIONS.map(p => `<option value="${p.key}">${p.label}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="muted" id="form-totals" style="text-align:right; font-size:13px; color:var(--mid); margin-top:6px"></div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-secondary" id="btn-form-cancel">Cancel</button>
            <button type="submit" class="btn-primary" id="btn-save-order">Save order</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Filter pills
  $$('.filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter;
      $$('.filter-pill').forEach(b => b.classList.toggle('on', b === btn));
      renderList();
    });
  });

  // New order button
  $('#btn-new-order').addEventListener('click', openManualForm);
  $('#btn-form-cancel').addEventListener('click', () => $('#form-modal').hidden = true);

  // Item row management
  $('#btn-add-item').addEventListener('click', () => addLineItem());
  $('#line-items').addEventListener('click', (e) => {
    if (e.target.matches('.btn-remove-item')) {
      e.target.closest('.li-row').remove();
      updateFormTotals();
    }
  });
  $('#line-items').addEventListener('change', updateFormTotals);
  $('#line-items').addEventListener('input',  updateFormTotals);
  $('#order-form [name=deliveryFee]').addEventListener('input', updateFormTotals);

  $('#order-form').addEventListener('submit', submitManualOrder);

  // Load products for the line-item picker
  await loadProductsCache();
  // Load orders
  await loadOrders();
}

async function loadProductsCache() {
  try {
    const snap = await getDocs(collection(db, 'products'));
    availableProducts = [];
    snap.forEach(d => availableProducts.push({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('Failed to load products for picker', err);
    availableProducts = [];
  }
}

async function loadOrders() {
  const list = $('#orders-list');
  list.className = 'loading';
  list.innerHTML = 'Loading…';
  try {
    const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
    allOrders = [];
    snap.forEach(d => allOrders.push({ id: d.id, ...d.data() }));
    renderList();
  } catch (err) {
    list.className = '';
    list.innerHTML = `<div class="placeholder"><h2>Load failed</h2><p>${escapeHtml(err.message)}</p></div>`;
    console.error(err);
  }
}

function renderList() {
  // Update counts
  const counts = { all: allOrders.length };
  STATUSES.forEach(s => counts[s.key] = 0);
  allOrders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
  Object.entries(counts).forEach(([k, v]) => {
    const el = $('#cnt-' + k);
    if (el) el.textContent = v;
  });

  const filtered = currentFilter === 'all'
    ? allOrders
    : allOrders.filter(o => o.status === currentFilter);

  const list = $('#orders-list');
  list.className = '';
  if (!filtered.length) {
    list.innerHTML = `
      <div class="placeholder">
        <h2>No orders ${currentFilter === 'all' ? 'yet' : 'in this status'}</h2>
        <p>${currentFilter === 'all'
          ? 'Add a manual order with the button above, or seed sample data to explore the UI.'
          : 'Switch filters or wait for new orders.'}</p>
        ${currentFilter === 'all' ? `
          <div style="margin-top:18px; display:flex; gap:10px; justify-content:center; flex-wrap:wrap">
            <button class="btn-secondary" id="btn-seed">🌱 Seed sample data</button>
          </div>` : ''}
      </div>
    `;
    const seed = $('#btn-seed');
    if (seed) seed.addEventListener('click', seedDemoData);
    return;
  }

  list.innerHTML = '<div class="olist">' + filtered.map(o => `
    <div class="orow" data-id="${o.id}">
      <div class="o-num">#${(o.id || '').slice(-5).toUpperCase()}</div>
      <div class="o-main">
        <div class="o-cust">
          ${escapeHtml(o.customerName || 'Unknown')}
          <span class="status-badge s-${o.status || 'new'}">${escapeHtml(STATUS_LABEL[o.status] || o.status)}</span>
        </div>
        <div class="o-meta">
          ${escapeHtml(o.deliverySuburb || o.deliveryPostcode || '')}
          ${o.deliverySlot ? `<span class="dot">·</span> ${escapeHtml(o.deliverySlot)}` : ''}
          <span class="dot">·</span>
          <span class="payment-pill p-${o.paymentStatus || 'pending'}">${escapeHtml(o.paymentStatus || 'pending')}</span>
        </div>
      </div>
      <div class="o-right">
        <div class="o-total">$${o.total ?? 0}</div>
        <div class="o-time">${formatTime(o.createdAt)}</div>
      </div>
    </div>
  `).join('') + '</div>';

  list.querySelectorAll('.orow').forEach(row =>
    row.addEventListener('click', () => openDetail(row.dataset.id)));
}

function formatTime(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
  return d.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' }) + ', ' +
         d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
}

async function openDetail(id) {
  const order = allOrders.find(o => o.id === id);
  if (!order) return;
  const advanceTo = STATUS_FLOW[order.status];
  const canCancel = order.status !== 'cancelled' && order.status !== 'delivered';

  $('#detail-content').innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
      <div>
        <h2 style="margin:0">Order #${(order.id || '').slice(-5).toUpperCase()}</h2>
        <div class="muted" style="margin-top:4px; color:var(--subtle); font-size:13px">${formatTime(order.createdAt)}</div>
      </div>
      <span class="status-badge s-${order.status}">${escapeHtml(STATUS_LABEL[order.status] || order.status)}</span>
    </div>

    <div class="detail-grid" style="margin-bottom:18px">
      <div class="detail-block">
        <h3>Customer</h3>
        <div class="row"><strong>${escapeHtml(order.customerName || '')}</strong></div>
        <div class="row muted">${escapeHtml(order.customerPhone || '')}</div>
        <div class="row muted">${escapeHtml(order.customerEmail || '')}</div>
      </div>
      <div class="detail-block">
        <h3>Delivery</h3>
        <div class="row">${escapeHtml(order.deliveryAddress || '')}</div>
        <div class="row muted">${escapeHtml(order.deliverySuburb || '')} ${escapeHtml(order.deliveryPostcode || '')}</div>
        <div class="row" style="margin-top:6px"><strong>${escapeHtml(order.deliveryDate || '')}</strong> · ${escapeHtml(order.deliverySlot || '')}</div>
        ${order.cardMessage ? `<div class="row muted" style="margin-top:8px; padding:8px 10px; background:var(--bg); border-radius:6px; font-style:italic">"${escapeHtml(order.cardMessage)}"</div>` : ''}
      </div>
    </div>

    <div class="detail-block" style="margin-bottom:18px">
      <h3>Items</h3>
      <div class="line-items">
        ${(order.items || []).map(it => `
          <div class="line-item">
            <div>
              <div class="lp">${escapeHtml(it.name || '')}</div>
              ${it.hasWine ? '<div class="qty">+ wine pairing</div>' : ''}
            </div>
            <div>
              <div>$${it.price} ${it.quantity > 1 ? `× ${it.quantity}` : ''}</div>
            </div>
          </div>
        `).join('')}
      </div>
      <div style="margin-top:14px">
        <div class="totals-row"><span>Subtotal</span><span>$${order.subtotal ?? 0}</span></div>
        <div class="totals-row"><span>Delivery</span><span>$${order.deliveryFee ?? 0}</span></div>
        <div class="totals-row final"><span>Total</span><span>$${order.total ?? 0} <span class="payment-pill p-${order.paymentStatus || 'pending'}" style="margin-left:8px">${escapeHtml(order.paymentStatus || 'pending')}</span></span></div>
      </div>
    </div>

    <div class="status-actions">
      ${advanceTo ? `<button class="advance" data-action="advance">${ADVANCE_LABEL[order.status]}</button>` : ''}
      ${canCancel ? '<button class="cancel" data-action="cancel">Cancel order</button>' : ''}
      <button class="cancel" data-action="delete" style="margin-left:auto">Delete</button>
      <button class="btn-secondary" data-action="close">Close</button>
    </div>
  `;

  $('#detail-modal').hidden = false;

  $$('#detail-content [data-action]').forEach(btn => {
    btn.addEventListener('click', () => handleDetailAction(order, btn.dataset.action));
  });
}

async function handleDetailAction(order, action) {
  if (action === 'close') { $('#detail-modal').hidden = true; return; }
  if (action === 'advance') {
    const next = STATUS_FLOW[order.status];
    if (!next) return;
    try {
      await updateDoc(doc(db, 'orders', order.id), { status: next, updatedAt: serverTimestamp() });
      toast(`Status → ${STATUS_LABEL[next]}`);
      $('#detail-modal').hidden = true;
      loadOrders();
    } catch (err) { toast('Update failed: ' + err.message, true); }
    return;
  }
  if (action === 'cancel') {
    if (!confirm('Cancel this order?')) return;
    try {
      await updateDoc(doc(db, 'orders', order.id), { status: 'cancelled', updatedAt: serverTimestamp() });
      toast('Order cancelled');
      $('#detail-modal').hidden = true;
      loadOrders();
    } catch (err) { toast('Update failed: ' + err.message, true); }
    return;
  }
  if (action === 'delete') {
    if (!confirm('Delete this order entirely? This cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'orders', order.id));
      toast('Deleted');
      $('#detail-modal').hidden = true;
      loadOrders();
    } catch (err) { toast('Delete failed: ' + err.message, true); }
  }
}

/* ─── MANUAL ORDER FORM ─── */
function openManualForm() {
  const f = $('#order-form');
  f.reset();
  $('#line-items').innerHTML = '';
  addLineItem();
  // Default delivery date = today (YYYY-MM-DD in AU local)
  f.deliveryDate.value = todayStr();
  $('#form-modal').hidden = false;
  updateFormTotals();
}

function addLineItem(preset = null) {
  const container = $('#line-items');
  const row = document.createElement('div');
  row.className = 'li-row';
  row.style.cssText = 'display:grid; grid-template-columns: 1fr 90px 90px auto; gap:8px; margin-bottom:8px; align-items:center';
  row.innerHTML = `
    <select class="li-product" style="padding:9px 12px; border:1px solid var(--border); border-radius:6px">
      <option value="">— Select product —</option>
      ${availableProducts.map(p => `
        <option value="${p.id}" data-name="${escapeHtml(p.name)}" data-price="${p.price}" data-wine="${p.wine || ''}">
          ${escapeHtml(p.name)} ($${p.price})
        </option>
      `).join('')}
    </select>
    <input class="li-price" type="number" min="0" step="1" placeholder="Price" style="padding:9px 12px; border:1px solid var(--border); border-radius:6px"/>
    <input class="li-qty"   type="number" min="1" step="1" value="1" placeholder="Qty" style="padding:9px 12px; border:1px solid var(--border); border-radius:6px"/>
    <button type="button" class="btn-danger btn-remove-item">×</button>
  `;
  container.appendChild(row);

  const sel = row.querySelector('.li-product');
  sel.addEventListener('change', () => {
    const opt = sel.selectedOptions[0];
    if (opt && opt.dataset.price) {
      row.querySelector('.li-price').value = opt.dataset.price;
    }
    updateFormTotals();
  });

  if (preset) {
    if (preset.productId) sel.value = preset.productId;
    if (preset.price != null) row.querySelector('.li-price').value = preset.price;
    if (preset.quantity)      row.querySelector('.li-qty').value   = preset.quantity;
  }
}

function gatherFormItems() {
  const rows = $$('#line-items .li-row');
  return rows.map(r => {
    const sel = r.querySelector('.li-product');
    const opt = sel.selectedOptions[0];
    const price = Number(r.querySelector('.li-price').value) || 0;
    const qty   = Number(r.querySelector('.li-qty').value) || 1;
    const name  = opt && opt.dataset.name ? opt.dataset.name : '(unnamed)';
    return { productId: sel.value || null, name, price, quantity: qty, hasWine: false };
  }).filter(it => it.price > 0);
}

function updateFormTotals() {
  const items = gatherFormItems();
  const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
  const deliveryFee = Number($('#order-form [name=deliveryFee]').value) || 0;
  const total = subtotal + deliveryFee;
  $('#form-totals').innerHTML = `Subtotal $${subtotal} · Delivery $${deliveryFee} · <strong style="color:var(--ink)">Total $${total}</strong>`;
}

async function submitManualOrder(e) {
  e.preventDefault();
  const f = e.target;
  const items = gatherFormItems();
  if (!items.length) { toast('Add at least one item.', true); return; }

  const subtotal    = items.reduce((s, it) => s + it.price * it.quantity, 0);
  const deliveryFee = Number(f.deliveryFee.value) || 0;
  const total       = subtotal + deliveryFee;

  const data = {
    customerName:     f.customerName.value.trim(),
    customerPhone:    f.customerPhone.value.trim(),
    customerEmail:    f.customerEmail.value.trim().toLowerCase(),
    deliveryAddress:  f.deliveryAddress.value.trim(),
    deliverySuburb:   f.deliverySuburb.value.trim(),
    deliveryPostcode: f.deliveryPostcode.value.trim(),
    deliveryDate:     f.deliveryDate.value,
    deliverySlot:     f.deliverySlot.value,
    cardMessage:      f.cardMessage.value.trim(),
    items, subtotal, deliveryFee, total,
    paymentStatus: f.paymentStatus.value,
    status:        'new',
    source:        'manual',
    createdAt:     serverTimestamp(),
    updatedAt:     serverTimestamp(),
  };

  const btn = $('#btn-save-order');
  btn.disabled = true; btn.textContent = 'Saving…';
  try {
    const ref = await addDoc(collection(db, 'orders'), data);
    await upsertCustomerFromOrder({ ...data, id: ref.id });
    toast('Order created');
    $('#form-modal').hidden = true;
    loadOrders();
  } catch (err) {
    console.error(err);
    toast('Save failed: ' + (err.code || err.message), true);
  } finally {
    btn.disabled = false; btn.textContent = 'Save order';
  }
}

/* ─── CUSTOMER UPSERT ─── */
async function upsertCustomerFromOrder(order) {
  if (!order.customerEmail) return;
  const email = order.customerEmail.toLowerCase().trim();
  const ref = doc(db, 'customers', email);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, {
      name:     order.customerName,
      phone:    order.customerPhone,
      address:  order.deliveryAddress,
      postcode: order.deliveryPostcode,
      suburb:   order.deliverySuburb,
      totalOrders:   increment(1),
      lifetimeValue: increment(order.total || 0),
      lastOrderAt:   serverTimestamp(),
      updatedAt:     serverTimestamp(),
    });
  } else {
    await setDoc(ref, {
      email, name: order.customerName, phone: order.customerPhone,
      address: order.deliveryAddress, postcode: order.deliveryPostcode, suburb: order.deliverySuburb,
      totalOrders: 1, lifetimeValue: order.total || 0,
      firstOrderAt: serverTimestamp(), lastOrderAt: serverTimestamp(),
      notes: '',
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
  }
}

/* ─── DEMO SEED ─── */
function todayStr(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

async function seedDemoData() {
  if (!confirm('This will add 8 sample orders and 5 sample customers so you can test the admin UI. Continue?')) return;

  const samples = [
    { customerName:'Sarah Mitchell', customerPhone:'+61 412 345 678', customerEmail:'sarah.mitchell@example.com',
      deliveryAddress:'15 Beecroft Rd', deliverySuburb:'Epping', deliveryPostcode:'2121',
      deliveryDate: todayStr(0), deliverySlot:'11AM-1PM', cardMessage:'Happy birthday Mum! ❤️',
      items:[{name:'White Tulip Bunch', price:42, quantity:1, hasWine:false}],
      subtotal:42, deliveryFee:5, total:47, status:'preparing', paymentStatus:'paid' },
    { customerName:'James Wong', customerPhone:'+61 423 567 891', customerEmail:'james.wong@example.com',
      deliveryAddress:'8 Pennant Hills Rd', deliverySuburb:'Carlingford', deliveryPostcode:'2118',
      deliveryDate: todayStr(0), deliverySlot:'1PM-3PM', cardMessage:'For our anniversary 🌹',
      items:[{name:'Pink Peony Cluster', price:48, quantity:1, hasWine:true}, {name:'Hunter Valley Rosé', price:24, quantity:1, hasWine:false}],
      subtotal:72, deliveryFee:0, total:72, status:'out_for_delivery', paymentStatus:'paid' },
    { customerName:'Mia Chen', customerPhone:'+61 434 678 902', customerEmail:'mia.chen@example.com',
      deliveryAddress:'22 Blaxland Rd', deliverySuburb:'Ryde', deliveryPostcode:'2112',
      deliveryDate: todayStr(0), deliverySlot:'3PM-5PM', cardMessage:'',
      items:[{name:'Sunflower Bunch', price:38, quantity:2, hasWine:false}],
      subtotal:76, deliveryFee:10, total:86, status:'new', paymentStatus:'pending' },
    { customerName:'Tom Hartley', customerPhone:'+61 445 789 013', customerEmail:'tom.hartley@example.com',
      deliveryAddress:'5 Talavera Rd', deliverySuburb:'Macquarie Park', deliveryPostcode:'2113',
      deliveryDate: todayStr(0), deliverySlot:'5PM-7PM', cardMessage:'Get well soon!',
      items:[{name:'Mixed Spring Bouquet', price:45, quantity:1, hasWine:false}],
      subtotal:45, deliveryFee:8, total:53, status:'new', paymentStatus:'manual' },
    { customerName:'Rachel Kim', customerPhone:'+61 456 890 124', customerEmail:'rachel.kim@example.com',
      deliveryAddress:'40 Carlingford Rd', deliverySuburb:'Epping', deliveryPostcode:'2121',
      deliveryDate: todayStr(-1), deliverySlot:'1PM-3PM', cardMessage:'Thank you for everything 💕',
      items:[{name:'Lavender & Eucalyptus', price:36, quantity:1, hasWine:false}],
      subtotal:36, deliveryFee:5, total:41, status:'delivered', paymentStatus:'paid' },
    { customerName:'David Lee', customerPhone:'+61 467 901 235', customerEmail:'david.lee@example.com',
      deliveryAddress:'3 Marsden Rd', deliverySuburb:'North Rocks', deliveryPostcode:'2151',
      deliveryDate: todayStr(-1), deliverySlot:'11AM-1PM', cardMessage:'',
      items:[{name:'David Austin Rose', price:55, quantity:1, hasWine:true}],
      subtotal:55, deliveryFee:8, total:63, status:'delivered', paymentStatus:'paid' },
    { customerName:'Sarah Mitchell', customerPhone:'+61 412 345 678', customerEmail:'sarah.mitchell@example.com',
      deliveryAddress:'15 Beecroft Rd', deliverySuburb:'Epping', deliveryPostcode:'2121',
      deliveryDate: todayStr(2), deliverySlot:'1PM-3PM', cardMessage:"Mother's Day 💐",
      items:[{name:"Mother's Day Special", price:95, quantity:1, hasWine:true}],
      subtotal:95, deliveryFee:0, total:95, status:'new', paymentStatus:'paid' },
    { customerName:'Olivia Park', customerPhone:'+61 478 012 346', customerEmail:'olivia.park@example.com',
      deliveryAddress:'17 Herring Rd', deliverySuburb:'Macquarie Park', deliveryPostcode:'2113',
      deliveryDate: todayStr(0), deliverySlot:'3PM-5PM', cardMessage:'Sorry I had to cancel.',
      items:[{name:'Anemone & Ranunculus', price:52, quantity:1, hasWine:false}],
      subtotal:52, deliveryFee:8, total:60, status:'cancelled', paymentStatus:'pending' },
  ];

  toast('Seeding sample data…');
  try {
    for (const s of samples) {
      const data = { ...s, source: 'manual', createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
      const ref = await addDoc(collection(db, 'orders'), data);
      await upsertCustomerFromOrder({ ...data, id: ref.id });
    }
    toast(`Seeded ${samples.length} sample orders ✨`);
    loadOrders();
  } catch (err) {
    console.error(err);
    toast('Seed failed: ' + (err.code || err.message), true);
  }
}
