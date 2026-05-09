/**
 * Daily prep journal — one entry per day.
 * Optimised for the 5 AM at Flemington workflow:
 *   1. Take photos on phone
 *   2. Open admin → Daily Prep → today (auto-created)
 *   3. Drop photos in (multi-select supported)
 *   4. Type 3 lines
 *   5. Toggle "Post to Instagram" → Publish
 *
 * Doc id = YYYY-MM-DD so each day is unique and easy to look up.
 */
import { db, storage, $, $$, toast, escapeHtml } from '../admin.js';
import { collection, doc, getDoc, setDoc, deleteDoc, getDocs, query, orderBy, limit, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, deleteObject }
  from "https://www.gstatic.com/firebasejs/12.12.1/firebase-storage.js";

const MAX_PHOTOS  = 10;
const MAX_BYTES   = 8 * 1024 * 1024;

// Working state
let editingDate     = null;        // YYYY-MM-DD currently being edited
let existingPhotos  = [];          // [{ url, path, caption, takenAt }]
let pendingPhotos   = [];          // [{ file, previewUrl, caption, takenAt }]
let removedPhotos   = [];          // [{ url, path }] — to delete from Storage on save

export async function render() {
  const container = $('#view-container');
  container.innerHTML = `
    <div class="action-bar">
      <span class="helper-text">A short photo journal — drop today's photos, type 3 lines, publish. Auto-creates SEO + IG cross-post.</span>
      <div style="display:flex; gap:8px">
        <button class="btn-secondary" id="btn-prep-today">📅 Today</button>
      </div>
    </div>

    <div id="prep-form-card"></div>

    <h3 style="margin:24px 0 10px; font-size:13px; letter-spacing:.14em; text-transform:uppercase; color:var(--subtle)">Recent entries</h3>
    <div id="prep-list" class="loading">Loading…</div>
  `;

  $('#btn-prep-today').addEventListener('click', () => loadEditor(todayStr()));

  await loadEditor(todayStr());
  await loadList();
}

/* ─── Today (or selected date) editor ─── */

async function loadEditor(dateStr) {
  editingDate     = dateStr;
  existingPhotos  = [];
  pendingPhotos   = [];
  removedPhotos   = [];

  // Try fetching the day's doc
  let data = null;
  try {
    const snap = await getDoc(doc(db, 'daily_prep', dateStr));
    if (snap.exists()) data = snap.data();
  } catch (err) {
    toast('Load failed: ' + err.message, true);
  }

  existingPhotos = Array.isArray(data?.photos)
    ? data.photos.map(p => ({ url: p.url, path: p.path, caption: p.caption || '' }))
    : [];

  renderEditor(dateStr, data);
}

function renderEditor(dateStr, data) {
  const card = $('#prep-form-card');
  const isToday = dateStr === todayStr();
  const isPublished = !!data?.publishedAt;
  const heading = isToday ? "Today's prep" : `Prep — ${humanDate(dateStr)}`;

  card.innerHTML = `
    <form id="prep-form" class="prep-form">
      <div class="prep-head">
        <div>
          <div style="font-size:11px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:var(--subtle)">${humanDate(dateStr)}</div>
          <h2 style="margin:2px 0 0; font-size:20px; font-weight:700; letter-spacing:-0.01em">${heading}</h2>
        </div>
        <div style="display:flex; gap:8px; align-items:center">
          ${isPublished ? '<span class="payment-pill p-success">PUBLISHED</span>' : '<span class="payment-pill p-pending">DRAFT</span>'}
          ${data?.igPosted ? '<span class="payment-pill p-success">✓ IG</span>' : ''}
        </div>
      </div>

      <div class="field-row">
        <div class="field" style="max-width:160px">
          <label>Time at market</label>
          <input name="marketTime" type="text" placeholder="5:42 AM" value="${escapeHtml(data?.marketTime || '')}"/>
          <div style="margin-top:4px; font-size:11px; color:var(--subtle)">Optional. Used in title.</div>
        </div>
        <div class="field" style="flex:1">
          <label>Location</label>
          <input name="location" type="text" placeholder="Flemington Markets" value="${escapeHtml(data?.location || 'Flemington Markets')}"/>
        </div>
      </div>

      <div class="field">
        <label>Photos <span style="font-size:12px; color:var(--subtle); text-transform:none; letter-spacing:0">— up to ${MAX_PHOTOS}, the first one becomes the cover</span></label>
        <div class="prep-photo-strip" id="prep-photo-strip"></div>
        <input type="file" id="prep-photo-input" accept="image/*" multiple hidden/>
      </div>

      <div class="field">
        <label>What happened today <span style="font-size:12px; color:var(--subtle); text-transform:none; letter-spacing:0">— 3-5 lines, casual tone</span></label>
        <textarea name="bodyText" rows="5" placeholder="Today the peonies looked stunning — Tony at stall 14A had just unpacked them. Picked up a bunch of eucalyptus too, and the white tulips were perfect. Back at the studio by 8 AM…"
          style="width:100%; padding:12px 14px; border:1px solid var(--border); border-radius:8px; font-family:inherit; font-size:14px; line-height:1.55">${escapeHtml(data?.bodyText || '')}</textarea>
      </div>

      <div class="field" style="display:flex; flex-direction:column; gap:10px">
        <label class="field-check"><input name="postToIG" type="checkbox" ${data?.postToIG !== false ? 'checked' : ''}/> Post to Instagram on publish</label>
        <label class="field-check"><input name="active" type="checkbox" ${data?.active !== false ? 'checked' : ''}/> Show on customer site</label>
      </div>

      <div class="prep-actions">
        ${isPublished ? `<button type="button" class="btn-danger" id="btn-prep-delete">Unpublish</button>` : ''}
        <button type="submit" class="btn-primary" id="btn-prep-save">${isPublished ? 'Update' : 'Publish'}</button>
      </div>
    </form>
  `;

  // Photo upload UX
  const fileInput = $('#prep-photo-input');
  fileInput.addEventListener('change', (e) => {
    Array.from(e.target.files).forEach(handlePhotoFile);
    e.target.value = '';
  });

  $('#prep-form').addEventListener('submit', onSubmit);
  if (isPublished) $('#btn-prep-delete').addEventListener('click', () => unpublishPrep(dateStr));

  renderPhotoStrip();
}

