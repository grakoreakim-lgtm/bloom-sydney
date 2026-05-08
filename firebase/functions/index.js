/**
 * Firebase Cloud Functions — Daily Bloom & Vine
 * Deploy: firebase deploy --only functions
 */
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Stripe = require("stripe");
const axios = require("axios");

admin.initializeApp();
const db = admin.firestore();

// ─────────────────────────────────────────────────────
// STRIPE — Create Payment Intent
// ─────────────────────────────────────────────────────
exports.createPaymentIntent = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }

  const stripe = new Stripe(functions.config().stripe.secret_key);

  try {
    const { amount, currency = "aud", orderId, customerEmail } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // cents
      currency,
      metadata: { orderId, customerEmail },
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────
// STRIPE — Webhook (order confirmation)
// ─────────────────────────────────────────────────────
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const stripe = new Stripe(functions.config().stripe.secret_key);
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      functions.config().stripe.webhook_secret
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object;
    const orderId = pi.metadata.orderId;
    await db.collection("orders").doc(orderId).update({
      paymentStatus: "PAID",
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
      stripePaymentIntentId: pi.id,
    });
    console.log(`✅ Order ${orderId} paid`);
  }

  res.json({ received: true });
});

// ─────────────────────────────────────────────────────
// ORDERS — Create Order
// ─────────────────────────────────────────────────────
exports.createOrder = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }

  try {
    const { name, email, phone, address, postcode, productId, deliveryDate, message, anniversary } = req.body;

    // Fetch product & check stock
    const today = new Date().toISOString().split("T")[0];
    const productRef = db.collection("daily_products").doc(today);
    const productSnap = await productRef.get();
    if (!productSnap.exists) return res.status(404).json({ error: "Product not found" });

    const product = productSnap.data().items.find(p => p.id === productId);
    if (!product || product.stock <= 0) return res.status(400).json({ error: "Out of stock" });

    // Calculate delivery fee
    const DELIVERY_FEES = { "2118":0,"2119":0,"2121":5,"2122":5,"2113":8,"2112":10 };
    const deliveryFee = DELIVERY_FEES[postcode] ?? 15;

    // Create order
    const orderRef = db.collection("orders").doc();
    await orderRef.set({
      id: orderRef.id,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      deliveryAddress: address,
      postcode,
      productId,
      productName: product.name,
      totalAmount: product.price + deliveryFee,
      deliveryFee,
      hasAlcohol: product.hasWine || false,
      deliveryDate: deliveryDate || today,
      message: message || "",
      deliveryStatus: "PENDING",
      paymentStatus: "UNPAID",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Save anniversary if requested
    if (anniversary && anniversary.date) {
      const customerRef = db.collection("customers").doc(email);
      await customerRef.set({ name, email, phone }, { merge: true });
      await customerRef.collection("anniversaries").add({
        label: anniversary.label,
        date: anniversary.date,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Decrement stock
    await productRef.update({
      items: productSnap.data().items.map(p =>
        p.id === productId ? { ...p, stock: p.stock - 1 } : p
      ),
    });

    res.json({ orderId: orderRef.id, totalAmount: product.price + deliveryFee });
  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────
// INSTAGRAM — Auto-post at 6 AM daily
// ─────────────────────────────────────────────────────
exports.scheduledInstagramPost = functions.pubsub
  .schedule("0 6 * * *")
  .timeZone("Australia/Sydney")
  .onRun(async () => {
    const today = new Date().toISOString().split("T")[0];
    const productSnap = await db.collection("daily_products").doc(today).get();
    if (!productSnap.exists) { console.log("No product for today"); return; }

    const product = productSnap.data();
    const accessToken = functions.config().instagram.access_token;
    const igUserId = functions.config().instagram.user_id;

    const caption = buildCaption(product);

    // Step 1: Create media container
    const containerRes = await axios.post(
      `https://graph.facebook.com/v18.0/${igUserId}/media`,
      { image_url: product.imageUrl, caption, access_token: accessToken }
    );

    // Step 2: Publish
    await axios.post(
      `https://graph.facebook.com/v18.0/${igUserId}/media_publish`,
      { creation_id: containerRes.data.id, access_token: accessToken }
    );

    await db.collection("daily_products").doc(today).update({
      instagramPosted: true,
      instagramPostedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Instagram posted for ${today}`);
  });

function buildCaption(product) {
  const mainItem = product.items?.[0];
  return `🌸 Today's collection is live!\n\n${product.items.map(p =>
    `✦ ${p.name}${p.pair ? ` & ${p.pair}` : ''} — $${p.price}`
  ).join('\n')}\n\nFreshly sourced from Flemington Market this morning. Order by 1 PM for same-day delivery across North-West Sydney 🚚\n\n👉 Link in bio\n.\n.\n#sydneyflowers #dailyblooms #sydneyflorist #flowerdeliverysydney #flemingtonmarket #winepairing #carlingford`;
}

// ─────────────────────────────────────────────────────
// INSTAGRAM — Refresh feed cache hourly
// ─────────────────────────────────────────────────────
exports.refreshInstagramFeed = functions.pubsub
  .schedule("0 * * * *")
  .timeZone("Australia/Sydney")
  .onRun(async () => {
    const accessToken = functions.config().instagram.access_token;
    const igUserId = functions.config().instagram.user_id;

    const res = await axios.get(
      `https://graph.facebook.com/v18.0/${igUserId}/media?fields=id,caption,media_url,thumbnail_url,timestamp&limit=12&access_token=${accessToken}`
    );

    await db.collection("cache").doc("instagram_feed").set({
      posts: res.data.data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log("✅ Instagram feed cache refreshed");
  });

// ─────────────────────────────────────────────────────
// INSTAGRAM — Refresh long-lived token (monthly)
// ─────────────────────────────────────────────────────
exports.refreshInstagramToken = functions.pubsub
  .schedule("0 9 1 * *")
  .timeZone("Australia/Sydney")
  .onRun(async () => {
    const accessToken = functions.config().instagram.access_token;
    const res = await axios.get(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${accessToken}`
    );
    const newToken = res.data.access_token;
    await functions.config().instagram.set({ access_token: newToken });
    console.log("✅ Instagram token refreshed. Expires in:", res.data.expires_in, "seconds");
  });

// ─────────────────────────────────────────────────────
// ANNIVERSARY — Daily reminder check at 9 AM
// ─────────────────────────────────────────────────────
exports.anniversaryReminders = functions.pubsub
  .schedule("0 9 * * *")
  .timeZone("Australia/Sydney")
  .onRun(async () => {
    const now = new Date();
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + 14); // 14 days ahead

    const customersSnap = await db.collection("customers").get();
    let sent = 0;

    for (const customerDoc of customersSnap.docs) {
      const customer = customerDoc.data();
      const anniversariesSnap = await customerDoc.ref.collection("anniversaries").get();

      for (const annivDoc of anniversariesSnap.docs) {
        const anniv = annivDoc.data();
        const [month, day] = anniv.date.split("/");
        const annivThisYear = new Date(now.getFullYear(), parseInt(month) - 1, parseInt(day));

        const diffDays = Math.round((annivThisYear - now) / (1000 * 60 * 60 * 24));

        if (diffDays === 14 || diffDays === 7 || diffDays === 2) {
          await sendWhatsAppReminder(customer, anniv, diffDays);
          sent++;
        }
      }
    }

    console.log(`✅ Anniversary reminders sent: ${sent}`);
  });

async function sendWhatsAppReminder(customer, anniversary, daysLeft) {
  // Using Twilio WhatsApp Business API
  const accountSid = functions.config().twilio.account_sid;
  const authToken = functions.config().twilio.auth_token;
  const fromNumber = functions.config().twilio.whatsapp_from;

  const message = `🌸 Hey ${customer.name}!\n\n*${anniversary.label}* is coming up in ${daysLeft} days.\n\nWe've curated this season's most beautiful arrangement — and we'd love to help you make it special again.\n\n✨ Book now and get *10% early-bird discount*\n👉 https://dailybloom.au/pre-order\n\n_Daily Bloom & Vine · Carlingford, Sydney_`;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  await axios.post(url,
    new URLSearchParams({
      From: `whatsapp:${fromNumber}`,
      To: `whatsapp:${customer.phone}`,
      Body: message,
    }),
    { auth: { username: accountSid, password: authToken } }
  );
}

// ─────────────────────────────────────────────────────
// PUSH — Notify admin devices when a new order arrives
// ─────────────────────────────────────────────────────
//
// Triggered on every new doc in /orders. Reads admin_devices/{token} for the
// list of registered admin phones/desktops and fan-outs an FCM push.
// Stale tokens are auto-pruned when FCM rejects them.
exports.notifyAdminOnNewOrder = functions.firestore
  .document("orders/{orderId}")
  .onCreate(async (snap, context) => {
    const order = snap.data() || {};
    const orderId = context.params.orderId;

    const itemSummary = Array.isArray(order.items) && order.items.length
      ? order.items.map(i => `${i.qty || 1}× ${i.name || i.productName || 'item'}`).join(", ")
      : (order.productName || "1 item");
    const total = typeof order.totalAmount === "number"
      ? `$${order.totalAmount.toFixed(2)}`
      : (order.totalAmount ? `$${order.totalAmount}` : "");

    const title = `🌸 New order — ${order.customerName || "customer"}`;
    const body  = [
      itemSummary,
      total,
      order.suburb ? `· ${order.suburb}` : (order.postcode ? `· ${order.postcode}` : ""),
      order.hasAlcohol ? "🍷" : ""
    ].filter(Boolean).join(" ").trim();

    return sendPushToAdmins({ title, body, route: "/orders", orderId });
  });

exports.notifyAdminOnNewCustomOrder = functions.firestore
  .document("customOrders/{reqId}")
  .onCreate(async (snap, context) => {
    const r = snap.data() || {};
    const title = `📞 Custom request — ${r.customerName || r.contact || "customer"}`;
    const body = [
      r.eventDate || r.deliveryDate || "",
      r.budget ? `· budget ${r.budget}` : "",
      r.brief ? `· ${String(r.brief).slice(0, 80)}` : ""
    ].filter(Boolean).join(" ").trim();

    return sendPushToAdmins({ title, body, route: "/customOrders", orderId: context.params.reqId });
  });

async function sendPushToAdmins({ title, body, route, orderId }) {
  const devicesSnap = await db.collection("admin_devices").get();
  if (devicesSnap.empty) { console.log("[push] no admin devices registered"); return; }

  const tokens = devicesSnap.docs.map(d => d.id); // doc id == FCM token
  if (!tokens.length) return;

  const message = {
    notification: { title, body },
    data: { route, orderId: String(orderId || ""), title, body, click_action: "/admin/" },
    webpush: {
      fcmOptions: { link: `/admin/#${route}` },
      notification: { icon: "/admin/icon-192.svg", badge: "/admin/icon-192.svg", requireInteraction: true }
    },
    tokens,
  };

  const resp = await admin.messaging().sendEachForMulticast(message);
  console.log(`[push] sent ${resp.successCount}/${tokens.length} (failed: ${resp.failureCount})`);

  // Prune stale / unregistered tokens
  const stale = [];
  resp.responses.forEach((r, i) => {
    if (!r.success) {
      const code = r.error?.code || "";
      if (code.includes("registration-token-not-registered") ||
          code.includes("invalid-argument") ||
          code.includes("invalid-registration-token")) {
        stale.push(tokens[i]);
      } else {
        console.warn("[push] send error:", code, r.error?.message);
      }
    }
  });
  await Promise.all(stale.map(t => db.collection("admin_devices").doc(t).delete().catch(() => {})));
  if (stale.length) console.log(`[push] pruned ${stale.length} stale tokens`);
}

// ─────────────────────────────────────────────────────
// DAILY CLEANUP — Archive yesterday's orders at midnight
// ─────────────────────────────────────────────────────
exports.dailyCleanup = functions.pubsub
  .schedule("0 0 * * *")
  .timeZone("Australia/Sydney")
  .onRun(async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split("T")[0];

    const ordersSnap = await db.collection("orders")
      .where("deliveryDate", "==", yStr)
      .where("deliveryStatus", "!=", "DELIVERED")
      .get();

    for (const doc of ordersSnap.docs) {
      await doc.ref.update({ deliveryStatus: "ARCHIVED" });
    }
    console.log(`✅ Archived ${ordersSnap.size} orders from ${yStr}`);
  });
