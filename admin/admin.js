import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";
import { getStorage }   from "https://www.gstatic.com/firebasejs/12.12.1/firebase-storage.js";
import { firebaseConfig } from "../firebase/web-config.js";

const app = initializeApp(firebaseConfig);
export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app);

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
  } else {
    $('#login-screen').hidden = false;
    $('#admin-app').hidden = true;
  }
});

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
  dashboard: 'Dashboard',
  orders:    'Orders',
  customers: 'Customers',
  products:  'Products & Inventory',
  reviews:   'Reviews',
  faqs:      'FAQs',
  settings:  'Settings',
};

const routes = {
  dashboard: () => import('./views/dashboard.js'),
  orders:    () => import('./views/orders.js'),
  customers: () => import('./views/customers.js'),
  products:  () => import('./views/products.js'),
  reviews:   () => import('./views/reviews.js'),
  faqs:      () => import('./views/faqs.js'),
  settings:  () => import('./views/settings.js'),
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