function renderPhotoStrip() {
  const strip = $('#prep-photo-strip');
  if (!strip) return;
  const total = existingPhotos.length + pendingPhotos.length;
  const tiles = [
    ...existingPhotos.map((p, i) => `
      <div class="ptile" data-kind="existing" data-i="${i}">
        <img src="${escapeHtml(p.url)}" alt="" loading="lazy"/>
        <button type="button" class="ptile-x" aria-label="Remove">×</button>
        ${i === 0 ? '<span class="ptile-cover">COVER</span>' : ''}
      </div>`),
    ...pendingPhotos.map((p, i) => `
      <div class="ptile" data-kind="pending" data-i="${i}">
        <img src="${p.previewUrl}" alt=""/>
        <span class="ptile-new">NEW</span>
        <button type="button" class="ptile-x" aria-label="Remove">×</button>
      </div>`),
  ];
  if (total < MAX_PHOTOS) {
    tiles.push(`
      <button type="button" class="ptile-add" id="ptile-add">
        <span style="font-size:28px; line-height:1; font-weight:300">+</span>
        <span style="font-size:11px; letter-spacing:.04em">Add photos</span>
      </button>`);
  }
  strip.innerHTML = tiles.join('');

  strip.querySelectorAll('.ptile-x').forEach(b => {
    b.addEventListener('click', (e) => {
      e.preventDefault();
      const tile = e.target.closest('.ptile');
      const kind = tile.dataset.kind;
      const i    = Number(tile.dataset.i);
      if (kind === 'existing') {
        const removed = existingPhotos.splice(i, 1)[0];
        if (removed) removedPhotos.push(removed);
      } else {
        pendingPhotos.splice(i, 1);
      }
      renderPhotoStrip();
    });
  });
  const addBtn = $('#ptile-add');
  if (addBtn) addBtn.addEventListener('click', () => $('#prep-photo-input').click());
}

function handlePhotoFile(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) { toast('Only image files allowed.', true); return; }
  if (file.size > MAX_BYTES)           { toast(`File too large (max ${MAX_BYTES / 1024 / 1024} MB).`, true); return; }
  if (existingPhotos.length + pendingPhotos.length >= MAX_PHOTOS) {
    toast(`Max ${MAX_PHOTOS} photos.`, true);
    return;
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
    pendingPhotos.push({ file, previewUrl: ev.target.result, caption: '' });
    renderPhotoStrip();
  };
  reader.readAsDataURL(file);
}

