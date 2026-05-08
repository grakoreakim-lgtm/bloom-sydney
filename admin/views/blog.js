import { db, storage, $, $$, toast, escapeHtml } from '../admin.js';
import { collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, orderBy, serverTimestamp, Timestamp }
  from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, deleteObject }
  from "https://www.gstatic.com/firebasejs/12.12.1/firebase-storage.js";

let pendingFile = null;

const CATEGORIES = [
  { key: 'care',       label: 'Flower care' },
  { key: 'pairing',    label: 'Wine pairing' },
  { key: 'gift-guide', label: 'Gift guide' },
  { key: 'story',      label: 'Behind the scenes' },
  { key: 'wedding',    label: 'Weddings & events' },
  { key: 'other',      label: 'Other' },
];

let editingId = null;

export async function render() {
  const container = $('#view-container');
  container.innerHTML = `
    <div class="action-bar">
      <span class="helper-text">Blog stories drive Google search traffic. Each post is published to <code>/blog/?slug=...</code> with proper SEO tags + JSON-LD Article schema.</span>
      <div style="display:flex; gap:8px">
        <button class="btn-secondary" id="btn-seed-blog">🌱 Seed 5 starter posts</button>
        <button class="btn-primary"   id="btn-add-blog">+ New post</button>
      </div>
    </div>

    <div id="blog-list" class="loading">Loading…</div>

    <div class="modal-overlay" id="blog-modal" hidden>
      <div class="modal modal-wide">
        <h2 id="blog-form-title">New post</h2>
        <form id="blog-form">

          <div class="field">
            <label>Title *</label>
            <input name="title" type="text" required placeholder="How to Keep Your Flowers Fresh for 7+ Days"/>
            <div style="margin-top:6px; font-size:12px; color:var(--subtle)">Use <code>[em]…[/em]</code> around words to italicise (e.g. <code>How to keep flowers [em]fresh[/em] longer</code>).</div>
          </div>

          <div class="field-row">
            <div class="field">
              <label>URL slug *</label>
              <input name="slug" type="text" required placeholder="how-to-keep-flowers-fresh"/>
              <div style="margin-top:4px; font-size:12px; color:var(--subtle)">URL-friendly: lowercase, hyphens, no spaces.</div>
            </div>
            <div class="field">
              <label>Category</label>
              <select name="category">
                ${CATEGORIES.map(c => `<option value="${c.key}">${c.label}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="field">
            <label>Excerpt * <span style="font-size:12px; color:var(--subtle); text-transform:none; letter-spacing:0">— shown on cards (1–2 sentences)</span></label>
            <textarea name="excerpt" rows="2" required style="width:100%; padding:10px 12px; border:1px solid var(--border); border-radius:6px; font-family:inherit"></textarea>
          </div>

          <div class="field">
            <label>Cover image</label>
            <label class="image-drop" id="blog-image-drop">
              <input name="image" type="file" accept="image/*"/>
              <div class="hint">Click to upload a cover image (or drag &amp; drop)<br/>JPG / PNG, under 5 MB</div>
              <div class="image-preview" id="blog-image-preview" hidden></div>
            </label>
            <div style="margin-top:8px">
              <input name="coverImage" type="url" placeholder="…or paste an image URL (e.g. https://images.unsplash.com/...)" style="width:100%; padding:10px 12px; border:1px solid var(--border); border-radius:6px; font-family:inherit; font-size:13px"/>
              <div style="margin-top:4px; font-size:12px; color:var(--subtle)">Uploading a file overrides this URL.</div>
            </div>
          </div>

          <div class="field-row">
            <div class="field">
              <label>Author</label>
              <input name="author" type="text" placeholder="Ji-sun, Founder"/>
            </div>
            <div class="field">
              <label>Published date</label>
              <input name="publishedDate" type="date"/>
            </div>
          </div>

          <div class="field">
            <label>Body content * <span style="font-size:12px; color:var(--subtle); text-transform:none; letter-spacing:0">— HTML allowed: &lt;h2&gt; &lt;p&gt; &lt;ul&gt; &lt;li&gt; &lt;strong&gt; &lt;em&gt; &lt;a&gt; &lt;blockquote&gt;</span></label>
            <textarea name="content" rows="14" required style="width:100%; padding:12px; border:1px solid var(--border); border-radius:6px; font-family:ui-monospace, Menlo, monospace; font-size:13px; line-height:1.5"></textarea>
          </div>

          <div class="field">
            <label>SEO meta description <span style="font-size:12px; color:var(--subtle); text-transform:none; letter-spacing:0">— 140–160 chars, shown in Google results</span></label>
            <textarea name="metaDescription" rows="2" style="width:100%; padding:10px 12px; border:1px solid var(--border); border-radius:6px; font-family:inherit"></textarea>
          </div>

          <div class="field">
            <label class="field-check"><input name="active" type="checkbox" checked/> Published (visible on customer site)</label>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-secondary" id="btn-blog-cancel">Cancel</button>
            <a id="btn-blog-preview" class="btn-secondary" target="_blank" style="display:none">Preview ↗</a>
            <button type="submit" class="btn-primary" id="btn-blog-save">Save</button>
          </div>
        </form>
      </div>
    </div>
  `;

  $('#btn-add-blog').addEventListener('click', () => openForm(null));
  $('#btn-seed-blog').addEventListener('click', seedDefaults);
  $('#btn-blog-cancel').addEventListener('click', () => $('#blog-modal').hidden = true);
  $('#blog-form').addEventListener('submit', onSubmit);

  // Cover-image upload (drag & drop + click)
  const drop = $('#blog-image-drop');
  const fileInput = drop.querySelector('input[type=file]');
  fileInput.addEventListener('change', (e) => handleBlogFile(e.target.files[0]));
  ['dragenter','dragover'].forEach(ev =>
    drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave','drop'].forEach(ev =>
    drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', e => {
    const f = e.dataTransfer.files[0];
    if (f) handleBlogFile(f);
  });

  // Auto-slug from title when slug field is empty
  $('#blog-form [name=title]').addEventListener('input', (e) => {
    const slug = $('#blog-form [name=slug]');
    if (!slug.dataset.touched) slug.value = slugify(e.target.value);
  });
  $('#blog-form [name=slug]').addEventListener('input', (e) => {
    e.target.dataset.touched = '1';
  });

  await loadPosts();
}

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\[em\]|\[\/em\]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

const CAT_LABEL = Object.fromEntries(CATEGORIES.map(c => [c.key, c.label]));

async function loadPosts() {
  const list = $('#blog-list');
  list.className = 'loading';
  list.innerHTML = 'Loading…';
  try {
    const snap = await getDocs(query(collection(db, 'blog'), orderBy('publishedAt', 'desc')));
    const items = [];
    snap.forEach(d => items.push({ id: d.id, ...d.data() }));
    list.className = '';
    if (!items.length) {
      list.innerHTML = `
        <div class="placeholder">
          <h2>No posts yet</h2>
          <p>Click <strong>🌱 Seed 5 starter posts</strong> to populate the blog with Sydney-florist content,<br/>or <strong>+ New post</strong> to write your own.</p>
        </div>`;
      return;
    }
    list.innerHTML = '<div class="olist">' + items.map(p => `
      <div class="orow" data-id="${p.id}">
        ${p.coverImage ? `<img src="${escapeHtml(p.coverImage)}" alt="" style="width:64px; height:64px; object-fit:cover; border-radius:6px; border:1px solid var(--border); flex-shrink:0"/>` : `<div class="o-num" style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--accent)">${escapeHtml(CAT_LABEL[p.category] || p.category || '')}</div>`}
        <div class="o-main">
          <div class="o-cust">${escapeHtml(p.title || 'Untitled')} ${p.active === false ? '<span class="payment-pill p-pending" style="margin-left:8px">DRAFT</span>' : ''}</div>
          <div class="o-meta" style="margin-top:4px">${escapeHtml(p.excerpt || '').slice(0,140)}${(p.excerpt || '').length > 140 ? '…' : ''}</div>
          <div class="o-meta" style="margin-top:4px; font-size:12px; color:var(--subtle)">${escapeHtml(CAT_LABEL[p.category] || p.category || '')} · /blog/?slug=${escapeHtml(p.slug || '')} · ${formatDate(p.publishedAt)}</div>
        </div>
        <div style="display:flex; gap:6px; align-items:center">
          <a class="btn-secondary" href="../../blog/?slug=${encodeURIComponent(p.slug || '')}" target="_blank">View</a>
          <button class="btn-secondary btn-edit-post" data-id="${p.id}">Edit</button>
          <button class="btn-danger btn-del-post"  data-id="${p.id}" data-path="${p.coverImagePath || ''}">Delete</button>
        </div>
      </div>
    `).join('') + '</div>';
    list.querySelectorAll('.btn-edit-post').forEach(b =>
      b.addEventListener('click', () => editPost(b.dataset.id)));
    list.querySelectorAll('.btn-del-post').forEach(b =>
      b.addEventListener('click', () => deletePost(b.dataset.id, b.dataset.path)));
  } catch (err) {
    list.className = '';
    list.innerHTML = `<div class="placeholder"><h2>Load failed</h2><p>${escapeHtml(err.message)}</p></div>`;
    console.error(err);
  }
}

function formatDate(ts) {
  if (!ts) return 'unpublished';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' });
}

async function editPost(id) {
  try {
    const snap = await getDoc(doc(db, 'blog', id));
    if (snap.exists()) openForm({ id: snap.id, ...snap.data() });
  } catch (err) { toast('Load failed: ' + err.message, true); }
}

function handleBlogFile(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) { toast('Only image files allowed.', true); return; }
  if (file.size > 5 * 1024 * 1024)     { toast('File too large (max 5 MB).', true); return; }
  pendingFile = file;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const preview = $('#blog-image-preview');
    preview.hidden = false;
    preview.innerHTML = `<img src="${ev.target.result}"/><span class="ipname">${escapeHtml(file.name)} (${(file.size/1024).toFixed(0)} KB)</span>`;
  };
  reader.readAsDataURL(file);
}

function openForm(p) {
  editingId = p?.id || null;
  pendingFile = null;
  const form = $('#blog-form');
  form.reset();
  $('#blog-form-title').textContent = p ? 'Edit post' : 'New post';
  const slugField = form.slug;
  slugField.dataset.touched = p ? '1' : '';

  const preview = $('#blog-image-preview');
  preview.hidden = true; preview.innerHTML = '';

  if (p) {
    form.title.value           = p.title || '';
    form.slug.value            = p.slug || '';
    form.category.value        = p.category || 'care';
    form.excerpt.value         = p.excerpt || '';
    form.coverImage.value      = p.coverImage || '';
    form.author.value          = p.author || 'Ji-sun, Founder';
    form.content.value         = p.content || '';
    form.metaDescription.value = p.metaDescription || '';
    form.active.checked        = p.active !== false;
    if (p.coverImage) {
      preview.hidden = false;
      preview.innerHTML = `<img src="${escapeHtml(p.coverImage)}"/><span class="ipname">Current cover (upload to replace)</span>`;
    }
    form.dataset.coverImagePath = p.coverImagePath || '';
    if (p.publishedAt) {
      const d = p.publishedAt.toDate ? p.publishedAt.toDate() : new Date(p.publishedAt);
      form.publishedDate.value = d.toISOString().slice(0, 10);
    }
    const previewBtn = $('#btn-blog-preview');
    previewBtn.href = `../../blog/?slug=${encodeURIComponent(p.slug || '')}`;
    previewBtn.style.display = '';
  } else {
    form.author.value = 'Ji-sun, Founder';
    form.publishedDate.value = new Date().toISOString().slice(0, 10);
    form.dataset.coverImagePath = '';
    $('#btn-blog-preview').style.display = 'none';
  }
  $('#blog-modal').hidden = false;
}

async function onSubmit(e) {
  e.preventDefault();
  const f = e.target;
  const btn = $('#btn-blog-save');
  btn.disabled = true; btn.textContent = 'Saving…';
  try {
    const slug = (f.slug.value || slugify(f.title.value)).trim();
    const publishedDate = f.publishedDate.value
      ? new Date(f.publishedDate.value + 'T09:00:00')
      : new Date();

    let coverImage     = f.coverImage.value.trim();
    let coverImagePath = f.dataset.coverImagePath || '';

    // Upload new file → overrides URL
    if (pendingFile) {
      btn.textContent = 'Uploading image…';
      const safeName = pendingFile.name.replace(/[^\w.-]/g, '_');
      const newPath  = `blog/${Date.now()}_${safeName}`;
      const r = ref(storage, newPath);
      await uploadBytes(r, pendingFile);
      const newUrl = await getDownloadURL(r);
      // Delete previous storage file (if any) once new one uploaded
      if (coverImagePath && coverImagePath !== newPath) {
        try { await deleteObject(ref(storage, coverImagePath)); } catch (err) { /* ignore */ }
      }
      coverImage     = newUrl;
      coverImagePath = newPath;
      btn.textContent = 'Saving…';
    } else if (coverImagePath && coverImage && !coverImage.includes(coverImagePath.split('/').pop())) {
      // User replaced the file URL with an external one → previous storage file is now orphaned
      try { await deleteObject(ref(storage, coverImagePath)); } catch (err) { /* ignore */ }
      coverImagePath = '';
    }

    const data = {
      title:           f.title.value.trim(),
      slug,
      category:        f.category.value,
      excerpt:         f.excerpt.value.trim(),
      coverImage,
      coverImagePath,
      author:          f.author.value.trim() || 'Bloom & Vine',
      content:         f.content.value,
      metaDescription: f.metaDescription.value.trim(),
      active:          f.active.checked,
      publishedAt:     Timestamp.fromDate(publishedDate),
      updatedAt:       serverTimestamp(),
    };

    if (editingId) {
      await updateDoc(doc(db, 'blog', editingId), data);
      toast('Post updated');
    } else {
      data.createdAt = serverTimestamp();
      await addDoc(collection(db, 'blog'), data);
      toast('Post published');
    }
    $('#blog-modal').hidden = true;
    pendingFile = null;
    loadPosts();
  } catch (err) {
    console.error(err);
    toast('Save failed: ' + (err.code || err.message), true);
  } finally {
    btn.disabled = false; btn.textContent = 'Save';
  }
}

async function deletePost(id, imagePath) {
  if (!confirm('Delete this post? Cannot be undone.')) return;
  try {
    await deleteDoc(doc(db, 'blog', id));
    if (imagePath) {
      try { await deleteObject(ref(storage, imagePath)); } catch (err) { /* ignore */ }
    }
    toast('Deleted');
    loadPosts();
  } catch (err) { toast('Delete failed: ' + err.message, true); }
}

/* ─── Seed default posts ─── */
const DEFAULTS = [
  {
    slug: 'how-to-keep-flowers-fresh-longer',
    title: 'How to Keep Your Flowers Fresh for [em]7+ Days[/em]: A Sydney Florist\'s Guide',
    category: 'care',
    coverImage: 'https://images.unsplash.com/photo-1509627827223-cf448a4d4956?w=1200&q=80',
    excerpt: 'Most bouquets start wilting on day 3 — but they don\'t have to. Five small habits that genuinely double the life of your flowers, from a Carlingford florist who has tried them all.',
    metaDescription: 'A Sydney florist\'s practical guide to making bouquets last 7+ days. Stem trimming, water care, sunlight, ethylene, and the truth about flower food.',
    content: `<p>Most flowers wilt on day three not because they're poor quality — but because of small things customers do (or don't do) once they get them home. After ten years of running a Carlingford studio, here are the five habits that genuinely double the life of every bouquet.</p>
