import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";
import { getStorage }   from "https://www.gstatic.com/firebasejs/12.12.1/firebase-storage.js";
import { getMessaging, getToken, onMessage, isSupported as isMessagingSupported }
  from "https://www.gstatic.com/firebasejs/12.12.1/firebase-messaging.js";
import { firebaseConfig } from "../firebase/web-config.js";

const app = initializeApp(firebaseConfig);
export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app);

// ─── FCM (push notifications) — VAPID key set in /admin/push-config.js ───
// See README → "Push notifications setup" for how to generate this key.
let _vapidKey = null;
try {
  const cfg = await import('./push-config.js').catch(() => null);
  _vapidKey = cfg?.VAPID_KEY || null;
} catch { /* push-config.js is optional */ }

export const $  = (s, root = document) => root.querySelector(s);
export const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g,
    c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

let toastT;
export function toast(msg, isErr = false) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.toggle('err', isErr);
  el.classList.add('on');
  clearTimeout(toastT);
  toastT = setTimeout(() => el.classList.remove('on'), 3200);
}

/* ─── AUTH ─── */
onAuthStateChanged(auth, user => {
  if (user) {
    $('#login-screen').hidden = true;
    $('#admin-app').hidden = false;
    $('#signed-in-as').textContent = user.email;
    if (!location.hash) location.hash = '#/dashboard';
    else handleRoute();
    // Once signed in, set up push notifications (no-op if not supported / already done)
    setupPushNotifications(user).catch(err => console.warn('[push] setup failed:', err));
  } else {
    $('#login-screen').hidden = false;
    $('#admin-app').hidden = true;
  }
});

/* ─── PUSH NOTIFICATIONS (FCM) ─── */
async function setupPushNotifications(user) {
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return;
  if (!await isMessagingSupported()) return;
  if (!_vapidKey) {
    console.info('[push] VAPID key not configured — see admin/push-config.js.example');
    updatePushButton('not-configured');
    return;
  }

  // Register the FCM service worker (must live at /admin/firebase-messaging-sw.js)
  let reg;
  try {
    reg = await navigator.serviceWorker.register('./firebase-messaging-sw.js', { scope: './' });
  } catch (err) {
    console.warn('[push] SW register failed:', err);
    return;
  }

  const messaging = getMessaging(app);

  // Foreground messages: show an in-app toast (browser doesn't fire system notification when tab is open)
  onMessage(messaging, (payload) => {
    const t = payload?.notification?.title || payload?.data?.title || 'New order';
    const b = payload?.notification?.body  || payload?.data?.body  || '';
    toast(`🔔 ${t}${b ? ' — ' + b : ''}`);
    // Optional: re-load the orders view if the user is on it
    if (location.hash.includes('/orders')) handleRoute();
  });

  updatePushButton(Notification.permission, async () => requestAndSaveToken(user, reg, messaging));

  // Auto-refresh token if already granted (in case it rotated)
  if (Notification.permission === 'granted') {
    requestAndSaveToken(user, reg, messaging).catch(err => console.warn('[push] token refresh failed:', err));
  }
}

async function requestAndSaveToken(user, reg, messaging) {
  if (Notification.permission === 'denied') {
    toast('Notifications were blocked. Enable them in your browser settings.', true);
    return;
  }
  if (Notification.permission !== 'granted') {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') { updatePushButton(perm); return; }
  }

  const token = await getToken(messaging, { vapidKey: _vapidKey, serviceWorkerRegistration: reg });
  if (!token) { toast('Could not get notification token.', true); return; }

  // Save token under admin_devices/{token} so the Cloud Function can fan-out pushes.
  await setDoc(doc(db, 'admin_devices', token), {
    uid:       user.uid,
    email:     user.email,
    userAgent: navigator.userAgent,
    createdAt: serverTimestamp(),
    lastSeen:  serverTimestamp(),
  }, { merge: true });

  updatePushButton('granted');
  toast('🔔 Notifications enabled — you’ll be alerted on new orders');
}

function updatePushButton(state, onClick) {
  const btn = $('#btn-push');
  if (!btn) return;
  btn.hidden = false;
  if (state === 'granted')         { btn.textContent = '🔔 Alerts on';   btn.disabled = true;  btn.title = 'You will be notified of new orders'; btn.onclick = null; }
  else if (state === 'denied')     { btn.textContent = '🔕 Blocked';     btn.disabled = true;  btn.title = 'Enable notifications in browser settings'; btn.onclick = null; }
  else if (state === 'not-configured') { btn.hidden = true; }
  else                             { btn.textContent = '🔔 Enable alerts'; btn.disabled = false; btn.title = 'Tap to receive new-order push notifications'; btn.onclick = onClick || null; }
}

$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = $('#login-err');
  errEl.classList.remove('show');
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true; btn.textContent = 'Signing in...';
  try {
    await signInWithEmailAndPassword(auth, e.target.email.value, e.target.password.value);
  } catch (err) {
    errEl.textContent = 'Sign-in failed: ' + (err.code || err.message);
    errEl.classList.add('show');
  } finally {
    btn.disabled = false; btn.textContent = 'Sign in';
  }
});

$('#btn-logout').addEventListener('click', () => signOut(auth));

/* ─── ROUTER ─── */
const titles = {
  dashboard:    'Dashboard',
  orders:       'Orders',
  customOrders: 'Custom Orders',
  customers:    'Customers',
  products:     'Products & Inventory',
  addons:       'Add-ons',
  dailyPrep:    "Today's Prep",
  blog:         'Blog',
  reviews:      'Reviews',
  faqs:         'FAQs',
  settings:     'Settings',
};

const routes = {
  dashboard:    () => import('./views/dashboard.js'),
  orders:       () => import('./views/orders.js'),
  customOrders: () => import('./views/customOrders.js'),
  customers:    () => import('./views/customers.js'),
  products:     () => import('./views/products.js'),
  addons:       () => import('./views/addons.js'),
  dailyPrep:    () => import('./views/dailyPrep.js'),
  blog:         () => import('./views/blog.js'),
  reviews:      () => import('./views/reviews.js'),
  faqs:         () => import('./views/faqs.js'),
  settings:     () => import('./views/settings.js'),
};

async function handleRoute() {
  const hash = location.hash.replace(/^#\//, '');
  const route = (hash || 'dashboard').split('?')[0];
  const loader = routes[route] || routes.dashboard;
  $('#view-title').textContent = titles[route] || '';
  $$('.nav-link').forEach(a => a.classList.toggle('on', a.dataset.route === route));
  // close mobile sidebar after navigating
  $('#sidebar').classList.remove('open');
  $('#sidebar-backdrop').classList.remove('on');

  const container = $('#view-container');
  container.innerHTML = '<div class="loading">Loading…</div>';
  try {
    const mod = await loader();
    await mod.render();
  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="placeholder"><h2>Failed to load view</h2><p>${escapeHtml(err.message)}</p></div>`;
  }
}

window.addEventListener('hashchange', handleRoute);

/* ─── MOBILE SIDEBAR ─── */
$('#btn-menu').addEventListener('click', () => {
  $('#sidebar').classList.add('open');
  $('#sidebar-backdrop').classList.add('on');
});
$('#sidebar-backdrop').addEventListener('click', () => {
  $('#sidebar').classList.remove('open');
  $('#sidebar-backdrop').classList.remove('on');
});