async function onSubmit(e) {
  e.preventDefault();
  const f = e.target;
  const btn = $('#btn-prep-save');
  btn.disabled = true; btn.textContent = 'Saving…';
  try {
    // 1. Validate at least one photo
    if (existingPhotos.length + pendingPhotos.length === 0) {
      toast('Please add at least one photo.', true);
      btn.disabled = false; btn.textContent = 'Publish';
      return;
    }

    // 2. Upload pending photos
    if (pendingPhotos.length) {
      btn.textContent = `Uploading ${pendingPhotos.length} photo${pendingPhotos.length > 1 ? 's' : ''}…`;
      for (const p of pendingPhotos) {
        const safeName = p.file.name.replace(/[^\w.-]/g, '_');
        const newPath  = `daily_prep/${editingDate}_${Date.now()}_${safeName}`;
        const r = ref(storage, newPath);
        await uploadBytes(r, p.file);
        const url = await getDownloadURL(r);
        existingPhotos.push({ url, path: newPath, caption: '' });
      }
      pendingPhotos = [];
    }

    // 3. Delete photos removed during this session
    if (removedPhotos.length) {
      await Promise.all(removedPhotos.map(p =>
        p.path ? deleteObject(ref(storage, p.path)).catch(() => {}) : null
      ));
      removedPhotos = [];
    }

    // 4. Build doc
    const data = {
      date:        editingDate,
      marketTime:  f.marketTime.value.trim(),
      location:    f.location.value.trim() || 'Flemington Markets',
      bodyText:    f.bodyText.value.trim(),
      photos:      existingPhotos,
      active:      f.active.checked,
      postToIG:    f.postToIG.checked,
      publishedAt: serverTimestamp(),
      updatedAt:   serverTimestamp(),
    };

    btn.textContent = 'Saving…';
    await setDoc(doc(db, 'daily_prep', editingDate), data, { merge: true });
    toast('Published');

    // Reload to show "PUBLISHED" status etc
    await loadEditor(editingDate);
    await loadList();
  } catch (err) {
    console.error(err);
    toast('Save failed: ' + (err.code || err.message), true);
  } finally {
    btn.disabled = false; btn.textContent = 'Publish';
  }
}

async function unpublishPrep(dateStr) {
  if (!confirm(`Unpublish prep for ${humanDate(dateStr)}? Photos in storage will be deleted too.`)) return;
  try {
    // Delete photos from Storage
    await Promise.all(existingPhotos.map(p =>
      p.path ? deleteObject(ref(storage, p.path)).catch(() => {}) : null
    ));
    await deleteDoc(doc(db, 'daily_prep', dateStr));
    toast('Unpublished');
    await loadEditor(dateStr);
    await loadList();
  } catch (err) {
    toast('Delete failed: ' + (err.code || err.message), true);
  }
}

/* ─── Recent entries list ─── */

async function loadList() {
  const list = $('#prep-list');
  list.className = 'loading';
  list.innerHTML = 'Loading…';
  try {
    const snap = await getDocs(query(collection(db, 'daily_prep'), orderBy('date', 'desc'), limit(20)));
    const items = [];
    snap.forEach(d => items.push({ id: d.id, ...d.data() }));
    list.className = '';
    if (!items.length) {
      list.innerHTML = `<div class="placeholder"><h2>No entries yet</h2><p>The form above creates today's entry. Each day is its own document.</p></div>`;
      return;
    }
    list.innerHTML = '<div class="olist">' + items.map(p => {
      const cover = (p.photos && p.photos[0]?.url) || '';
      const isToday = p.id === todayStr();
      return `
      <div class="orow" data-id="${p.id}">
        ${cover ? `<img src="${escapeHtml(cover)}" alt="" style="width:64px; height:64px; object-fit:cover; border-radius:6px; border:1px solid var(--border); flex-shrink:0"/>` : `<div class="o-num">📅</div>`}
        <div class="o-main">
          <div class="o-cust">
            ${humanDate(p.id)}
            ${isToday ? '<span class="payment-pill p-success" style="margin-left:8px">TODAY</span>' : ''}
            ${p.active === false ? '<span class="payment-pill p-pending" style="margin-left:8px">HIDDEN</span>' : ''}
            ${p.igPosted ? '<span class="payment-pill p-success" style="margin-left:8px">✓ IG</span>' : ''}
          </div>
          <div class="o-meta" style="margin-top:4px">
            ${p.marketTime ? escapeHtml(p.marketTime) + ' · ' : ''}${escapeHtml((p.bodyText || '').slice(0, 100))}${(p.bodyText || '').length > 100 ? '…' : ''}
          </div>
          <div class="o-meta" style="margin-top:4px; font-size:12px; color:var(--subtle)">
            📷 ${p.photos?.length || 0} photo${p.photos?.length === 1 ? '' : 's'}
          </div>
        </div>
        <div style="display:flex; gap:6px; align-items:center">
          <button class="btn-secondary btn-edit-prep" data-id="${p.id}">Edit</button>
        </div>
      </div>`;
    }).join('') + '</div>';
    list.querySelectorAll('.btn-edit-prep').forEach(b =>
      b.addEventListener('click', () => loadEditor(b.dataset.id)));
  } catch (err) {
    list.className = '';
    list.innerHTML = `<div class="placeholder"><h2>Load failed</h2><p>${escapeHtml(err.message)}</p></div>`;
    console.error(err);
  }
}

/* ─── Helpers ─── */

function todayStr() {
  // Sydney-local YYYY-MM-DD
  const d = new Date();
  return d.toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' }); // en-CA → YYYY-MM-DD format
}

function humanDate(yyyymmdd) {
  const [y, m, d] = yyyymmdd.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}
