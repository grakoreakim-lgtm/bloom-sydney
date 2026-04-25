# 🌷 Daily Bloom & Vine — Sydney

> A daily flower + wine hamper delivery service based in Carlingford, Sydney.
> Full-stack: customer shop, admin dashboard, Firebase backend, Stripe payments, Instagram auto-posting, WhatsApp anniversary reminders.

---

## Project Structure

```
bloom-sydney/
│
├── customer/
│   └── shop.html              ← Customer-facing shop (3-tier: Pre-Order / Same-Day / Subscription)
│
├── admin/
│   └── BloomAdmin.jsx         ← React admin dashboard (Next.js App Router)
│
├── firebase/
│   ├── functions/
│   │   ├── index.js           ← All Cloud Functions (Stripe, Orders, Instagram, Reminders, Cleanup)
│   │   └── package.json
│   └── firestore.rules        ← Security rules
│
├── nextjs/
│   └── components/
│       └── InstagramFeed.tsx  ← Instagram feed component (reads Firestore cache)
│
└── docs/
    ├── test-whatsapp.js       ← Test Twilio WhatsApp before deploying
    ├── INSTAGRAM_SETUP.md     ← Instagram Business API setup guide
    └── TWILIO_SETUP.md        ← Twilio WhatsApp setup guide
```

---

## Customer Shop (`customer/shop.html`)

Three-tier product system:

| Tier | Description | Target Customer |
|---|---|---|
| 📅 **Pre-Order** | Published D-7, lock in arrangement early | Planners, gift givers, anniversary shoppers |
| 🌸 **Same-Day** | Order by 1 PM, delivered today | Impulse buyers, last-minute gifts |
| 🔁 **Subscription** | Weekly / Fortnightly / Monthly auto-delivery | Loyal customers, lock-in |

**Features:**
- Week date selector for pre-orders (7-day lookahead)
- Real-time stock display + sold-out state
- Postcode-based delivery fee calculator
- Anniversary registration at checkout (lock-in engine)
- Apple Pay / Google Pay / Card payment UI
- Instagram feed grid (Firestore cache)
- Subscription plan cards with frequency toggle

---

## Admin Dashboard (`admin/BloomAdmin.jsx`)

14 fully-implemented pages:

| Section | Pages |
|---|---|
| **Daily Ops** | Dashboard · Flemington List · Orders · Packing Slip · Delivery Route |
| **Catalogue** | Today's Flower · Products & Stock · Wine Pairing |
| **Customers** | Customer DB · Anniversary Calendar · Subscriptions |
| **Growth** | Analytics · Instagram Sync · Settings |

**Key features added vs standard admin:**
- 🍷 Alcohol ID-check badge (NSW Liquor Act compliance)
- ✿ Flemington shopping list (auto-calculated, checkable, printable)
- ◻ Packing Slip with printable message card + delivery address
- ◎ Delivery route optimizer (Google Maps ready)
- ⏱️ Real-time order cutoff countdown
- 🔔 New order toast notification

---

## Firebase Functions (`firebase/functions/index.js`)

| Function | Trigger | Description |
|---|---|---|
| `createPaymentIntent` | HTTP | Stripe PaymentIntent creation |
| `stripeWebhook` | HTTP | Payment confirmation → update Firestore |
| `createOrder` | HTTP | Save order, decrement stock, register anniversary |
| `scheduledInstagramPost` | Cron 6:00 AM AEST | Auto-post today's product to Instagram |
| `refreshInstagramFeed` | Cron hourly | Cache Instagram feed to Firestore |
| `refreshInstagramToken` | Cron monthly | Refresh long-lived Instagram API token |
| `anniversaryReminders` | Cron 9:00 AM AEST | Send WhatsApp reminders at D-14, D-7, D-2 |
| `dailyCleanup` | Cron midnight | Archive previous day's undelivered orders |

---

## Firestore Collections

```
daily_products/{YYYY-MM-DD}
  ├── items: [{ id, name, price, stock, hasWine, imageUrl, ... }]
  ├── instagramPosted: boolean
  └── instagramPostedAt: timestamp

orders/{orderId}
  ├── customerName, customerEmail, customerPhone
  ├── deliveryAddress, postcode
  ├── productId, productName, totalAmount, deliveryFee
  ├── hasAlcohol: boolean           ← NSW compliance
  ├── deliveryStatus: PENDING | PACKING | DISPATCHED | DELIVERED
  ├── paymentStatus: UNPAID | PAID
  └── message, deliveryDate, createdAt

customers/{email}
  ├── name, email, phone
  └── anniversaries/{annivId}
        ├── label: "Wife's Birthday"
        └── date: "05/12"  (MM/DD, year-agnostic)

subscriptions/{subId}
  ├── customerEmail, plan, frequency
  ├── nextDate, autoRenew, status
  └── productPreference

cache/instagram_feed
  ├── posts: [{ id, media_url, caption, timestamp }]
  └── updatedAt: timestamp
```

---

## Quick Start

### 1. Firebase Setup
```bash
npm install -g firebase-tools
firebase login
firebase init   # select Functions, Firestore, Hosting
cd firebase/functions && npm install
```

### 2. Set Environment Config
```bash
firebase functions:config:set \
  stripe.secret_key="sk_live_..." \
  stripe.webhook_secret="whsec_..." \
  instagram.access_token="IGxxx..." \
  instagram.user_id="12345678" \
  twilio.account_sid="ACxxx..." \
  twilio.auth_token="xxx..." \
  twilio.whatsapp_from="+14155238886"
```

### 3. Deploy
```bash
firebase deploy --only functions
firebase deploy --only firestore:rules
```

### 4. Admin Dashboard (Next.js)
```bash
# Copy BloomAdmin.jsx into your Next.js project
cp admin/BloomAdmin.jsx your-nextjs-app/app/admin/page.jsx

# Replace MOCK DATA constants at the top of BloomAdmin.jsx
# with real Firestore fetches using the collection structure above
```

### 5. Test WhatsApp
```bash
cd docs
npm install twilio
# Edit test-whatsapp.js with your credentials
node test-whatsapp.js
```

---

## Stack

| Layer | Tech |
|---|---|
| **Frontend (Customer)** | Vanilla HTML/CSS/JS (deploy to Netlify/Firebase Hosting) |
| **Frontend (Admin)** | Next.js 14 + React 18 (App Router) |
| **Backend** | Firebase Cloud Functions (Node 18) |
| **Database** | Firestore |
| **Payments** | Stripe (Apple Pay, Google Pay, Card) |
| **Notifications** | Twilio WhatsApp Business API |
| **Social** | Instagram Graph API (auto-post + feed cache) |
| **Hosting** | Firebase Hosting / Netlify |

---

## NSW Compliance

- All alcohol orders display 🍷 ID badge across admin views
- Packing slip shows ⚠️ ALCOHOL — ID VERIFICATION REQUIRED
- `hasAlcohol` field stored on every order for audit trail
- Settings page shows Packaged Liquor Licence configuration
- Delivery route highlights alcohol orders for driver

---

## License

MIT
