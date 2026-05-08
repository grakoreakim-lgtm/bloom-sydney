# 🌷 Bloom & Vine — Sydney

> A daily flower + wine hamper delivery service based in Carlingford, Sydney.
> Customer shop, admin dashboard, public blog, and Firebase backend — all running serverless.

---

## Stack at a glance

| Layer | Technology |
|---|---|
| **Customer site** | Vanilla HTML / CSS / JavaScript (ES Modules) |
| **Admin dashboard** | Vanilla JS SPA (hash-based router, dynamic-import views) |
| **Blog** | Vanilla HTML/JS (slug-based, SSR-friendly meta + JSON-LD) |
| **Firebase JS SDK** | v12.12.1 (loaded from `gstatic.com` CDN — no bundler) |
| **Backend** | Firebase Cloud Functions (Node 18) |
| **Database** | Firestore (NoSQL) |
| **Auth** | Firebase Authentication (admin email/password) |
| **File storage** | Firebase Storage (product / blog / review images) |
| **Hosting (frontend)** | GitHub Pages (static) |
| **Payments** | Stripe (Card, Apple Pay, Google Pay) |
| **Social** | Instagram Graph API (auto-post + feed cache) |
| **Notifications** | Twilio WhatsApp Business API |
| **Address autocomplete** | Google Places API |

**No build step.** Everything is plain HTML/CSS/JS deployed as-is — open `customer/index.html` in a browser and it just works.

---

## Project structure

```
bloom-sydney/
│
├── customer/                       ← 🛒 Customer shop (single-page)
│   ├── index.html                    Main shop: Same-Day · Pre-Order · Subscription
│   ├── hero.jpg, sameday.jpg, preorder.jpg, subscribe.jpg
│
├── admin/                          ← 🔧 Admin dashboard SPA
│   ├── index.html                    Shell (login screen + sidebar + view container)
│   ├── admin.js                      Auth + hash router + view loader
│   ├── admin.css                     All admin styles
│   └── views/                        Per-route modules (lazy-loaded)
│       ├── dashboard.js              KPIs, today's snapshot
│       ├── orders.js                 Customer orders (CRUD + delivery status)
│       ├── customOrders.js           Custom / wedding order requests
│       ├── customers.js              Customer DB + anniversaries
│       ├── products.js               Same-Day / Pre-Order catalogue with photo upload
│       ├── blog.js                   Blog post CRUD + cover-image upload + 5 seed posts
│       ├── reviews.js                Customer review CRUD + photo upload + sample seed
│       ├── faqs.js                   FAQ CRUD + default-content seed
│       └── settings.js               Delivery fees, cutoff time, store config
│
├── blog/                           ← 📝 Public blog (SEO)
│   └── index.html                    Slug-based reader (?slug=...) + index page
│
├── firebase/                       ← ☁️ Firebase config
│   ├── web-config.js                 Public web SDK config (apiKey is meant to be public)
│   ├── firestore.rules               Firestore security rules
│   ├── storage.rules                 Storage security rules
│   └── functions/
│       ├── index.js                  All 8 Cloud Functions
│       └── package.json
│
├── docs/                           ← 📚 Setup guides
│   ├── INSTAGRAM_SETUP.md            Step-by-step Instagram Graph API setup
│   ├── TWILIO_SETUP.md               WhatsApp / Twilio setup
│   └── test-whatsapp.js              Local Twilio test before deploying
│
├── firebase.json                   ← Maps rules / functions paths for `firebase deploy`
├── README.md                       ← (this file)
└── .gitignore
```

> **Legacy / not in use:** `admin/BloomAdmin.jsx`, `shop.html`, `index.js`, `firestore.rules` (root). These are early-prototype artefacts kept for reference. The active code is everything inside `customer/`, `admin/`, `blog/`, and `firebase/`.

---

## Customer site (`customer/index.html`)

A single self-contained HTML file (~2,500 lines) — fast first paint, no framework overhead.

**Features**
- Three product tabs: **Same-Day** · **Pre-Order (up to 30 days ahead)** · **Subscription**
- Shop grid responds to product count: Same-Day stacks 1-up on mobile, up to 3 per row on PC; Pre-Order is 2/3-column.
- 2 PM same-day cutoff with live "Order before X" banner
- Postcode-based delivery-fee calculator + delivery-zone map
- Single-page checkout modal (English, AU-friendly) with Google Places address autocomplete
- Anniversary registration baked into checkout (drives WhatsApp reminder loop)
- Reviews carousel — pulled live from Firestore, supports per-review photos, generates `AggregateRating` JSON-LD
- FAQ accordion — content driven by Firestore `faqs/` collection
- Custom order request flow → writes to `customOrders/`, surfaces in admin
- Blog teaser block linking to `/blog/`
- Instagram feed grid (reads `cache/instagram_feed`, refreshed hourly by Cloud Function)

