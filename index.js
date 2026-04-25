/**
 * test-whatsapp.js
 * Test Twilio WhatsApp Business API before deploying to Firebase
 * Run: node test-whatsapp.js
 */

// ── Fill these in ──────────────────────────────────────
const ACCOUNT_SID = "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
const AUTH_TOKEN  = "your_auth_token_here";
const FROM_NUMBER = "whatsapp:+14155238886"; // Twilio Sandbox number
const TEST_TO     = "whatsapp:+61XXXXXXXXX"; // Your phone (with country code)
// ──────────────────────────────────────────────────────

const twilio = require("twilio");

async function testWhatsApp() {
  const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

  console.log("\n🧪 Testing Twilio WhatsApp...\n");

  try {
    // Test 1: Basic message
    const basicMsg = await client.messages.create({
      from: FROM_NUMBER,
      to:   TEST_TO,
      body: "✅ Daily Bloom & Vine — WhatsApp connected successfully! This is a test message.",
    });
    console.log("✅ Basic message sent!");
    console.log(`   SID: ${basicMsg.sid}`);
    console.log(`   Status: ${basicMsg.status}`);

    await new Promise(r => setTimeout(r, 2000));

    // Test 2: Anniversary reminder format
    const reminderMsg = await client.messages.create({
      from: FROM_NUMBER,
      to:   TEST_TO,
      body: `🌸 Hey Sarah!\n\n*Wife's Birthday* is coming up in 14 days.\n\nWe've curated this season's most beautiful arrangement — and we'd love to help you make it special again.\n\n✨ Book now and get *10% early-bird discount*\n👉 https://dailybloom.au/pre-order\n\n_Daily Bloom & Vine · Carlingford, Sydney_`,
    });
    console.log("\n✅ Anniversary reminder format sent!");
    console.log(`   SID: ${reminderMsg.sid}`);

    console.log("\n🎉 All tests passed! Twilio WhatsApp is ready.\n");
    console.log("Next steps:");
    console.log("  1. firebase functions:config:set twilio.account_sid=AC... twilio.auth_token=... twilio.whatsapp_from=+14155238886");
    console.log("  2. firebase deploy --only functions\n");

  } catch (err) {
    console.error("\n❌ Error:", err.message);
    if (err.code === 20003) console.error("  → Invalid credentials. Check ACCOUNT_SID and AUTH_TOKEN.");
    if (err.code === 63007) console.error("  → WhatsApp number not in Sandbox. Send 'join <code>' to the Sandbox number first.");
    if (err.code === 21211) console.error("  → Invalid 'to' number. Format: whatsapp:+61XXXXXXXXX");
  }
}

testWhatsApp();