<h2>1. Re-cut every stem the moment you arrive home</h2>
<p>Stems form a "seal" the second they're out of water. Cut them again — at a <strong>45° angle</strong>, removing about 2cm — to expose fresh tissue that can drink. Use sharp scissors or a clean knife. Avoid blunt scissors; they crush the stem and block water uptake.</p>
<h2>2. Use cool water, not warm</h2>
<p>Cold water travels up the stem more slowly, which sounds counterintuitive — but most bacteria multiply in warm water. Cool water keeps things clean and lets the bloom open at its natural pace.</p>
<h2>3. Change the water every 2 days. No exceptions.</h2>
<p>The biggest single thing you can do. After 48 hours, water becomes cloudy with bacteria, and bacteria block stems faster than dehydration. When you change it, give each stem another small fresh cut.</p>
<h2>4. Watch out for ethylene</h2>
<p>Ripening fruit (especially bananas, apples, tomatoes) gives off ethylene gas, which makes flowers age four times faster. Keep your bouquet at the <strong>opposite end of the kitchen</strong> from the fruit bowl — or in another room entirely.</p>
<h2>5. Light, but not direct sun</h2>
<p>Flowers love bright, indirect light. <strong>Avoid</strong>: direct afternoon sun (cooks petals), spots near heating vents, the tops of TVs and microwaves (heat + ethylene from the fridge below). The best spot is a hallway with reflected daylight.</p>
<h2>One myth, debunked</h2>
<blockquote>"Add a coin / sugar / vodka / aspirin to the water" — most folk remedies don't help. The packet of clear flower food we include with every bouquet contains the right ratio of sugar (food), citric acid (lowers pH so stems drink), and bleach (kills bacteria). Just use that.</blockquote>
<p>Stick with these five habits and your bouquet will look better on day seven than most do on day four.</p>`,
  },
  {
    slug: 'australian-wine-and-flower-pairings-by-season',
    title: 'Pairing Australian Wines with Seasonal Flowers',
    category: 'pairing',
    coverImage: 'https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=1200&q=80',
    excerpt: 'Why a Hunter Valley rosé belongs with peonies and a Margaret River chardonnay belongs with white tulips. A short field guide to giving an experience, not just a bouquet.',
    metaDescription: 'A Sydney florist\'s guide to pairing Australian wines with seasonal flowers — Hunter Valley, Margaret River, McLaren Vale, Tasmanian. The why behind every match.',
    content: `<p>When we started bundling wine with flowers, people asked us — why pair them at all? After hundreds of pairings, the answer is simple: flowers and wine appeal to the same senses, just on different timescales. A bouquet you'll see all week. A bottle you'll share over one evening. Together they bracket a memory.</p>
