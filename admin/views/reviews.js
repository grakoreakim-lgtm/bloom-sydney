import { db, $, $$, toast, escapeHtml } from '../admin.js';
import { collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, orderBy, where, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

const TAGS = ['Same-Day', 'Pre-Order', 'Subscription', 'Gift', 'Hamper', 'Wedding', 'Other'];
let editingId = null;

export async function render() {
  const container = $('#view-container');
  container.innerHTML = `
    <div class="action-bar">
      <span class="helper-text">Customer reviews shown on the homepage carousel. Verified reviews convert better — keep names + suburb realistic.</span>
      <div style="display:flex; gap:8px">
        <button class="btn-secondary" id="btn-seed-rev">🌱 Seed samples</button>
        <button class="btn-secondary" id="btn-del-samples" hidden>🧹 Delete all samples</button>
        <button class="btn-primary" id="btn-add-rev">+ New review</button>
      </div>
    </div>

    <div id="rev-summary" class="kpi-grid" style="margin-bottom:14px">
      <div class="kpi"><div class="label">Average</div><div class="value" id="kpi-avg">—</div><div class="sub">/ 5 stars</div></div>
      <div class="kpi"><div class="label">Total reviews</div><div class="value" id="kpi-total">—</div><div class="sub">all time</div></div>
      <div class="kpi"><div class="label">Verified</div><div class="value" id="kpi-verified">—</div><div class="sub">✓ purchase</div></div>
      <div class="kpi"><div class="label">Samples</div><div class="value" id="kpi-samples">—</div><div class="sub">not real reviews</div></div>
    </div>

    <div id="rev-list" class="loading">Loading…</div>

    <!-- Edit modal -->
    <div class="modal-overlay" id="rev-modal" hidden>
      <div class="modal modal-wide">
        <h2 id="rev-form-title">New review</h2>
        <form id="rev-form">

          <div class="field-row">
            <div class="field"><label>Customer name *</label><input name="customerName" type="text" required placeholder="Sarah M."/></div>
            <div class="field"><label>Suburb</label><input name="suburb" type="text" placeholder="Epping"/></div>
          </div>

          <div class="field-row">
            <div class="field">
              <label>Stars *</label>
              <select name="stars" required>
                <option value="5">★★★★★ (5)</option>
                <option value="4">★★★★☆ (4)</option>
                <option value="3">★★★☆☆ (3)</option>
                <option value="2">★★☆☆☆ (2)</option>
                <option value="1">★☆☆☆☆ (1)</option>
              </select>
            </div>
            <div class="field">
              <label>Tag</label>
              <select name="tag">
                ${TAGS.map(t => `<option value="${t}">${t}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="field">
            <label>Review text *</label>
            <textarea name="text" rows="3" required style="width:100%; padding:10px 12px; border:1px solid var(--border); border-radius:6px; font-family:inherit"></textarea>
          </div>

          <div class="field-row">
            <div class="field"><label>Product (optional)</label><input name="productName" type="text" placeholder="White Tulip + Rosé Hamper"/></div>
            <div class="field"><label>Date (text, e.g., April 2025)</label><input name="date" type="text" placeholder="April 2025"/></div>
          </div>

          <div class="field" style="display:flex; gap:18px">
            <label class="field-check"><input name="verified" type="checkbox" checked/> Verified purchase</label>
            <label class="field-check"><input name="active" type="checkbox" checked/> Show on customer site</label>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-secondary" id="btn-rev-cancel">Cancel</button>
            <button type="submit" class="btn-primary" id="btn-rev-save">Save</button>
          </div>
        </form>
      </div>
    </div>
  `;

  $('#btn-add-rev').addEventListener('click', () => openForm(null));
  $('#btn-seed-rev').addEventListener('click', seedSamples);
  $('#btn-del-samples').addEventListener('click', deleteAllSamples);
  $('#btn-rev-cancel').addEventListener('click', () => $('#rev-modal').hidden = true);
  $('#rev-form').addEventListener('submit', onSubmit);

  await loadReviews();
}

async function loadReviews() {
  const list = $('#rev-list');
  list.className = 'loading';
  list.innerHTML = 'Loading…';
  try {
    const snap = await getDocs(query(collection(db, 'reviews'), orderBy('sortOrder', 'asc')));
    const items = [];
    snap.forEach(d => items.push({ id: d.id, ...d.data() }));
    renderSummary(items);
    renderList(items);
  } catch (err) {
    list.className = '';
    list.innerHTML = `<div class="placeholder"><h2>Load failed</h2><p>${escapeHtml(err.message)}</p></div>`;
    console.error(err);
  }
}

function renderSummary(items) {
  const valid = items.filter(r => r.active !== false);
  const avg = valid.length ? (valid.reduce((s, r) => s + (r.stars || 0), 0) / valid.length).toFixed(1) : '—';
  const verified = items.filter(r => r.verified).length;
  const samples = items.filter(r => r.isSample).length;
  $('#kpi-avg').textContent = avg;
  $('#kpi-total').textContent = items.length;
  $('#kpi-verified').textContent = verified;
  $('#kpi-samples').textContent = samples;
  $('#btn-del-samples').hidden = samples === 0;
}

function renderList(items) {
  const list = $('#rev-list');
  list.className = '';
  if (!items.length) {
    list.innerHTML = `
      <div class="placeholder">
        <h2>No reviews yet</h2>
        <p>Click <strong>+ New review</strong> to add one manually,<br/>or <strong>🌱 Seed samples</strong> to populate the homepage carousel for testing.</p>
        <p style="font-size:13px; margin-top:14px">⚠️ Sample reviews are <strong>not real</strong> — replace them with genuine customer reviews before going live (ACCC compliance).</p>
      </div>`;
    return;
  }
  list.innerHTML = '<div class="olist">' + items.map(r => `
    <div class="orow" data-id="${r.id}">
      <div class="o-num" style="color:${r.stars >= 4 ? 'var(--gold)' : 'var(--subtle)'}">${'★'.repeat(r.stars || 0)}${'☆'.repeat(5 - (r.stars || 0))}</div>
      <div class="o-main">
        <div class="o-cust">
          ${escapeHtml(r.customerName || 'Anonymous')}
          ${r.suburb ? `<span style="font-weight:400; color:var(--subtle); font-size:13px">· ${escapeHtml(r.suburb)}</span>` : ''}
          ${r.isSample ? '<span class="payment-pill p-pending" style="margin-left:8px">SAMPLE</span>' : ''}
          ${r.active === false ? '<span class="payment-pill p-pending" style="margin-left:8px">HIDDEN</span>' : ''}
        </div>
        <div class="o-meta" style="margin-top:6px; line-height:1.5">
          "${escapeHtml((r.text || '').slice(0, 120))}${(r.text || '').length > 120 ? '…' : ''}"
        </div>
        <div class="o-meta" style="margin-top:4px">
          ${r.tag ? `<span class="status-badge s-preparing" style="font-size:10px; padding:2px 8px">${escapeHtml(r.tag)}</span>` : ''}
          ${r.productName ? `<span class="dot">·</span> ${escapeHtml(r.productName)}` : ''}
          ${r.date ? `<span class="dot">·</span> ${escapeHtml(r.date)}` : ''}
          ${r.verified ? '<span class="dot">·</span> ✓ verified' : ''}
        </div>
      </div>
      <div style="display:flex; gap:6px">
        <button class="btn-secondary btn-edit-rev" data-id="${r.id}">Edit</button>
        <button class="btn-danger btn-del-rev" data-id="${r.id}">Delete</button>
      </div>
    </div>
  `).join('') + '</div>';
  list.querySelectorAll('.btn-edit-rev').forEach(b =>
    b.addEventListener('click', () => editReview(b.dataset.id)));
  list.querySelectorAll('.btn-del-rev').forEach(b =>
    b.addEventListener('click', () => deleteReview(b.dataset.id)));
}

async function editReview(id) {
  try {
    const snap = await getDoc(doc(db, 'reviews', id));
    if (snap.exists()) openForm({ id: snap.id, ...snap.data() });
  } catch (err) { toast('Load failed: ' + err.message, true); }
}

function openForm(r) {
  editingId = r?.id || null;
  const f = $('#rev-form');
  f.reset();
  $('#rev-form-title').textContent = r ? 'Edit review' : 'New review';
  if (r) {
    f.customerName.value = r.customerName || '';
    f.suburb.value       = r.suburb || '';
    f.stars.value        = r.stars || 5;
    f.tag.value          = r.tag || 'Same-Day';
    f.text.value         = r.text || '';
    f.productName.value  = r.productName || '';
    f.date.value         = r.date || '';
    f.verified.checked   = r.verified !== false;
    f.active.checked     = r.active !== false;
    f.dataset.sortOrder  = r.sortOrder ?? '';
    f.dataset.isSample   = r.isSample ? '1' : '';
  } else {
    f.dataset.sortOrder = '';
    f.dataset.isSample  = '';
  }
  $('#rev-modal').hidden = false;
}

async function onSubmit(e) {
  e.preventDefault();
  const f = e.target;
  const btn = $('#btn-rev-save');
  btn.disabled = true; btn.textContent = 'Saving…';
  try {
    const data = {
      customerName: f.customerName.value.trim(),
      suburb:       f.suburb.value.trim(),
      stars:        Number(f.stars.value),
      tag:          f.tag.value,
      text:         f.text.value.trim(),
      productName:  f.productName.value.trim(),
      date:         f.date.value.trim(),
      verified:     f.verified.checked,
      active:       f.active.checked,
      sortOrder:    f.dataset.sortOrder !== '' ? Number(f.dataset.sortOrder) : Date.now(),
      isSample:     f.dataset.isSample === '1' ? true : false,
      updatedAt:    serverTimestamp(),
    };
    if (editingId) {
      await updateDoc(doc(db, 'reviews', editingId), data);
      toast('Updated');
    } else {
      data.createdAt = serverTimestamp();
      await addDoc(collection(db, 'reviews'), data);
      toast('Review added');
    }
    $('#rev-modal').hidden = true;
    loadReviews();
  } catch (err) {
    toast('Save failed: ' + (err.code || err.message), true);
  } finally {
    btn.disabled = false; btn.textContent = 'Save';
  }
}

async function deleteReview(id) {
  if (!confirm('Delete this review?')) return;
  try {
    await deleteDoc(doc(db, 'reviews', id));
    toast('Deleted');
    loadReviews();
  } catch (err) { toast('Delete failed: ' + err.message, true); }
}

/* ─── Sample seed ─── */
const SAMPLES = [
  { customerName:'Sarah M.', suburb:'Epping',         stars:5, tag:'Same-Day',     date:'April 2025',
    text:'Ordered at 11:30 AM and the flowers arrived by 2 PM beautifully wrapped — looked exactly like the photo. The Hunter Valley rosé pairing was such a thoughtful touch. Will definitely order again.',
    productName:'White Tulip + Rosé Hamper', verified:true },
  { customerName:'James W.', suburb:'Carlingford',    stars:5, tag:'Pre-Order',    date:'March 2025',
    text:'Pre-ordered 5 days ahead for our anniversary. Communication was great, delivery was on time, and my wife was speechless when she saw the peony arrangement.',
    productName:'Pink Peony + Chardonnay Hamper', verified:true },
  { customerName:'Mia C.',   suburb:'Ryde',           stars:5, tag:'Subscription', date:'April 2025',
    text:"Been subscribing to the weekly Bunch for 3 months now. Every Friday I genuinely look forward to seeing what's been picked at Flemington that morning. Worth every dollar.",
    productName:'Weekly Bunch Subscription', verified:true },
  { customerName:'Tom H.',   suburb:'Macquarie Park', stars:5, tag:'Gift',         date:'February 2025',
    text:"Sent flowers to my mum for her 70th birthday. She called me crying — said they were the most beautiful flowers she'd ever received. The card message was hand-written on lovely paper.",
    productName:'Sunflower + Sauvignon Blanc', verified:true },
  { customerName:'Rachel K.', suburb:'Epping',        stars:5, tag:'Same-Day',     date:'March 2025',
    text:"Needed something urgently for a colleague's farewell. Ordered at 10:15 AM, arrived at the office by 1:30 PM. Genuinely impressed — most florists would've quoted me 'next day' for that timing.",
    productName:'Mixed Spring Bunch', verified:true },
  { customerName:'David L.',  suburb:'North Rocks',   stars:4, tag:'Hamper',       date:'January 2025',
    text:"Bought the deluxe hamper for my wife's birthday. Presentation was very premium — felt like a proper gift, not just flowers in a box. Only minor thing: would love a slightly larger card for longer messages.",
    productName:'Tulip + Rosé Hamper Deluxe', verified:true },
];

async function seedSamples() {
  if (!confirm('This will add 6 sample reviews labelled as samples. Replace them with real customer reviews before going live (ACCC). Continue?')) return;
  try {
    for (let i = 0; i < SAMPLES.length; i++) {
      const s = SAMPLES[i];
      await addDoc(collection(db, 'reviews'), {
        ...s,
        active:    true,
        isSample:  true,
        sortOrder: i,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    toast('Seeded 6 sample reviews');
    loadReviews();
  } catch (err) {
    toast('Seed failed: ' + (err.code || err.message), true);
  }
}

async function deleteAllSamples() {
  if (!confirm('Delete ALL sample reviews? Real reviews are kept.')) return;
  try {
    const snap = await getDocs(query(collection(db, 'reviews'), where('isSample', '==', true)));
    let n = 0;
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
      n++;
    }
    toast(`Deleted ${n} sample reviews`);
    loadReviews();
  } catch (err) {
    toast('Delete failed: ' + (err.code || err.message), true);
  }
}
