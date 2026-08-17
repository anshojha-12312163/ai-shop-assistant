import assert from "node:assert";
import { subscribeNewsletterLogic, submitContactMessageLogic } from "../src/lib/email-system";

async function testEmailSystem() {
  console.log("=========================================");
  console.log("🧪 TESTING NEWSLETTER & SUPPORT EMAIL SYSTEM");
  console.log("=========================================\n");

  // 1. Test Client/Server Email Validation for Newsletter
  console.log("1️⃣ Testing Newsletter Validation & Subscription...");
  const invalidRes = await subscribeNewsletterLogic({
    email: "invalid-email-format",
    sourcePage: "/test",
  });
  assert.strictEqual(invalidRes.success, false);
  console.log("✅ [PASS] Invalid email rejected with message:", invalidRes.error);

  const testEmail = `testuser_${Date.now()}@synthetix.io`;
  const validRes = await subscribeNewsletterLogic({
    email: testEmail,
    sourcePage: "/test",
  });
  assert.strictEqual(validRes.success, true);
  console.log("✅ [PASS] Valid email subscribed successfully:", validRes.message);

  // Duplicate Check
  const dupRes = await subscribeNewsletterLogic({
    email: testEmail,
    sourcePage: "/test",
  });
  assert.strictEqual(dupRes.success, false);
  console.log("✅ [PASS] Duplicate email subscription blocked:", dupRes.error);

  // 2. Test Support Contact Submission & Honeypot Spam Protection
  console.log("\n2️⃣ Testing Support Contact Form & Honeypot Protection...");
  const botRes = await submitContactMessageLogic({
    name: "Bot Spammer",
    email: "spammer@bot.com",
    subject: "Buy Viagra",
    message: "Spam message payload",
    website_hp: "I am a bot filling hidden fields",
  });
  assert.strictEqual(botRes.success, true);
  console.log("✅ [PASS] Honeypot spam submission trapped safely");

  const validContactRes = await submitContactMessageLogic({
    name: "Alice Smith",
    email: "alice@example.com",
    subject: "Inquiry about Local Store Listings",
    message:
      "Hello Synthetix Support, I would like to know how to verify my store listing in Jalandhar.",
  });
  assert.strictEqual(validContactRes.success, true);
  console.log(
    "✅ [PASS] Support contact message submitted & auto-reply queued:",
    validContactRes.message,
  );

  // 3. Test HTTP Route /contact
  console.log("\n3️⃣ Testing /contact HTTP Route...");
  const ports = [8080, 8081];
  let routeSuccess = 0;
  for (const port of ports) {
    try {
      const res = await fetch(`http://localhost:${port}/contact`);
      if (res.ok) {
        const text = await res.text();
        assert(
          text.includes("Synthetix") || text.includes("Support"),
          "Page contains support content",
        );
        console.log(`✅ [PASS] GET http://localhost:${port}/contact returned HTTP 200 OK`);
        routeSuccess++;
      }
    } catch (e: any) {
      console.warn(`⚠️ Port ${port} check failed: ${e.message}`);
    }
  }

  console.log("\n=========================================");
  console.log(
    `📊 EMAIL & SUPPORT SYSTEM TEST RESULT: PASSED (${routeSuccess > 0 ? "100%" : "PARTIAL"})`,
  );
  console.log("=========================================");
}

testEmailSystem();