---

## Admin dashboard (`admin/`)

Vanilla-JS SPA with a hash-based router ([admin/admin.js:88-107](admin/admin.js#L88-L107)). Each view in [admin/views/](admin/views/) exports an `async render()` and is `import()`-ed only when its route is hit.

| Route | What it does |
|---|---|
| `#/dashboard` | KPI tiles, today snapshot |
| `#/orders` | Order pipeline: PENDING → PACKING → DISPATCHED → DELIVERED, real-time toast on new orders |
| `#/customOrders` | Wedding / custom requests with status workflow |
| `#/customers` | Customer list + per-customer anniversaries |
| `#/products` | Same-Day / Pre-Order tabs, image upload to Storage, stock + sold-out toggles |
| `#/blog` | Post CRUD with cover-image upload **or** external URL, draft/publish flag, "🌱 Seed 5 starter posts" |
| `#/reviews` | Star ratings, optional customer photo upload, verified flag, "🌱 Seed samples" |
| `#/faqs` | FAQ CRUD with default-content seeder |
| `#/settings` | Delivery fees per postcode, cutoff time, liquor licence number, etc. |

**Auth:** Firebase Auth email/password. The login screen lives at the top of [admin/index.html](admin/index.html); auth state is observed in [admin/admin.js:32-43](admin/admin.js#L32-L43). Anyone signed in is treated as admin (rules enforce `request.auth != null`).

---

## Blog (`blog/`)

Slug-driven static reader — `?slug=how-to-keep-flowers-fresh` reads from Firestore `blog/{id}`, renders article body, sets per-article `<meta>` tags + Open Graph + JSON-LD `Article` schema for SEO, and shows related posts at the bottom. The same file also renders the index when no `slug` is provided.

Cover images can be a Storage upload (admin-uploaded) or an external URL (e.g. Unsplash for seed posts). Either way the field saved on the doc is `coverImage`; admin-uploaded files also save `coverImagePath` so deletion can clean up the Storage object.

---

## Firebase Cloud Functions (`firebase/functions/index.js`)

Node 18 runtime. Eight functions, all deployed together with `firebase deploy --only functions`.

| Function | Trigger | Purpose |
|---|---|---|
| `createPaymentIntent` | HTTP POST | Create a Stripe PaymentIntent (Apple/Google Pay + Card) |
| `stripeWebhook` | HTTP POST (from Stripe) | Mark order as `PAID` on `payment_intent.succeeded` |
| `createOrder` | HTTP POST | Save order, decrement stock atomically, register anniversary if supplied |
| `scheduledInstagramPost` | Cron `0 6 * * *` AEST | Auto-post today's product to Instagram |
| `refreshInstagramFeed` | Cron `0 * * * *` AEST | Cache the IG feed (12 latest posts) into `cache/instagram_feed` |
| `refreshInstagramToken` | Cron `0 9 1 * *` AEST | Refresh the 60-day long-lived Instagram token before expiry |
| `anniversaryReminders` | Cron `0 9 * * *` AEST | Send Twilio WhatsApp reminders at D-14, D-7, D-2 |
| `dailyCleanup` | Cron `0 0 * * *` AEST | Mark yesterday's undelivered orders as `ARCHIVED` |

---

## Firestore collections

```
daily_products/{YYYY-MM-DD}        ← Today's Same-Day product (admin-edited)
  ├── items[]                        Each item: id, name, price, stock, hasWine, imageUrl …
  ├── instagramPosted: bool
  └── instagramPostedAt: timestamp

products/{id}                      ← Pre-Order catalogue
  ├── tab: 'sameday' | 'preorder'
  ├── name, type, price, stock, hasWine, sortOrder
  ├── imageUrl, imagePath            (Storage cleanup hook)
  └── sold: bool

orders/{id}                        ← Customer orders
  ├── customerName, customerEmail, customerPhone
  ├── deliveryAddress, suburb, postcode
  ├── items[], totalAmount, deliveryFee
  ├── deliveryDate, timeSlot, cardMessage
  ├── hasAlcohol: bool               (NSW Liquor Act audit trail)
  ├── deliveryStatus: PENDING | PACKING | DISPATCHED | DELIVERED | ARCHIVED
  ├── paymentStatus:  UNPAID | PAID | MANUAL
  └── createdAt, paidAt, stripePaymentIntentId

customOrders/{id}                  ← Custom / wedding request form
  ├── customerName, contact, eventDate, budget, brief
  └── status: NEW | QUOTED | CONFIRMED | DECLINED

customers/{email}                  ← Auto-built when an order is saved
  ├── name, email, phone
  └── anniversaries/{annivId}
        ├── label    e.g. "Wife's Birthday"
        └── date     "MM/DD" (year-agnostic)

blog/{id}                          ← Blog posts
  ├── title, slug, category, excerpt, content (HTML), metaDescription
  ├── coverImage (URL), coverImagePath (Storage path, optional)
  ├── author, publishedAt, active
  └── createdAt, updatedAt

reviews/{id}                       ← Customer reviews (carousel + JSON-LD)
  ├── customerName, suburb, stars (1-5), tag, text
  ├── productName, date (display string)
  ├── photoUrl, photoPath            (optional)
  ├── verified, active, isSample, sortOrder
  └── createdAt, updatedAt

faqs/{id}                          ← FAQ accordion source
  ├── question, answer, sortOrder
  └── active

settings/{doc}                     ← Store-wide config
  ├── delivery_fees_by_postcode    { "2118": 0, "2121": 5, ... }
  ├── cutoff_time                  "14:00"
  ├── liquor_licence_number
  └── ...

cache/instagram_feed               ← Refreshed hourly by Cloud Function
  ├── posts[]                       { id, media_url, caption, timestamp }
  └── updatedAt

subscriptions/{id}                 ← Reserved for future subscription product
```

Security: see [firebase/firestore.rules](firebase/firestore.rules). General pattern is **public read** for catalogue/blog/reviews/faqs, **public create** for orders + customOrders (so the customer site can submit without auth), **authenticated write** for everything else.

---

## File storage layout

[firebase/storage.rules](firebase/storage.rules) — all paths: public read · admin write/delete · 5 MB max · `image/*` only.

```
gs://bloom-sydney.firebasestorage.app/
  ├── products/{timestamp}_{name}      Product photos
  ├── blog/{timestamp}_{name}          Blog cover images
  └── reviews/{timestamp}_{name}       Review photos
```

---

## Quick start

### Prerequisites
- Node.js 18+
- A Firebase project (free Spark plan is enough for development; Cloud Functions require Blaze plan once deployed)
- Firebase CLI: `npm install -g firebase-tools`

### 1 · Local setup
```bash
git clone <repo>
cd bloom-sydney
firebase login
firebase use --add        # select your Firebase project, alias = default
cd firebase/functions
npm install
cd ../..
```

### 2 · Configure secrets (Cloud Functions only)
```bash
firebase functions:config:set \
  stripe.secret_key="sk_live_..." \
  stripe.webhook_secret="whsec_..." \
  instagram.access_token="IGxxx..." \
  instagram.user_id="12345678901234" \
  twilio.account_sid="ACxxx..." \
  twilio.auth_token="xxx..." \
  twilio.whatsapp_from="+14155238886"
```
See [docs/INSTAGRAM_SETUP.md](docs/INSTAGRAM_SETUP.md) and [docs/TWILIO_SETUP.md](docs/TWILIO_SETUP.md) for how to obtain each value.

### 3 · Edit the public Firebase config
[firebase/web-config.js](firebase/web-config.js) ships with the live project's config. Replace it with your own `firebaseConfig` object from **Firebase Console → Project Settings → Web app** if you fork.

### 4 · Deploy
```bash
firebase deploy --only firestore:rules     # Firestore rules
firebase deploy --only storage             # Storage rules
firebase deploy --only functions           # All 8 Cloud Functions

# Or everything in one go:
firebase deploy
```

### 5 · Host the frontend
The `customer/`, `admin/`, and `blog/` folders are pure static. Two zero-config options:

- **GitHub Pages** (currently used) — push to `main`, enable Pages, done.
- **Firebase Hosting** — `firebase init hosting` (point at the repo root), `firebase deploy --only hosting`.

### 6 · Create the first admin user
1. Firebase Console → **Authentication** → **Users** → **Add user**
2. Open `admin/` in a browser → log in with that email/password.

---

## Local development

There's no dev server because there's no build step. Just open the HTML files. The Firebase JS SDK is loaded over CDN, so the page connects directly to your Firebase project the first time it runs in the browser.

For Cloud Functions:
```bash
cd firebase/functions
npm run serve     # starts the Firebase Functions emulator
```

---

## NSW alcohol-licence compliance

Built-in throughout because the business sells wine hampers:

- Every order has `hasAlcohol` saved on it for audit trail
- Admin order list shows a 🍷 badge for alcohol orders
- Packing slip shows ⚠️ ALCOHOL — ID VERIFICATION REQUIRED
- Settings page records the Packaged Liquor Licence number; surfaced in the customer-site footer
- Reviews / blog never auto-promote alcohol to age-unverified visitors

---

## Push notifications setup (PWA)

The admin dashboard is an **installable PWA** — add it to your phone's home screen and you'll get system-level push notifications when new orders arrive.

### One-time setup

1. **Generate the VAPID key** (browser → server identity for Web Push)
   - Firebase Console → ⚙️ **Project Settings** → **Cloud Messaging** tab
   - Scroll to **Web Push certificates** → **Generate key pair**
   - Copy the key (looks like `BHk7n…XYZ`, ~88 chars)

2. **Paste it into the admin config**
   - Open [admin/push-config.js](admin/push-config.js)
   - Set `VAPID_KEY = "BHk7n…XYZ"`
   - Commit. (The VAPID *public* key is meant to be exposed to the browser — safe to check in.)

3. **Deploy the new Cloud Functions + rules**
   ```bash
   firebase deploy --only functions:notifyAdminOnNewOrder,functions:notifyAdminOnNewCustomOrder
   firebase deploy --only firestore:rules
   ```

### Install on phone (per device)

1. Open the admin page in your phone browser
2. Sign in
3. **Add to Home Screen**:
   - **iOS Safari**: Share button (↑) → "Add to Home Screen"
   - **Android Chrome**: ⋮ menu → "Add to Home Screen" (or "Install app")
4. Open the new icon, tap **🔔 Enable alerts** in the top-right of the dashboard
5. Allow the browser permission prompt

That's it. From this point on, every time a new order or custom-order request is created in Firestore, every device that registered will get a push — even if the admin tab is closed and the phone is locked.

### How it works

```
Customer site             Firestore                 Cloud Function           FCM
─────────────             ─────────                 ──────────────           ───
checkout submit  ──────►  /orders/{id}.created  ─►  notifyAdminOnNewOrder ─► sendEachForMulticast
                                                                              │
                                                          ┌───────────────────┘
                                                          ▼
              Phone (locked screen)  ◄───────  Web Push  /admin_devices/{token}
              "🌸 New order — Sarah, $128 …"
              tap → opens /admin/#/orders
```

- Each admin device registers its FCM token under `admin_devices/{token}`.
- The Cloud Function reads the entire collection on every new order (cheap — it's a small list).
- Stale tokens (uninstalled apps) are auto-pruned when FCM rejects them.

### Files involved

| File | Role |
|---|---|
| [admin/manifest.json](admin/manifest.json) | PWA install metadata |
| [admin/icon-192.svg](admin/icon-192.svg), [admin/icon-512.svg](admin/icon-512.svg), [admin/icon-maskable.svg](admin/icon-maskable.svg) | App icons |
| [admin/firebase-messaging-sw.js](admin/firebase-messaging-sw.js) | Service worker — receives background pushes + offline shell cache |
| [admin/push-config.js](admin/push-config.js) | Holds the VAPID public key |
| [admin/admin.js](admin/admin.js) | `setupPushNotifications()` — permission flow + token save |
| [firebase/functions/index.js](firebase/functions/index.js) | `notifyAdminOnNewOrder`, `notifyAdminOnNewCustomOrder` |
| [firebase/firestore.rules](firebase/firestore.rules) | Allows signed-in admin to register tokens under `admin_devices/` |

---

## Recent change log

- **2026-05** — PWA + Web Push: admin dashboard installable on phone home-screen, system push notifications fire on every new order / custom request. New Cloud Functions: `notifyAdminOnNewOrder`, `notifyAdminOnNewCustomOrder`.
- **2026-05** — Image upload added to blog (cover) and reviews (per-review photo); Storage rules extended to `/blog` and `/reviews`. Same-Day product grid made fully responsive (1-up on mobile, up to 3-up on PC).
- **2026-04** — SEO-optimised blog with admin CRUD + 5 starter posts.
- **2026-04** — 2 PM same-day cutoff, 30-day pre-order window, delivery zones map, custom-order flow.
- **2026-04** — Real-time admin order alerts, Google Places address autocomplete, single-page checkout modal.

---

## License

MIT
