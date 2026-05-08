/**
 * Firebase Cloud Messaging service worker.
 *
 * This file MUST be served from the same scope as the admin page (i.e. /admin/).
 * It runs in the background — when the admin tab is closed or the phone is locked,
 * this worker receives push events and shows the system notification.
 */

importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

// Public Firebase config — same as firebase/web-config.js
firebase.initializeApp({
  apiKey: "AIzaSyDB5-6OLi6KJC7YeY1f-8_VALfouIpPQHc",
  authDomain: "bloom-sydney.firebaseapp.com",
  projectId: "bloom-sydney",
  storageBucket: "bloom-sydney.firebasestorage.app",
  messagingSenderId: "282308589974",
  appId: "1:282308589974:web:a4a4f40e26401870ff45b7"
});

const messaging = firebase.messaging();

// Background push handler — fires when the admin app is NOT in the foreground.
// (Foreground messages are handled in admin.js via onMessage().)
messaging.onBackgroundMessage((payload) => {
  const { title = 'Bloom Admin', body = '', icon = './icon-192.svg', orderId = '', route = '/orders' } =
    { ...(payload.notification || {}), ...(payload.data || {}) };

  self.registration.showNotification(title, {
    body,
    icon,
    badge: './icon-192.svg',
    tag: orderId || 'bloom-' + Date.now(),
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: { route, orderId, click_action: payload?.fcmOptions?.link || payload?.data?.click_action }
  });
});

// Tap-to-open: focus an existing tab or open a new one at the right route.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const route = event.notification.data?.route || '/orders';
  const target = new URL('./index.html#' + route, self.location.origin + self.location.pathname).toString();

  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) {
      if (c.url.includes('/admin/') && 'focus' in c) {
        c.navigate?.(target);
        return c.focus();
      }
    }
    return self.clients.openWindow(target);
  })());
});

// Optional: lightweight offline fallback for the shell (cache index + admin.js + admin.css)
const CACHE = 'bloom-admin-v1';
const SHELL = ['./index.html', './admin.js', './admin.css', './manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  // Network-first for navigations, cache-first for static shell files.
  const { request } = e;
  if (request.method !== 'GET') return;
  if (request.mode === 'navigate') {
    e.respondWith(fetch(request).catch(() => caches.match('./index.html')));
    return;
  }
  // Only cache same-origin static assets (avoid caching Firebase API calls).
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(caches.match(request).then(r => r || fetch(request)));
});