<p>Here's how we think about pairings, season by season.</p>
<h2>Spring (Sep–Nov): Hunter Valley Rosé + Soft Pinks</h2>
<p>Spring in Sydney is light and a little sweet. <strong>Pink peonies, ranunculus, and David Austin roses</strong> match the fresh, strawberry-and-citrus notes of a Hunter Valley rosé (we love the Tyrrell's). The colour even mirrors — both are blush, both are honest about being romantic.</p>
<h2>Summer (Dec–Feb): Margaret River Chardonnay + Bold Whites</h2>
<p>Summer flowers want to hold their own against bright sun. <strong>White tulips, white roses, and oriental lilies</strong> have a subtle creaminess that lifts a Margaret River chardonnay's stone-fruit and oak. Vasse Felix or Cullen are our go-tos. Bold flower, bold wine.</p>
<h2>Autumn (Mar–May): McLaren Vale Shiraz + Rich Reds &amp; Burgundies</h2>
<p>Autumn brings <strong>burgundy dahlias, deep-red roses, and chocolate cosmos</strong>. The matching wine: a peppery, plum-driven shiraz from McLaren Vale (d'Arenberg is a classic). Both are warm without being heavy.</p>
<h2>Winter (Jun–Aug): Tasmanian Pinot Noir + Greenery &amp; White</h2>
<p>Winter is structural. <strong>Eucalyptus, native gum, white anemones, and waxflower</strong> deliver presence without weight. A cool-climate Tasmanian pinot — Tolpuddle or Stoney Rise — has the same restraint. Light on the palate, long in finish.</p>
<h2>Champagne, always</h2>
<p>For anniversaries, big birthdays, and "I really mean it" moments, an Australian sparkling — Arras Grand Vintage, House of Arras, or even a House of Maddens NV — works with anything. Gift it with a single statement bloom (a blue hydrangea, a single peony) and you're done.</p>
<p>Every bouquet on our site lists a paired wine. We're not selling you wine — we're selling you the moment.</p>`,
  },
  {
    slug: 'sydney-flower-gift-guide-for-every-occasion',
    title: 'The Complete Sydney Flower Gift Guide for [em]Every Occasion[/em]',
    category: 'gift-guide',
    coverImage: 'https://images.unsplash.com/photo-1490750967868-88df5691cc5a?w=1200&q=80',
    excerpt: 'Sending flowers for a birthday is different from sending them for a sympathy. A Carlingford florist\'s honest, occasion-by-occasion gift guide for Sydney.',
    metaDescription: 'A Sydney florist\'s guide to picking the right flowers for birthdays, anniversaries, sympathy, congratulations, and "just because." What to send and why.',
    content: `<p>Customers often ask us, "What should I send?" The honest answer is: it depends on the message you want the flowers to carry. Here's how we think about it, occasion by occasion.</p>
<h2>Birthdays</h2>
<p>Birthdays are about <strong>celebration and personality</strong>. Match the flower to the person: vibrant gerbera and sunflowers for the cheerful types, a curated mixed bouquet with seasonal feature blooms for someone who appreciates craft.</p>
<p>Skip if: you don't know them well — a too-romantic arrangement (red roses, deep peonies) can feel intense for a friend's birthday.</p>
<h2>Anniversaries</h2>
<p>Anniversaries reward <strong>specificity</strong>. We ask: "What did you give last year?" Then we either repeat the colour story (continuity) or evolve it (growth). Hand-tied roses (any colour but red, unless red was last year) with a paired wine is a near-foolproof combination.</p>
<h2>Sympathy</h2>
<p>The hardest gift to get right. Less is more. <strong>White, soft cream, and pale green</strong>. Lilies are traditional but watch the pollen (some people hate the cleanup). White roses and chrysanthemums are gentle alternatives. <strong>Avoid</strong>: bright reds, oranges, and yellows — they read as celebratory.</p>
<h2>Congratulations (new job, new home, baby)</h2>
<p>Use <strong>warm, optimistic colours</strong>: peach, coral, soft yellow, dusky pink. The arrangement should feel forward-moving — a tied bouquet rather than a wreath. For new home gifts, a smaller arrangement that fits a hallway console works better than something dramatic.</p>
<h2>"Just because"</h2>
<p>The most underrated category. A small, thoughtfully-tied bunch arriving on a random Tuesday is more powerful than a large arrangement on Valentine's Day — because there's no expectation. Best for: long-term partners, parents, distant friends. Pair with a card message that mentions one specific thing: <em>"saw these and thought of the rosé you brought to dinner last month."</em></p>
<h2>Quick reference</h2>
<ul>
<li><strong>Birthday under $80:</strong> Mixed seasonal bunch</li>
<li><strong>Anniversary under $150:</strong> Featured blooms + paired Hunter Valley wine</li>
<li><strong>Sympathy under $100:</strong> White + soft green hand-tied</li>
<li><strong>Congratulations under $90:</strong> Peach &amp; coral mixed</li>
<li><strong>Just because under $60:</strong> Single-stem-statement (one bunch of one flower)</li>
</ul>
<p>Whatever you choose, the card matters. Three honest sentences beat a generic "best wishes." We hand-write every card on quality paper.</p>`,
  },
  {
    slug: 'behind-the-scenes-flemington-flower-market',
    title: '[em]5:30 AM[/em] at Flemington: Why Market-Picked Flowers Are Different',
    category: 'story',
    coverImage: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=1200&q=80',
    excerpt: 'Most florists order from a wholesaler. We drive to Flemington Market every morning before sunrise. Here\'s what that actually means for the flowers in your bouquet.',
    metaDescription: 'A behind-the-scenes look at Sydney\'s Flemington Flower Market — why we pick flowers daily ourselves, and why it matters for the bouquet you receive.',
    content: `<p>Sydney has one major wholesale flower market: <strong>Flemington Markets in Homebush West</strong>. Trade starts at 4 AM. By 7 AM the best stems are gone. We're there at 5:30 AM, six days a week.</p>
<p>This isn't a romantic story. It's an operational decision.</p>
<h2>The walk-up at dawn</h2>
<p>The market is loud, cold (in winter, very cold), and physically demanding — there's no parking close, you carry buckets, you negotiate with growers who don't have time for small talk. Most florists, understandably, just place phone orders with a wholesaler and have the flowers delivered.</p>
<p>The trade-off: a wholesaler picks <em>for</em> you. They send you what they have. We see, smell, and touch every bunch before it joins the van.</p>
<h2>What we look for</h2>
<ul>
<li><strong>Stem firmness:</strong> A peony bud should resist gentle pressure. Soft = picked too early or too late.</li>
<li><strong>Foliage:</strong> Yellow tips on rose leaves mean the cooling chain broke at some point. We pass.</li>
<li><strong>Smell:</strong> Real garden roses smell like roses. If they don't, they were stored too long.</li>
<li><strong>Water clarity in the holding bucket:</strong> Cloudy water at the grower's stall = bacterial growth has started. Skip.</li>
</ul>
<h2>How growers know us</h2>
<p>Buying daily for years means we have <strong>relationships</strong> with specific growers — Stall 14A Tony for ranunculus, Stall 22 Mei for native and eucalyptus, Stall 7 Aiden for tulips. They know our standard. They sometimes hold something special. This is something a phone-ordering florist literally cannot replicate.</p>
<h2>Why it matters for your bouquet</h2>
<p>By 10 AM the flowers are in our Carlingford studio. By 11 AM they're conditioned (re-cut, re-watered, given an hour to drink). By noon they're being arranged. By 1 PM they're going out for delivery. <strong>That's the same morning, end-to-end.</strong></p>
<p>Compare that to the standard chain — grown overseas → import wholesaler → cold storage → florist → customer — which is typically 4–7 days. Our flowers are usually 1–2 days from cut to door.</p>
<p>You can taste it (so to speak). They open more slowly, last longer, and look like the photo because the photo was taken that same morning.</p>
<p>It's not magic. It's just being awake at 5:30.</p>`,
  },
  {
    slug: 'sydney-wedding-flower-planning-timeline',
    title: 'Sydney Wedding Flower Planning: A [em]6-Month Timeline[/em]',
    category: 'wedding',
    coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80',
    excerpt: 'Wedding flowers feel overwhelming until you break them into stages. Here\'s the timeline we use with every Sydney couple, from first inquiry to wedding day morning.',
    metaDescription: 'A Sydney florist\'s 6-month wedding flower planning timeline. When to inquire, when to confirm, what to ask, and how to avoid the most common mistakes.',
    content: `<p>Wedding flowers can feel like the most subjective part of a Sydney wedding — but the planning structure is actually quite predictable. Here's the timeline we use with every couple, with the questions to answer at each stage.</p>
<h2>6 months out: Vision &amp; vendor selection</h2>
<p>Don't book yet. <strong>Define the vision first</strong>:</p>
<ul>
<li>Colour palette (3–4 colours, not 7)</li>
<li>Style: garden, structural, wildflower, traditional, minimalist</li>
<li>Total floral budget (typically 8–12% of overall wedding budget)</li>
<li>Key moments: bouquet, ceremony arch, reception centrepieces — and yes / no on installations like flower walls</li>
</ul>
<p>Then have <strong>2–3 florists send proposals</strong> based on the same brief. Compare value, not just price.</p>
<h2>4 months out: Confirm florist, lock dates</h2>
<p>Sign the agreement. Pay deposit. Confirm:</p>
<ul>
<li>Delivery time (usually 2–3 hours before ceremony)</li>
<li>Setup window with venue</li>
<li>Tear-down: who handles it (florist or venue?)</li>
<li>Backup plan for outdoor weddings if it rains</li>
</ul>
<h2>2 months out: Final mood-board review</h2>
<p>By now seasonal availability is clearer. Some flowers swap (you wanted peonies, but it's October — your florist suggests garden roses instead). Trust the substitution if the colour story holds. <strong>Don't add new flowers at this stage</strong>; refine what's there.</p>
<h2>1 month out: Final headcount &amp; logistics</h2>
<p>Final guest count → final centrepiece count. Confirm:</p>
<ul>
<li>Number of bridal bouquets, bridesmaids, buttonholes</li>
<li>Ceremony arch / arbor scope</li>
<li>Reception: number of tables, table size</li>
<li>Pew / aisle markers if any</li>
</ul>
<h2>2 weeks out: Signed-off list, balance paid</h2>
<p>Florist sends a final itemised list. You sign off. Pay balance.</p>
<h2>Week of the wedding</h2>
<p>Florist confirms exact delivery time and vehicle access with venue. They prep flowers in their cold room from Monday onwards. <strong>Don't ask for changes this week.</strong> The plan is set; trust it.</p>
<h2>Day of</h2>
<p>Wake up. Drink water. Don't look at the bouquet too early — it's being conditioned. When you do see it, it should make you cry a little. That's normal.</p>
<h2>Common mistakes to avoid</h2>
<ul>
<li><strong>Booking the cheapest quote</strong>: wedding flowers fail when scope creeps and the budget can't absorb. Pay for the experienced florist.</li>
<li><strong>Picking flowers out of season</strong>: peonies in winter cost 4× and look tired</li>
<li><strong>Centrepieces that block sight lines</strong>: keep them under 25cm or above 70cm — never in between</li>
<li><strong>Forgetting buttonholes pin types</strong>: ask the florist if they include magnetic pins (much easier on suit fabric)</li>
</ul>
<p>If you're 6 months out from your Sydney wedding and want to talk through your vision — <a href="../customer/#delivery-areas">request a custom order</a>. We'll come back within 24 hours with a tailored proposal.</p>`,
  },
];

async function seedDefaults() {
  if (!confirm('Add 5 starter blog posts (flower care, wine pairing, gift guide, behind-the-scenes, wedding planning)? You can edit or delete each afterwards.')) return;
  try {
    const today = new Date();
    for (let i = 0; i < DEFAULTS.length; i++) {
      const d = DEFAULTS[i];
      const pubDate = new Date(today);
      pubDate.setDate(today.getDate() - i * 6); // stagger publish dates
      await addDoc(collection(db, 'blog'), {
        ...d,
        author:      'Ji-sun, Founder',
        active:      true,
        publishedAt: Timestamp.fromDate(pubDate),
        createdAt:   serverTimestamp(),
        updatedAt:   serverTimestamp(),
      });
    }
    toast(`Seeded ${DEFAULTS.length} starter posts`);
    loadPosts();
  } catch (err) {
    console.error(err);
    toast('Seed failed: ' + (err.code || err.message), true);
  }
}
