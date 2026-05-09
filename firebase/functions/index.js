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

// Helper: read config without crashing if a section isn't set yet
function cfg() {
  try { return functions.config() || {}; } catch { return {}; }
}

function corsHeaders(res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
}

// ─────────────────────────────────────────────────────
// STRIPE — Create Payment Intent
// Customer site calls this with the order draft. We persist the order as
// PENDING_PAYMENT, create a PaymentIntent, and return the clientSecret so
// Stripe Elements can complete the payment in the browser.
// ─────────────────────────────────────────────────────
exports.createPaymentIntent = functions.https.onRequest(async (req, res) => {
  corsHeaders(res);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }

  const secret = cfg().stripe?.secret_key;
  if (!secret) {
    return res.status(503).json({ error: "Stripe not configured. Run firebase functions:config:set stripe.secret_key=…" });
  }
  const stripe = new Stripe(secret);

  try {
    const { order } = req.body || {};
    if (!order || typeof order.total !== "number" || order.total <= 0) {
      return res.status(400).json({ error: "Invalid order payload (missing total)" });
    }

    // Persist a draft order so we have something to update from the webhook
    const orderRef = db.collection("orders").doc();
    await orderRef.set({
      ...order,
      id: orderRef.id,
      paymentStatus: "PENDING_PAYMENT",
      paymentProvider: "stripe",
      status: "new",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100), // cents
      currency: (order.currency || "aud").toLowerCase(),
      metadata: { orderId: orderRef.id, customerEmail: order.customerEmail || "" },
      receipt_email: order.customerEmail || undefined,
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: paymentIntent.client_secret, orderId: orderRef.id });
  } catch (err) {
    console.error("[stripe] createPaymentIntent error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────
// STRIPE — Webhook
// Stripe POSTs here on payment_intent.succeeded / failed. We update the
// matching order document. Email confirmation is handled by onOrderPaid below.
// ─────────────────────────────────────────────────────
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const secret      = cfg().stripe?.secret_key;
  const whSecret    = cfg().stripe?.webhook_secret;
  if (!secret || !whSecret) return res.status(503).send("Stripe not configured");

  const stripe = new Stripe(secret);
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, whSecret);
  } catch (err) {
    console.error("[stripe] webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object;
      const orderId = pi.metadata?.orderId;
      if (orderId) {
        await db.collection("orders").doc(orderId).update({
          paymentStatus: "PAID",
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
          stripePaymentIntentId: pi.id,
          stripeChargeId: pi.latest_charge || null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`[stripe] ✅ order ${orderId} paid`);
      }
    } else if (event.type === "payment_intent.payment_failed") {
      const pi = event.data.object;
      const orderId = pi.metadata?.orderId;
      if (orderId) {
        await db.collection("orders").doc(orderId).update({
          paymentStatus: "FAILED",
          paymentFailureReason: pi.last_payment_error?.message || "unknown",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    } else if (event.type === "charge.refunded") {
      const ch = event.data.object;
      const piId = ch.payment_intent;
      const ordersSnap = await db.collection("orders").where("stripePaymentIntentId", "==", piId).limit(1).get();
      if (!ordersSnap.empty) {
        await ordersSnap.docs[0].ref.update({
          paymentStatus: "REFUNDED",
          refundedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }
  } catch (err) {
    console.error("[stripe] webhook handler error:", err);
  }

  res.json({ received: true });
});

// ─────────────────────────────────────────────────────
// PAYPAL — Create Order
// Customer clicks the PayPal button. Browser calls this; we create a PayPal
// order via PayPal's API and return the orderID for the SDK to redirect.
// ─────────────────────────────────────────────────────
exports.createPayPalOrder = functions.https.onRequest(async (req, res) => {
  corsHeaders(res);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }

  const ppCfg = cfg().paypal || {};
  if (!ppCfg.client_id || !ppCfg.secret) {
    return res.status(503).json({ error: "PayPal not configured" });
  }
  const apiBase = (ppCfg.mode || "sandbox") === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

  try {
    const { order } = req.body || {};
    if (!order || typeof order.total !== "number" || order.total <= 0) {
      return res.status(400).json({ error: "Invalid order payload" });
    }

    // Get OAuth token
    const tokenRes = await axios.post(
      `${apiBase}/v1/oauth2/token`,
      "grant_type=client_credentials",
      {
        auth: { username: ppCfg.client_id, password: ppCfg.secret },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );
    const accessToken = tokenRes.data.access_token;

    // Persist draft order
    const orderRef = db.collection("orders").doc();
    await orderRef.set({
      ...order,
      id: orderRef.id,
      paymentStatus: "PENDING_PAYMENT",
      paymentProvider: "paypal",
      status: "new",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create PayPal order
    const ppRes = await axios.post(
      `${apiBase}/v2/checkout/orders`,
      {
        intent: "CAPTURE",
        purchase_units: [{
          reference_id: orderRef.id,
          amount: {
            currency_code: (order.currency || "AUD").toUpperCase(),
            value: order.total.toFixed(2),
          },
          description: `Bloom & Vine — ${(order.items || []).map(i => i.name).join(", ").slice(0, 120) || "Order"}`,
        }],
        application_context: {
          brand_name: "Bloom & Vine",
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
        },
      },
      { headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" } }
    );

    await orderRef.update({ paypalOrderId: ppRes.data.id });
    res.json({ paypalOrderId: ppRes.data.id, orderId: orderRef.id });
  } catch (err) {
    console.error("[paypal] createOrder error:", err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────
// PAYPAL — Capture Order
// Called by the PayPal button after the customer approves. We capture the
// payment server-side and mark the order PAID.
// ─────────────────────────────────────────────────────
exports.capturePayPalOrder = functions.https.onRequest(async (req, res) => {
  corsHeaders(res);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }

  const ppCfg = cfg().paypal || {};
  if (!ppCfg.client_id || !ppCfg.secret) {
    return res.status(503).json({ error: "PayPal not configured" });
  }
  const apiBase = (ppCfg.mode || "sandbox") === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

  try {
    const { paypalOrderId } = req.body || {};
    if (!paypalOrderId) return res.status(400).json({ error: "Missing paypalOrderId" });

    const tokenRes = await axios.post(
      `${apiBase}/v1/oauth2/token`,
      "grant_type=client_credentials",
      {
        auth: { username: ppCfg.client_id, password: ppCfg.secret },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );
    const accessToken = tokenRes.data.access_token;

    const captureRes = await axios.post(
      `${apiBase}/v2/checkout/orders/${paypalOrderId}/capture`,
      {},
      { headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" } }
    );

    const captureData = captureRes.data;
    const purchaseUnit = captureData.purchase_units?.[0];
    const captureId = purchaseUnit?.payments?.captures?.[0]?.id;
    const ourOrderId = purchaseUnit?.reference_id;

    if (ourOrderId) {
      await db.collection("orders").doc(ourOrderId).update({
        paymentStatus: "PAID",
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
        paypalCaptureId: captureId || null,
        paypalPayer: captureData.payer || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`[paypal] ✅ order ${ourOrderId} paid (capture ${captureId})`);
    }

    res.json({ ok: true, orderId: ourOrderId, captureId });
  } catch (err) {
    console.error("[paypal] capture error:", err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
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
// (Skips if today's daily_prep journal will/has already posted to IG)
// ─────────────────────────────────────────────────────
exports.scheduledInstagramPost = functions.pubsub
  .schedule("0 6 * * *")
  .timeZone("Australia/Sydney")
  .onRun(async () => {
    const today = new Date().toISOString().split("T")[0];

    // Skip if a daily_prep entry exists with postToIG enabled — it'll post itself
    // (or has already, when the admin published it).
    const prepSnap = await db.collection("daily_prep").doc(today).get();
    if (prepSnap.exists && prepSnap.data().postToIG !== false) {
      console.log(`[scheduledInstagramPost] daily_prep exists for ${today}, skipping product cron`);
      return;
    }

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
// PAYMENT CONFIRMATION — Send email + admin push when an order becomes PAID
//
// Fires on /orders/{id} update where paymentStatus changed to PAID.
// Also fires on create if the order was inserted already-paid (e.g. PayPal flow).
// ─────────────────────────────────────────────────────
exports.onOrderPaid = functions.firestore
  .document("orders/{orderId}")
  .onWrite(async (change, context) => {
    const after  = change.after.exists  ? change.after.data()  : null;
    const before = change.before.exists ? change.before.data() : null;
    if (!after) return;

    const wasPaid = before && before.paymentStatus === "PAID";
    const isPaid  = after.paymentStatus === "PAID";
    if (!isPaid || wasPaid) return; // only on the transition into PAID

    const orderId = context.params.orderId;
    console.log(`[onOrderPaid] order ${orderId} just became PAID — triggering side effects`);

    // 1. Customer confirmation email (via Trigger Email extension — writes to /mail)
    if (after.customerEmail) {
      try {
        await db.collection("mail").add(buildCustomerEmail(orderId, after));
        console.log(`[onOrderPaid] queued customer email to ${after.customerEmail}`);
      } catch (err) {
        console.error("[onOrderPaid] customer email queue failed:", err);
      }
    }

    // 2. Admin notification email
    try {
      const settingsSnap = await db.collection("settings").doc("business").get();
      const adminEmail = settingsSnap.exists ? settingsSnap.data().email : null;
      if (adminEmail) {
        await db.collection("mail").add(buildAdminEmail(orderId, after, adminEmail));
        console.log(`[onOrderPaid] queued admin email to ${adminEmail}`);
      }
    } catch (err) {
      console.error("[onOrderPaid] admin email queue failed:", err);
    }

    // 3. Admin push notification (FCM) — reuse existing helper
    const itemSummary = (after.items || []).map(i => `${i.quantity || 1}× ${i.name || ""}`).join(", ");
    const total = typeof after.total === "number" ? `$${after.total.toFixed(2)}` : "";
    try {
      await sendPushToAdmins({
        title: `💰 Payment received — ${after.customerName || "customer"}`,
        body: [itemSummary, total, after.deliverySuburb ? `· ${after.deliverySuburb}` : ""].filter(Boolean).join(" "),
        route: "/orders",
        orderId,
      });
    } catch (err) {
      console.error("[onOrderPaid] push notify failed:", err);
    }
  });

function fmtAUD(n) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(Number(n) || 0);
}

function buildCustomerEmail(orderId, order) {
  const items = (order.items || []).map(i =>
    `<tr><td style="padding:8px 0;color:#1A1A1A">${i.quantity || 1}× ${i.name || ""}</td>` +
    `<td style="padding:8px 0;text-align:right;color:#1A1A1A">${fmtAUD((Number(i.price) || 0) * (Number(i.quantity) || 1))}</td></tr>`
  ).join("");

  const html = `
  <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1A1A1A;line-height:1.5">
    <div style="text-align:center;padding:18px 0 22px;border-bottom:2px solid #6B2D20">
      <h1 style="font-size:22px;margin:0;color:#6B2D20;letter-spacing:-0.02em">Bloom &amp; Vine</h1>
      <p style="font-size:13px;color:#767676;margin:4px 0 0">Sydney · Daily Flower &amp; Wine Service</p>
    </div>

    <h2 style="font-size:18px;margin:24px 0 8px">Thank you, ${order.customerName || "friend"}.</h2>
    <p style="margin:0 0 18px;color:#4A4A4A">We've received your order and the team starts preparing it the morning of delivery.</p>

    <div style="background:#FDF7F4;border-radius:8px;padding:16px 18px;margin:18px 0">
      <div style="font-size:11px;font-weight:700;letter-spacing:.14em;color:#767676;text-transform:uppercase;margin-bottom:8px">Order ${orderId.slice(0,8).toUpperCase()}</div>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        ${items}
        <tr><td colspan="2" style="padding-top:10px;border-top:1px solid #E0DBD4"></td></tr>
        <tr><td style="padding:4px 0;color:#767676">Subtotal</td><td style="padding:4px 0;text-align:right;color:#4A4A4A">${fmtAUD(order.subtotal)}</td></tr>
        <tr><td style="padding:4px 0;color:#767676">Delivery</td><td style="padding:4px 0;text-align:right;color:#4A4A4A">${order.deliveryFee === 0 ? "FREE" : fmtAUD(order.deliveryFee)}</td></tr>
        <tr><td style="padding:8px 0;font-weight:700">Total</td><td style="padding:8px 0;text-align:right;font-weight:700;font-size:16px">${fmtAUD(order.total)}</td></tr>
      </table>
    </div>

    <h3 style="font-size:14px;margin:20px 0 6px;color:#6B2D20">Delivery</h3>
    <p style="margin:0 0 4px"><strong>${order.deliveryDate || "(date)"}</strong> · ${order.deliverySlot || ""}</p>
    <p style="margin:0 0 4px;color:#4A4A4A">${order.deliveryAddress || ""}, ${order.deliverySuburb || ""} ${order.deliveryPostcode || ""}</p>
    ${order.cardMessage ? `<p style="margin:14px 0 0;padding:12px 14px;background:#F9F6F2;border-left:3px solid #6B2D20;color:#4A4A4A;font-style:italic">"${order.cardMessage}"</p>` : ""}

    <p style="margin:30px 0 6px;font-size:13px;color:#4A4A4A">A reminder: ${order.hasAlcohol ? "this order contains alcohol — the recipient must be 18+ and present photo ID at delivery (NSW Liquor Act)." : "you'll receive a tracking SMS the morning of delivery."}</p>
    <p style="margin:8px 0 0;font-size:13px;color:#4A4A4A">Need to make changes? Just reply to this email.</p>

    <hr style="border:none;border-top:1px solid #E0DBD4;margin:30px 0 16px"/>
    <p style="font-size:11px;color:#767676;text-align:center;margin:0">Bloom &amp; Vine · Carlingford NSW 2118 · Sydney<br/>Hand-picked every morning at Flemington Market.</p>
  </div>`;

  return {
    to: order.customerEmail,
    message: {
      subject: `Order confirmed — Bloom & Vine #${orderId.slice(0, 8).toUpperCase()}`,
      html,
    },
  };
}

function buildAdminEmail(orderId, order, adminEmail) {
  const items = (order.items || []).map(i => `${i.quantity || 1}× ${i.name || ""}`).join(", ");
  const html = `
  <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;color:#1A1A1A;line-height:1.5">
    <h2 style="font-size:18px;margin:0 0 14px;color:#6B2D20">💰 New paid order</h2>
    <table style="font-size:14px;border-collapse:collapse;width:100%">
      <tr><td style="padding:4px 12px 4px 0;color:#767676;width:130px">Order ID</td><td>${orderId}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#767676">Customer</td><td>${order.customerName || ""}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#767676">Phone</td><td>${order.customerPhone || ""}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#767676">Email</td><td>${order.customerEmail || ""}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#767676">Items</td><td>${items}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#767676">Total</td><td><strong>${fmtAUD(order.total)}</strong> (${order.paymentProvider || "—"})</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#767676">Deliver</td><td>${order.deliveryDate || ""} · ${order.deliverySlot || ""}<br/>${order.deliveryAddress || ""}, ${order.deliverySuburb || ""} ${order.deliveryPostcode || ""}</td></tr>
      ${order.hasAlcohol ? `<tr><td style="padding:4px 12px 4px 0;color:#A53A2A">⚠️ Alcohol</td><td style="color:#A53A2A;font-weight:600">ID check required</td></tr>` : ""}
      ${order.cardMessage ? `<tr><td style="padding:4px 12px 4px 0;color:#767676;vertical-align:top">Card msg</td><td>"${order.cardMessage}"</td></tr>` : ""}
    </table>
    <p style="margin:18px 0 0;font-size:12px;color:#767676">Open in admin: <a href="https://grakoreakim-lgtm.github.io/bloom-sydney/admin/#/orders" style="color:#6B2D20">/admin/#/orders</a></p>
  </div>`;

  return {
    to: adminEmail,
    message: {
      subject: `[Bloom Admin] 💰 New paid order — ${order.customerName || "customer"} ${fmtAUD(order.total)}`,
      html,
    },
  };
}

// ─────────────────────────────────────────────────────
// DAILY PREP — Cross-post to Instagram on publish
// Fires when a /daily_prep/{date} doc is created or updated.
// Posts the cover photo + a generated caption to Instagram, then marks
// the doc as igPosted so we don't double-post on edits.
// ─────────────────────────────────────────────────────
exports.postDailyPrepToInstagram = functions.firestore
  .document("daily_prep/{date}")
  .onWrite(async (change, context) => {
    const after  = change.after.exists  ? change.after.data()  : null;
    if (!after) return;
    if (after.postToIG === false) return;
    if (after.igPosted === true) return;
    if (!Array.isArray(after.photos) || after.photos.length === 0) return;

    const igCfg = cfg().instagram || {};
    const accessToken = igCfg.access_token;
    const igUserId    = igCfg.user_id;
    if (!accessToken || !igUserId) {
      console.log("[postDailyPrepToInstagram] Instagram not configured, skipping");
      return;
    }

    const date = context.params.date;
    const cover = after.photos[0];
    const location = after.location || "Flemington Markets";
    const time = after.marketTime || "this morning";
    const body = (after.bodyText || "").trim();

    const caption = [
      `🌸 ${time} at ${location}`,
      ``,
      body || `Today's hand-picked flowers from our Carlingford studio.`,
      ``,
      `→ Link in bio for today's bouquets`,
      ``,
      `.`,
      `.`,
      `#sydneyflorist #flemingtonmarket #freshflowers #flowerdeliverysydney #carlingford #sydneyflowers #dailybloom #floristsydney #northshore #behindthescenes`,
    ].join("\n");

    try {
      // Step 1: create media container
      const containerRes = await axios.post(
        `https://graph.facebook.com/v18.0/${igUserId}/media`,
        { image_url: cover.url, caption, access_token: accessToken }
      );

      // Step 2: publish
      await axios.post(
        `https://graph.facebook.com/v18.0/${igUserId}/media_publish`,
        { creation_id: containerRes.data.id, access_token: accessToken }
      );

      await db.collection("daily_prep").doc(date).update({
        igPosted: true,
        igPostedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`[postDailyPrepToInstagram] ✅ posted ${date} to Instagram`);
    } catch (err) {
      console.error("[postDailyPrepToInstagram] error:", err.response?.data || err.message);
      // Don't mark as posted, so the next edit retries
    }
  });

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
