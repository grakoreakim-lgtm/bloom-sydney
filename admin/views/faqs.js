import { db, $, $$, toast, escapeHtml } from '../admin.js';
import { collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, orderBy, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

let editingId = null;

export async function render() {
  const container = $('#view-container');
  container.innerHTML = `
    <div class="action-bar">
      <span class="helper-text">FAQs appear at the bottom of the customer page and are automatically published as Google FAQ-rich-results (JSON-LD).</span>
      <div style="display:flex; gap:8px">
        <button class="btn-secondary" id="btn-seed-faq">🌱 Seed defaults</button>
        <button class="btn-primary" id="btn-add-faq">+ New FAQ</button>
      </div>
    </div>

    <div id="faq-list" class="loading">Loading…</div>

    <div class="modal-overlay" id="faq-modal" hidden>
      <div class="modal modal-wide">
        <h2 id="faq-form-title">New FAQ</h2>
        <form id="faq-form">
          <div class="field">
            <label>Question *</label>
            <input name="question" type="text" required placeholder="What time do I need to order for same-day delivery?"/>
          </div>
          <div class="field">
            <label>Answer * <span style="font-size:12px; color:var(--subtle); text-transform:none; letter-spacing:0">— HTML allowed (e.g., &lt;strong&gt;)</span></label>
            <textarea name="answer" rows="5" required style="width:100%; padding:10px 12px; border:1px solid var(--border); border-radius:6px; font-family:inherit"></textarea>
          </div>
          <div class="field-row">
            <div class="field">
              <label>Sort order</label>
              <input name="sortOrder" type="number" step="1" placeholder="auto"/>
            </div>
            <div class="field" style="display:flex; align-items:center; padding-top:18px">
              <label class="field-check"><input name="active" type="checkbox" checked/> Active (show on customer site)</label>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" id="btn-faq-cancel">Cancel</button>
            <button type="submit" class="btn-primary" id="btn-faq-save">Save</button>
          </div>
        </form>
      </div>
    </div>
  `;

  $('#btn-add-faq').addEventListener('click', () => openForm(null));
  $('#btn-seed-faq').addEventListener('click', seedDefaults);
  $('#btn-faq-cancel').addEventListener('click', () => $('#faq-modal').hidden = true);
  $('#faq-form').addEventListener('submit', onSubmit);

  await loadFaqs();
}

async function loadFaqs() {
  const list = $('#faq-list');
  list.className = 'loading';
  list.innerHTML = 'Loading…';
  try {
    const snap = await getDocs(query(collection(db, 'faqs'), orderBy('sortOrder', 'asc')));
    const items = [];
    snap.forEach(d => items.push({ id: d.id, ...d.data() }));
    list.className = '';
    if (!items.length) {
      list.innerHTML = `
        <div class="placeholder">
          <h2>No FAQs yet</h2>
          <p>Click <strong>🌱 Seed defaults</strong> to populate with 8 standard florist FAQs,<br/>or <strong>+ New FAQ</strong> to add custom ones.</p>
        </div>`;
      return;
    }
    list.innerHTML = '<div class="olist">' + items.map((f, i) => `
      <div class="orow" data-id="${f.id}">
        <div class="o-num">#${(i + 1).toString().padStart(2, '0')}</div>
        <div class="o-main">
          <div class="o-cust">
            ${escapeHtml(f.question)}
            ${f.active === false ? '<span class="payment-pill p-pending" style="margin-left:8px">HIDDEN</span>' : ''}
          </div>
          <div class="o-meta" style="margin-top:6px; line-height:1.5">${escapeHtml((f.answer || '').replace(/<[^>]+>/g, '').slice(0, 150))}${(f.answer || '').length > 150 ? '…' : ''}</div>
        </div>
        <div style="display:flex; gap:6px">
          <button class="btn-secondary btn-edit-faq" data-id="${f.id}">Edit</button>
          <button class="btn-danger btn-del-faq" data-id="${f.id}">Delete</button>
        </div>
      </div>
    `).join('') + '</div>';
    list.querySelectorAll('.btn-edit-faq').forEach(b =>
      b.addEventListener('click', () => editFaq(b.dataset.id)));
    list.querySelectorAll('.btn-del-faq').forEach(b =>
      b.addEventListener('click', () => deleteFaq(b.dataset.id)));
  } catch (err) {
    list.className = '';
    list.innerHTML = `<div class="placeholder"><h2>Load failed</h2><p>${escapeHtml(err.message)}</p></div>`;
    console.error(err);
  }
}

async function editFaq(id) {
  try {
    const snap = await getDoc(doc(db, 'faqs', id));
    if (snap.exists()) openForm({ id: snap.id, ...snap.data() });
  } catch (err) { toast('Load failed: ' + err.message, true); }
}

function openForm(f) {
  editingId = f?.id || null;
  const form = $('#faq-form');
  form.reset();
  $('#faq-form-title').textContent = f ? 'Edit FAQ' : 'New FAQ';
  if (f) {
    form.question.value  = f.question || '';
    form.answer.value    = f.answer || '';
    form.sortOrder.value = f.sortOrder ?? '';
    form.active.checked  = f.active !== false;
  } else {
    form.active.checked = true;
  }
  $('#faq-modal').hidden = false;
}

async function onSubmit(e) {
  e.preventDefault();
  const f = e.target;
  const btn = $('#btn-faq-save');
  btn.disabled = true; btn.textContent = 'Saving…';
  try {
    const data = {
      question:  f.question.value.trim(),
      answer:    f.answer.value.trim(),
      sortOrder: f.sortOrder.value !== '' ? Number(f.sortOrder.value) : Date.now(),
      active:    f.active.checked,
      updatedAt: serverTimestamp(),
    };
    if (editingId) {
      await updateDoc(doc(db, 'faqs', editingId), data);
      toast('Updated');
    } else {
      data.createdAt = serverTimestamp();
      await addDoc(collection(db, 'faqs'), data);
      toast('FAQ added');
    }
    $('#faq-modal').hidden = true;
    loadFaqs();
  } catch (err) {
    toast('Save failed: ' + (err.code || err.message), true);
  } finally {
    btn.disabled = false; btn.textContent = 'Save';
  }
}

async function deleteFaq(id) {
  if (!confirm('Delete this FAQ?')) return;
  try {
    await deleteDoc(doc(db, 'faqs', id));
    toast('Deleted');
    loadFaqs();
  } catch (err) { toast('Delete failed: ' + err.message, true); }
}

const DEFAULTS = [
  { question:'What time do I need to order for same-day delivery?',
    answer:'Orders placed before <strong>1:00 PM Mon–Sat</strong> receive same-day delivery across North-West Sydney. Orders after 1 PM are scheduled for the next available day. You\'ll receive a text when your arrangement leaves our Carlingford studio.' },
  { question:'How is wine delivered with the flowers?',
    answer:'Wine is packed in a temperature-protected sleeve. We require a signature and photo ID (18+) at delivery. We hold a current NSW Packaged Liquor Licence — license number is shown in our footer.' },
  { question:'What areas do you currently deliver to?',
    answer:'North-West Sydney: <strong>Carlingford (free), Epping, Eastwood, Macquarie Park, Ryde, North Rocks</strong>. Enter your postcode at checkout to see your exact delivery fee.' },
  { question:'Can I pre-order for a future date?',
    answer:'Yes — our pre-order calendar publishes 7 days ahead every morning at 6 AM. Free cancellation up to 48 hours before delivery. Perfect for anniversaries, birthdays, and gifts you want locked in.' },
  { question:'Do the photos show the actual flowers being sold?',
    answer:'Always. Every product photo is taken that same morning of the actual flowers in our Carlingford studio. We never use stock photography — what you see is what arrives.' },
  { question:'What if my flowers arrive damaged?',
    answer:'Send us a photo within <strong>24 hours of delivery</strong> and we\'ll arrange a free replacement or full refund — no questions asked.' },
  { question:'Can I include a personalized card message?',
    answer:'Yes. Add your message at checkout (up to 200 characters). We hand-write each card on quality stock paper for a personal touch.' },
  { question:'How do I keep my flowers fresh longer?',
    answer:'Trim 2cm off the stems at a 45° angle when you receive them, change the water every 2 days, and keep them away from direct sunlight, fruit, and heating vents. Most arrangements stay beautiful for 5–7 days.' },
];

async function seedDefaults() {
  if (!confirm('Add 8 default florist FAQs? You can edit or delete each one afterwards.')) return;
  try {
    for (let i = 0; i < DEFAULTS.length; i++) {
      await addDoc(collection(db, 'faqs'), {
        ...DEFAULTS[i],
        sortOrder: i,
        active:    true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    toast('Seeded 8 FAQs');
    loadFaqs();
  } catch (err) {
    toast('Seed failed: ' + (err.code || err.message), true);
  }
}
