import { db, storage, $, $$, toast, escapeHtml } from '../admin.js';
import { collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, orderBy, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, deleteObject }
  from "https://www.gstatic.com/firebasejs/12.12.1/firebase-storage.js";

let currentTab  = 'sameday';
let editingId   = null;
let pendingFile = null;
// Gallery state — additional photos beyond the main product image
let existingGallery = [];   // [{ url, path }] already saved on the doc
let pendingGallery  = [];   // [{ file, previewUrl }] selected but not yet uploaded
let removedGallery  = [];   // [{ url, path }] removed during this edit, to clean up Storage on save
const MAX_GALLERY = 4;

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
            <label>Main photo *</label>
            <label class="image-drop" id="image-drop">
              <input name="image" type="file" accept="image/*"/>
              <div class="hint">Click to choose the main photo (or drag &amp; drop)<br/>JPG / PNG, under 5 MB</div>
              <div class="image-preview" id="image-preview" hidden></div>
            </label>
          </div>

          <div class="field">
            <label>Additional photos <span style="font-size:12px; color:var(--subtle); text-transform:none; letter-spacing:0">— up to ${MAX_GALLERY}, shown as thumbnails on the detail page</span></label>
            <div class="gallery-strip" id="gallery-strip"></div>
            <input type="file" id="gallery-input" accept="image/*" multiple hidden/>
            <div style="margin-top:6px; font-size:12px; color:var(--subtle)">Lifestyle shots (people holding the bouquet, in a vase at home) build trust 2× more than studio shots alone.</div>
          </div>

          <div class="field">
            <label>Description <span style="font-size:12px; color:var(--subtle); text-transform:none; letter-spacing:0">— 2–4 sentences shown on the detail page</span></label>
            <textarea name="description" rows="4" placeholder="Hand-tied this morning at Flemington Market. Soft pinks balanced with crisp white tulips and a touch of eucalyptus. Pairs beautifully with a chilled Hunter Valley rosé." style="width:100%; padding:10px 12px; border:1px solid var(--border); border-radius:6px; font-family:inherit; font-size:14px; line-height:1.5"></textarea>
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

  // Main image upload UX
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

  // Gallery (additional photos) upload UX
  $('#gallery-input').addEventListener('change', (e) => {
    Array.from(e.target.files).forEach(handleGalleryFile);
    e.target.value = ''; // allow re-selecting same file
  });

  $('#product-form').addEventListener('submit', onSubmit);

  await loadProducts();
}

function handleGalleryFile(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) { toast('Only image files allowed.', true); return; }
  if (file.size > 5 * 1024 * 1024)     { toast('File too large (max 5 MB).', true); return; }
  if (existingGallery.length + pendingGallery.length >= MAX_GALLERY) {
    toast(`Max ${MAX_GALLERY} additional photos.`, true);
    return;
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
    pendingGallery.push({ file, previewUrl: ev.target.result });
    renderGalleryStrip();
  };
  reader.readAsDataURL(file);
}

function renderGalleryStrip() {
  const strip = $('#gallery-strip');
  if (!strip) return;
  const total = existingGallery.length + pendingGallery.length;
  const tiles = [
    ...existingGallery.map((g, i) => `
      <div class="gtile" data-kind="existing" data-i="${i}">
        <img src="${escapeHtml(g.url)}" alt=""/>
        <button type="button" class="gtile-x" aria-label="Remove">×</button>
      </div>`),
    ...pendingGallery.map((g, i) => `
      <div class="gtile" data-kind="pending" data-i="${i}">
        <img src="${g.previewUrl}" alt=""/>
        <span class="gtile-new">NEW</span>
        <button type="button" class="gtile-x" aria-label="Remove">×</button>
      </div>`),
  ];
  if (total < MAX_GALLERY) {
    tiles.push(`
      <button type="button" class="gtile-add" id="gtile-add">
        <span>+</span><span class="gtile-add-label">Add photo</span>
      </button>`);
  }
  strip.innerHTML = tiles.join('');

  strip.querySelectorAll('.gtile-x').forEach(b => {
    b.addEventListener('click', (e) => {
      e.preventDefault();
      const tile = e.target.closest('.gtile');
      const kind = tile.dataset.kind;
      const i    = Number(tile.dataset.i);
      if (kind === 'existing') {
        // Mark for Storage cleanup on save
        const removed = existingGallery.splice(i, 1)[0];
        if (removed) removedGallery.push(removed);
      } else {
        pendingGallery.splice(i, 1);
      }
      renderGalleryStrip();
    });
  });
  const addBtn = $('#gtile-add');
  if (addBtn) addBtn.addEventListener('click', () => $('#gallery-input').click());
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
  pendingGallery  = [];
  removedGallery  = [];
  existingGallery = Array.isArray(product?.gallery) ? product.gallery.map(g => ({ url: g.url, path: g.path })) : [];

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
    form.description.value = product.description || '';
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
  renderGalleryStrip();
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
      toast('Please add a main photo.', true);
      saveBtn.disabled = false; saveBtn.textContent = 'Save';
      return;
    }

    // Upload pending gallery photos
    if (pendingGallery.length) {
      saveBtn.textContent = `Uploading ${pendingGallery.length} photo${pendingGallery.length > 1 ? 's' : ''}…`;
      for (const g of pendingGallery) {
        const safeName = g.file.name.replace(/[^\w.-]/g, '_');
        const newPath = `products/gallery_${Date.now()}_${safeName}`;
        const r = ref(storage, newPath);
        await uploadBytes(r, g.file);
        const url = await getDownloadURL(r);
        existingGallery.push({ url, path: newPath });
      }
      pendingGallery = [];
    }

    // Delete photos that were removed during this edit session
    if (removedGallery.length) {
      await Promise.all(removedGallery.map(g =>
        g.path ? deleteObject(ref(storage, g.path)).catch(() => {}) : null
      ));
      removedGallery = [];
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
      gallery: existingGallery,
      description: form.description.value.trim(),
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
    // Read the doc first so we can clean up gallery photos in Storage too
    let gallery = [];
    try {
      const snap = await getDoc(doc(db, 'products', id));
      if (snap.exists()) gallery = Array.isArray(snap.data().gallery) ? snap.data().gallery : [];
    } catch { /* non-fatal */ }

    await deleteDoc(doc(db, 'products', id));
    if (imagePath) {
      try { await deleteObject(ref(storage, imagePath)); } catch (err) { /* ignore */ }
    }
    await Promise.all(gallery.map(g =>
      g.path ? deleteObject(ref(storage, g.path)).catch(() => {}) : null
    ));
    toast('Deleted');
    loadProducts();
  } catch (err) {
    toast('Delete failed: ' + (err.code || err.message), true);
  }
}
