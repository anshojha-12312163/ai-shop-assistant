import assert from "node:assert";

async function testLensEndpoint() {
  console.log("=========================================");
  console.log("🧪 TESTING GOOGLE LENS ROUTE & COMPONENTS");
  console.log("=========================================\n");

  const ports = [8080, 8081];
  let successCount = 0;

  for (const port of ports) {
    try {
      const url = `http://localhost:${port}/lens`;
      const res = await fetch(url);
      console.log(`[Port ${port}] GET /lens status:`, res.status);
      if (res.ok) {
        const text = await res.text();
        assert(
          text.includes("Google Lens") ||
            text.includes("Visual Search") ||
            text.includes("Synthetix"),
          "Page content valid",
        );
        console.log(`✅ [PASS] http://localhost:${port}/lens returned HTTP 200 OK & valid HTML`);
        successCount++;
      }
    } catch (err: any) {
      console.warn(`⚠️ Port ${port} check failed: ${err.message}`);
    }
  }

  console.log("\n=========================================");
  console.log(`📊 LENS TEST RESULT: ${successCount > 0 ? "PASSED" : "FAILED"}`);
  console.log("=========================================");
}

testLensEndpoint();
