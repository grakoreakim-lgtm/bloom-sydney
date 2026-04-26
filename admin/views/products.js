import { db, storage, $, $$, toast, escapeHtml } from '../admin.js';
import { collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, orderBy, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, deleteObject }
  from "https://www.gstatic.com/firebasejs/12.12.1/firebase-storage.js";

let currentTab  = 'sameday';
let editingId   = null;
let pendingFile = null;

export async function render() {
  const container = $('#view-container');
  container.innerHTML = `
    <div class="tabs">
      <button class="tab on" data-tab="sameday">Same-Day</button>
      <button class="tab"    data-tab="preorder">Pre-Order</button>
    </div>

    <div class="action-bar">
      <span class="helper-text">Products in the active tab appear on the customer page.</span>
      <button class="btn-primary" id="btn-add">+ New product</button>
    </div>

    <div id="product-list" class="loading">Loading…</div>

    <div class="modal-overlay" id="form-modal" hidden>
      <div class="modal">
        <h2 id="form-title">New product</h2>
        <form id="product-form">

          <div class="field-row">
            <div class="field">
              <label>Tab</label>
              <select name="tab">
                <option value="sameday">Same-Day</option>
                <option value="preorder">Pre-Order</option>
              </select>
            </div>
            <div class="field">
              <label>Label / Tag</label>
              <input name="type" type="text" placeholder="TODAY · CARLINGFORD" required/>
            </div>
          </div>

          <div class="field">
            <label>Product name</label>
            <input name="name" type="text" placeholder="White Tulip Bunch" required/>
          </div>

          <div class="field">
            <label>Wine pairing (optional)</label>
            <input name="pair" type="text" placeholder="Hunter Valley Rosé"/>
          </div>

          <div class="field-row">
            <div class="field">
              <label>Price (AUD)</label>
              <input name="price" type="number" min="0" step="1" required/>
            </div>
            <div class="field">
              <label>Wine-included price (optional)</label>
              <input name="wine" type="number" min="0" step="1"/>
            </div>
          </div>

          <div class="field-row">
            <div class="field">
              <label>Stock</label>
              <input name="stock" type="number" min="0" step="1" required value="0"/>
            </div>
            <div class="field" style="display:flex; flex-direction:column; gap:6px; padding-top:18px;">
              <label class="field-check"><input name="hasWine" type="checkbox"/> Show wine-pairing badge</label>
              <label class="field-check"><input name="sold"    type="checkbox"/> Mark as sold out</label>
            </div>
          </div>

          <div class="field">
            <label>Photo</label>
            <label class="image-drop" id="image-drop">
              <input name="image" type="file" accept="image/*"/>
              <div class="hint">Click to choose a photo (or drag &amp; drop)<br/>JPG / PNG, under 1 MB recommended</div>
              <div class="image-preview" id="image-preview" hidden></div>
            </label>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-secondary" id="btn-cancel">Cancel</button>
            <button type="submit" class="btn-primary"   id="btn-save">Save</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Tab switch
  $$('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      currentTab = btn.dataset.tab;
      $$('.tab').forEach(b => b.classList.toggle('on', b === btn));
      loadProducts();
    });
  });

  $('#btn-add').addEventListener('click', () => openForm(null));
  $('#btn-cancel').addEventListener('click', () => $('#form-modal').hidden = true);

  // Image upload UX
  const drop = $('#image-drop');
  const fileInput = drop.querySelector('input[type=file]');
  fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
  ['dragenter','dragover'].forEach(ev =>
    drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave','drop'].forEach(ev =>
    drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', e => {
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  });

  $('#product-form').addEventListener('submit', onSubmit);

  await loadProducts();
}

async function loadProducts() {
  const list = $('#product-list');
  list.className = 'loading';
  list.innerHTML = 'Loading…';
  try {
    const snap = await getDocs(query(collection(db, 'products'), orderBy('sortOrder', 'asc')));
    const items = [];
    snap.forEach(d => {
      const data = d.data();
      if ((data.tab || 'sameday') === currentTab) items.push({ id: d.id, ...data });
    });
    list.className = '';
    if (!items.length) {
      list.innerHTML = '<div class="placeholder"><h2>No products yet</h2><p>Click <strong>+ New product</strong> to add one.</p></div>';
      return;
    }
    list.innerHTML = items.map(p => `
      <div class="prow">
        <img class="thumb" src="${p.imageUrl || ''}" alt=""/>
        <div>
          <div class="pname">${escapeHtml(p.name)}</div>
          <div class="ptype">${escapeHtml(p.type || '')}</div>
          <div class="pmeta">
            $${p.price}${p.wine ? ' · with wine $' + p.wine : ''}
            · ${p.sold ? '<span class="sold-tag">SOLD OUT</span>' : (p.stock + ' in stock')}
          </div>
        </div>
        <div class="actions">
          <button class="btn-secondary btn-edit" data-id="${p.id}">Edit</button>
          <button class="btn-danger    btn-del"  data-id="${p.id}" data-path="${p.imagePath || ''}">Delete</button>
        </div>
      </div>
    `).join('');
    list.querySelectorAll('.btn-edit').forEach(b =>
      b.addEventListener('click', () => editProduct(b.dataset.id)));
    list.querySelectorAll('.btn-del').forEach(b =>
      b.addEventListener('click', () => deleteProduct(b.dataset.id, b.dataset.path)));
  } catch (err) {
    list.className = '';
    list.innerHTML = `<div class="placeholder"><h2>Load failed</h2><p>${escapeHtml(err.message)}</p></div>`;
    console.error(err);
  }
}

async function editProduct(id) {
  try {
    const snap = await getDoc(doc(db, 'products', id));
    if (snap.exists()) openForm({ id: snap.id, ...snap.data() });
  } catch (err) {
    toast('Failed to load product: ' + err.message, true);
  }
}

function openForm(product) {
  editingId   = product?.id || null;
  pendingFile = null;
  const form  = $('#product-form');
  form.reset();
  $('#form-title').textContent = product ? 'Edit product' : 'New product';
  const preview = $('#image-preview');
  preview.hidden = true; preview.innerHTML = '';

  if (product) {
    form.tab.value   = product.tab || 'sameday';
    form.type.value  = product.type || '';
    form.name.value  = product.name || '';
    form.pair.value  = product.pair || '';
    form.price.value = product.price ?? '';
    form.wine.value  = product.wine  ?? '';
    form.stock.value = product.stock ?? 0;
    form.hasWine.checked = !!product.hasWine;
    form.sold.checked    = !!product.sold;
    if (product.imageUrl) {
      preview.hidden = false;
      preview.innerHTML = `<img src="${product.imageUrl}"/><span class="ipname">Current photo (upload to replace)</span>`;
    }
    form.dataset.imageUrl  = product.imageUrl  || '';
    form.dataset.imagePath = product.imagePath || '';
    form.dataset.sortOrder = product.sortOrder ?? 0;
  } else {
    form.tab.value = currentTab;
    form.dataset.imageUrl  = '';
    form.dataset.imagePath = '';
    form.dataset.sortOrder = '';
  }
  $('#form-modal').hidden = false;
}

function handleFile(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) { toast('Only image files allowed.', true); return; }
  pendingFile = file;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const preview = $('#image-preview');
    preview.hidden = false;
    preview.innerHTML = `<img src="${ev.target.result}"/><span class="ipname">${escapeHtml(file.name)} (${(file.size/1024).toFixed(0)} KB)</span>`;
  };
  reader.readAsDataURL(file);
}

async function onSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const saveBtn = $('#btn-save');
  saveBtn.disabled = true; saveBtn.textContent = 'Saving…';
  try {
    let imageUrl  = form.dataset.imageUrl  || '';
    let imagePath = form.dataset.imagePath || '';

    if (pendingFile) {
      saveBtn.textContent = 'Uploading photo…';
      const safeName = pendingFile.name.replace(/[^\w.-]/g, '_');
      const newPath = `products/${Date.now()}_${safeName}`;
      const r = ref(storage, newPath);
      await uploadBytes(r, pendingFile);
      const newUrl = await getDownloadURL(r);
      if (imagePath && imagePath !== newPath) {
        try { await deleteObject(ref(storage, imagePath)); } catch (err) { /* ignore */ }
      }
      imageUrl  = newUrl;
      imagePath = newPath;
    }

    if (!imageUrl) {
      toast('Please add a photo.', true);
      saveBtn.disabled = false; saveBtn.textContent = 'Save';
      return;
    }

    const data = {
      tab:     form.tab.value,
      type:    form.type.value.trim(),
      name:    form.name.value.trim(),
      pair:    form.pair.value.trim(),
      price:   Number(form.price.value),
      stock:   Number(form.stock.value),
      hasWine: form.hasWine.checked,
      sold:    form.sold.checked,
      imageUrl,
      imagePath,
      sortOrder: form.dataset.sortOrder !== '' ? Number(form.dataset.sortOrder) : Date.now(),
      updatedAt: serverTimestamp(),
    };
    if (form.wine.value !== '') data.wine = Number(form.wine.value);

    saveBtn.textContent = 'Saving…';
    if (editingId) {
      await updateDoc(doc(db, 'products', editingId), data);
      toast('Updated');
    } else {
      data.createdAt = serverTimestamp();
      await addDoc(collection(db, 'products'), data);
      toast('Product added');
    }
    $('#form-modal').hidden = true;
    loadProducts();
  } catch (err) {
    console.error(err);
    toast('Save failed: ' + (err.code || err.message), true);
  } finally {
    saveBtn.disabled = false; saveBtn.textContent = 'Save';
  }
}

async function deleteProduct(id, imagePath) {
  if (!confirm('Delete this product? This cannot be undone.')) return;
  try {
    await deleteDoc(doc(db, 'products', id));
    if (imagePath) {
      try { await deleteObject(ref(storage, imagePath)); } catch (err) { /* ignore */ }
    }
    toast('Deleted');
    loadProducts();
  } catch (err) {
    toast('Delete failed: ' + (err.code || err.message), true);
  }
}
