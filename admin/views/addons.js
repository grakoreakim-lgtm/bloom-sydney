import { db, $, $$, toast, escapeHtml } from '../admin.js';
import { collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, orderBy, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

let editingId = null;

const DEFAULTS = [
  { icon: '🍷', name: 'Wine Pairing',      description: 'Curated Australian wine, hand-selected by us (changes weekly)', price: 25, sortOrder: 1 },
  { icon: '🍫', name: 'Chocolate Box',     description: '12 hand-made truffles from a Carlingford bakery',               price: 15, sortOrder: 2 },
  { icon: '💌', name: 'Premium Card',      description: 'Hand-written on quality paper, sealed in an envelope',          price: 5,  sortOrder: 3 },
  { icon: '🎁', name: 'Premium Gift Wrap', description: 'Hand-tied with paper & ribbon',                                 price: 8,  sortOrder: 4 },
];

export async function render() {
  const container = $('#view-container');
  container.innerHTML = `
    <div class="action-bar">
      <span class="helper-text">Add-ons appear on the customer product detail page (chocolate, cards, gift wrap, etc.). Wine pairing is set per-product.</span>
      <div style="display:flex; gap:8px">
        <button class="btn-secondary" id="btn-seed-addons">🌱 Seed defaults</button>
        <button class="btn-primary"   id="btn-add-addon">+ New add-on</button>
      </div>
    </div>

    <div id="addons-list" class="loading">Loading…</div>

    <!-- Modal -->
    <div class="modal-overlay" id="addon-modal" hidden>
      <div class="modal">
        <h2 id="addon-form-title">New add-on</h2>
        <form id="addon-form">

          <div class="field-row">
            <div class="field" style="max-width:120px">
              <label>Icon</label>
              <input name="icon" type="text" maxlength="2" placeholder="🍫" style="text-align:center; font-size:18px"/>
              <div style="margin-top:4px; font-size:12px; color:var(--subtle)">One emoji</div>
            </div>
            <div class="field" style="flex:1">
              <label>Name *</label>
              <input name="name" type="text" required placeholder="Chocolate Box"/>
            </div>
          </div>

          <div class="field">
            <label>Description</label>
            <input name="description" type="text" placeholder="12 hand-made truffles from a Carlingford bakery"/>
            <div style="margin-top:4px; font-size:12px; color:var(--subtle)">One short line shown under the name on the customer page</div>
          </div>

          <div class="field" style="max-width: 220px">
            <label>Price (AUD) *</label>
            <input name="price" type="number" min="0" step="1" required placeholder="15"/>
          </div>

          <div class="field" style="display:flex; gap:18px">
            <label class="field-check"><input name="active" type="checkbox" checked/> Show on customer site</label>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-secondary" id="btn-addon-cancel">Cancel</button>
            <button type="submit" class="btn-primary"   id="btn-addon-save">Save</button>
          </div>
        </form>
      </div>
    </div>
  `;

  $('#btn-add-addon').addEventListener('click', () => openForm(null));
  $('#btn-seed-addons').addEventListener('click', seedDefaults);
  $('#btn-addon-cancel').addEventListener('click', () => $('#addon-modal').hidden = true);
  $('#addon-form').addEventListener('submit', onSubmit);

  await loadAddons();
}

async function loadAddons() {
  const list = $('#addons-list');
  list.className = 'loading';
  list.innerHTML = 'Loading…';
  try {
    const snap = await getDocs(query(collection(db, 'addons'), orderBy('sortOrder', 'asc')));
    const items = [];
    snap.forEach(d => items.push({ id: d.id, ...d.data() }));
    list.className = '';
    if (!items.length) {
      list.innerHTML = `
        <div class="placeholder">
          <h2>No add-ons yet</h2>
          <p>Click <strong>🌱 Seed defaults</strong> to add Chocolate, Card, Gift Wrap presets,<br/>or <strong>+ New add-on</strong> to add your own.</p>
        </div>`;
      return;
    }
    list.innerHTML = '<div class="olist">' + items.map(a => `
      <div class="orow" data-id="${a.id}">
        <div class="o-num" style="font-size:24px; line-height:1; min-width:32px; text-align:center">${escapeHtml(a.icon || '✦')}</div>
        <div class="o-main">
          <div class="o-cust">
            ${escapeHtml(a.name || 'Untitled')}
            ${a.active === false ? '<span class="payment-pill p-pending" style="margin-left:8px">HIDDEN</span>' : ''}
          </div>
          <div class="o-meta" style="margin-top:4px">
            ${a.description ? escapeHtml(a.description) : '<em style="color:var(--subtle)">No description</em>'}
          </div>
          <div class="o-meta" style="margin-top:4px; font-weight:600; color:var(--ink)">+$${a.price ?? 0}</div>
        </div>
        <div style="display:flex; gap:6px">
          <button class="btn-secondary btn-edit-addon" data-id="${a.id}">Edit</button>
          <button class="btn-danger btn-del-addon" data-id="${a.id}">Delete</button>
        </div>
      </div>
    `).join('') + '</div>';
    list.querySelectorAll('.btn-edit-addon').forEach(b =>
      b.addEventListener('click', () => editAddon(b.dataset.id)));
    list.querySelectorAll('.btn-del-addon').forEach(b =>
      b.addEventListener('click', () => deleteAddon(b.dataset.id)));
  } catch (err) {
    list.className = '';
    list.innerHTML = `<div class="placeholder"><h2>Load failed</h2><p>${escapeHtml(err.message)}</p></div>`;
    console.error(err);
  }
}

async function editAddon(id) {
  try {
    const snap = await getDoc(doc(db, 'addons', id));
    if (snap.exists()) openForm({ id: snap.id, ...snap.data() });
  } catch (err) { toast('Load failed: ' + err.message, true); }
}

function openForm(a) {
  editingId = a?.id || null;
  const f = $('#addon-form');
  f.reset();
  $('#addon-form-title').textContent = a ? 'Edit add-on' : 'New add-on';
  if (a) {
    f.icon.value        = a.icon || '';
    f.name.value        = a.name || '';
    f.description.value = a.description || '';
    f.price.value       = a.price ?? '';
    f.active.checked    = a.active !== false;
    f.dataset.sortOrder = a.sortOrder ?? '';
  } else {
    f.active.checked    = true;
    f.dataset.sortOrder = '';
  }
  $('#addon-modal').hidden = false;
}

async function onSubmit(e) {
  e.preventDefault();
  const f = e.target;
  const btn = $('#btn-addon-save');
  btn.disabled = true; btn.textContent = 'Saving…';
  try {
    const data = {
      icon:        f.icon.value.trim(),
      name:        f.name.value.trim(),
      description: f.description.value.trim(),
      price:       Number(f.price.value),
      active:      f.active.checked,
      sortOrder:   f.dataset.sortOrder !== '' ? Number(f.dataset.sortOrder) : Date.now(),
      updatedAt:   serverTimestamp(),
    };
    if (editingId) {
      await updateDoc(doc(db, 'addons', editingId), data);
      toast('Updated');
    } else {
      data.createdAt = serverTimestamp();
      await addDoc(collection(db, 'addons'), data);
      toast('Add-on added');
    }
    $('#addon-modal').hidden = true;
    loadAddons();
  } catch (err) {
    toast('Save failed: ' + (err.code || err.message), true);
  } finally {
    btn.disabled = false; btn.textContent = 'Save';
  }
}

async function deleteAddon(id) {
  if (!confirm('Delete this add-on?')) return;
  try {
    await deleteDoc(doc(db, 'addons', id));
    toast('Deleted');
    loadAddons();
  } catch (err) { toast('Delete failed: ' + err.message, true); }
}

async function seedDefaults() {
  if (!confirm(`Add ${DEFAULTS.length} default add-ons (Chocolate, Card, Gift Wrap)? Existing add-ons are kept.`)) return;
  try {
    for (const d of DEFAULTS) {
      await addDoc(collection(db, 'addons'), {
        ...d, active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    toast(`Seeded ${DEFAULTS.length} add-ons`);
    loadAddons();
  } catch (err) {
    toast('Seed failed: ' + (err.code || err.message), true);
  }
}
