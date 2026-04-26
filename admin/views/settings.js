import { db, $, $$, toast, escapeHtml } from '../admin.js';
import { doc, getDoc, setDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

const SETTINGS_DOC = doc(db, 'settings', 'business');
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

export async function render() {
  const container = $('#view-container');
  container.innerHTML = `
    <form id="settings-form">

      <div class="section-card">
        <h2>Store information</h2>
        <div class="field-row">
          <div class="field">
            <label>Store name</label>
            <input name="storeName" type="text" placeholder="Bloom &amp; Vine" required/>
          </div>
          <div class="field">
            <label>NSW Liquor License No.</label>
            <input name="liquorLicense" type="text" placeholder="LIQP123456789"/>
          </div>
        </div>
        <div class="field">
          <label>Address</label>
          <input name="address" type="text" placeholder="12 Pennant Hills Rd, Carlingford NSW 2118"/>
        </div>
        <div class="field-row">
          <div class="field">
            <label>Phone</label>
            <input name="phone" type="tel" placeholder="+61 4xx xxx xxx"/>
          </div>
          <div class="field">
            <label>Email</label>
            <input name="email" type="email" placeholder="hello@bloomvine.com.au"/>
          </div>
        </div>
      </div>

      <div class="section-card">
        <h2>Operating hours <span class="help">— shown in customer banners</span></h2>
        <div class="field-row">
          <div class="field">
            <label>Open</label>
            <input name="openTime" type="time" value="09:00"/>
          </div>
          <div class="field">
            <label>Close</label>
            <input name="closeTime" type="time" value="18:00"/>
          </div>
        </div>
        <div class="field">
          <label>Open days</label>
          <div class="dayrow">
            ${DAYS.map(d => `
              <label class="daypill"><input type="checkbox" name="openDays" value="${d}" checked/> ${d}</label>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="section-card">
        <h2>Same-Day cutoff <span class="help">— orders after this go to the next day</span></h2>
        <div class="field" style="max-width: 220px">
          <label>Cutoff time</label>
          <input name="cutoffTime" type="time" value="13:00"/>
        </div>
      </div>

      <div class="section-card">
        <h2>Free delivery threshold <span class="help">— orders at or above this total ship free</span></h2>
        <div class="field" style="max-width: 220px">
          <label>Amount (AUD)</label>
          <input name="freeDeliveryThreshold" type="number" min="0" step="1" placeholder="80"/>
        </div>
      </div>

      <div class="section-card">
        <h2>Delivery fees by postcode <span class="help">— add a row per postcode you deliver to</span></h2>
        <div class="fees-table" id="fees-table"></div>
        <button type="button" class="btn-secondary" id="btn-add-fee">+ Add postcode</button>
      </div>

      <div class="section-card">
        <h2>Currency</h2>
        <div class="field" style="max-width: 220px">
          <label>Currency</label>
          <input name="currency" type="text" value="AUD" readonly style="background: var(--bg); color: var(--mid)"/>
        </div>
      </div>

      <div class="section-card">
        <h2>Address autocomplete <span class="help">— Google Places API (optional)</span></h2>
        <div class="field">
          <label>Google Maps API key</label>
          <input name="googleMapsApiKey" type="text" placeholder="AIzaSy..." autocomplete="off"/>
          <div style="margin-top:8px; font-size:12px; color:var(--subtle); line-height:1.6">
            When set, customers get smart Australian-address autocomplete in checkout (auto-fills suburb &amp; postcode).<br/>
            Get one at <a href="https://console.cloud.google.com/google/maps-apis" target="_blank" rel="noopener" style="color:var(--accent)">Google Cloud Console</a> →
            enable <strong>Places API</strong> → restrict the key to your site (HTTP referrer = <code>grakoreakim-lgtm.github.io/*</code>).
            Free tier covers up to ~28,500 requests/month.
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn-primary" id="btn-save-settings">Save settings</button>
      </div>
    </form>
  `;

  // Load existing settings
  let settings = {};
  try {
    const snap = await getDoc(SETTINGS_DOC);
    if (snap.exists()) settings = snap.data();
  } catch (err) {
    toast('Failed to load settings: ' + err.message, true);
  }

  populateForm(settings);

  $('#fees-table').addEventListener('click', (e) => {
    if (e.target.matches('.btn-remove-fee')) {
      e.target.closest('.fee-row').remove();
    }
  });
  $('#btn-add-fee').addEventListener('click', () => addFeeRow('', ''));
  $('#settings-form').addEventListener('submit', onSave);
}

function populateForm(s) {
  const f = $('#settings-form');
  if (s.storeName)     f.storeName.value     = s.storeName;
  if (s.liquorLicense) f.liquorLicense.value = s.liquorLicense;
  if (s.address)       f.address.value       = s.address;
  if (s.phone)         f.phone.value         = s.phone;
  if (s.email)         f.email.value         = s.email;
  if (s.openTime)      f.openTime.value      = s.openTime;
  if (s.closeTime)     f.closeTime.value     = s.closeTime;

  if (Array.isArray(s.openDays)) {
    f.querySelectorAll('input[name=openDays]').forEach(cb => {
      cb.checked = s.openDays.includes(cb.value);
    });
  }

  if (s.cutoffTime) f.cutoffTime.value = s.cutoffTime;
  if (s.freeDeliveryThreshold != null) f.freeDeliveryThreshold.value = s.freeDeliveryThreshold;
  if (s.googleMapsApiKey) f.googleMapsApiKey.value = s.googleMapsApiKey;

  // Delivery fees: existing or sensible defaults from current customer code
  const fees = s.deliveryFees && Object.keys(s.deliveryFees).length
    ? s.deliveryFees
    : { '2118': 0, '2119': 0, '2121': 5, '2122': 5, '2113': 8, '2114': 8, '2112': 10 };
  Object.entries(fees).forEach(([pc, fee]) => addFeeRow(pc, fee));
}

function addFeeRow(postcode = '', fee = '') {
  const container = $('#fees-table');
  const row = document.createElement('div');
  row.className = 'fee-row';
  row.innerHTML = `
    <input type="text"   name="fee_postcode" placeholder="Postcode (e.g. 2118)" value="${escapeHtml(String(postcode))}"/>
    <input type="number" name="fee_amount"   placeholder="Fee (AUD)" min="0" step="1" value="${escapeHtml(String(fee))}"/>
    <button type="button" class="btn-danger btn-remove-fee">Remove</button>
  `;
  container.appendChild(row);
}

async function onSave(e) {
  e.preventDefault();
  const f = e.target;
  const btn = $('#btn-save-settings');
  btn.disabled = true; btn.textContent = 'Saving...';
  try {
    const openDays = $$('input[name=openDays]:checked', f).map(cb => cb.value);

    const deliveryFees = {};
    $$('#fees-table .fee-row').forEach(row => {
      const pc  = row.querySelector('input[name=fee_postcode]').value.trim();
      const amt = row.querySelector('input[name=fee_amount]').value;
      if (pc && amt !== '') deliveryFees[pc] = Number(amt);
    });

    const data = {
      storeName:             f.storeName.value.trim(),
      liquorLicense:         f.liquorLicense.value.trim(),
      address:               f.address.value.trim(),
      phone:                 f.phone.value.trim(),
      email:                 f.email.value.trim(),
      openTime:              f.openTime.value,
      closeTime:             f.closeTime.value,
      openDays,
      cutoffTime:            f.cutoffTime.value,
      freeDeliveryThreshold: f.freeDeliveryThreshold.value !== '' ? Number(f.freeDeliveryThreshold.value) : null,
      deliveryFees,
      googleMapsApiKey:      f.googleMapsApiKey.value.trim(),
      currency:              'AUD',
      updatedAt:             serverTimestamp(),
    };

    await setDoc(SETTINGS_DOC, data, { merge: true });
    toast('Settings saved');
  } catch (err) {
    console.error(err);
    toast('Save failed: ' + (err.code || err.message), true);
  } finally {
    btn.disabled = false; btn.textContent = 'Save settings';
  }
}
