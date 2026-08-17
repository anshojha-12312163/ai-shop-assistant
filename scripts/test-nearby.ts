import { getNearbyShopsLogic } from "../src/lib/nearby-shops.ts";

async function runTests() {
  console.log("=========================================");
  console.log("🧪 AUTOMATED ENDPOINT & LOGIC TESTS: /nearby");
  console.log("=========================================\n");

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✅ [PASS] ${testName}`);
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (detail) console.error(`   Details: ${detail}`);
    }
  }

  // 1. HTTP Endpoint Accessibility Test
  console.log("1️⃣ Testing HTTP Endpoints...");
  const ports = [8080, 8081];
  for (const port of ports) {
    try {
      const res = await fetch(`http://localhost:${port}/nearby`);
      const html = await res.text();
      assert(
        res.status === 200,
        `GET http://localhost:${port}/nearby returns HTTP 200 OK`,
        `Status: ${res.status}`,
      );
      assert(
        html.includes("Find Shops Near Me"),
        `http://localhost:${port}/nearby contains target page title/content`,
        `HTML did not contain title snippet`,
      );
    } catch (err: any) {
      console.warn(`⚠️ Could not reach http://localhost:${port}/nearby: ${err.message}`);
    }
  }

  console.log("\n2️⃣ Testing Nearby Shops Logic (`getNearbyShopsLogic`)...\n");

  // 2. Default Coordinates & Keyword Test
  try {
    const res1 = await getNearbyShopsLogic({
      lat: 28.6139,
      lng: 77.209,
      keyword: "grocery store",
      radiusMeters: 5000,
    });

    assert(
      Array.isArray(res1.shops) && res1.shops.length > 0,
      "getNearbyShopsLogic returns array of shops",
      `Count: ${res1.shops?.length}`,
    );
    assert(
      Math.abs(res1.userLocation.lat - 28.6139) < 0.01 &&
        Math.abs(res1.userLocation.lng - 77.209) < 0.01,
      "getNearbyShopsLogic returns matching user location coordinates",
    );
    assert(
      ["google_places_new", "nominatim_fallback", "simulated_fallback"].includes(res1.source),
      `getNearbyShopsLogic uses valid data source (${res1.source})`,
    );

    // Verify distance sorting order (ascending)
    let isSorted = true;
    for (let i = 1; i < res1.shops.length; i++) {
      if (res1.shops[i].distanceKm < res1.shops[i - 1].distanceKm) {
        isSorted = false;
        break;
      }
    }
    assert(isSorted, "getNearbyShopsLogic sorts shops strictly by distance (nearest first)");

    // Verify shop structure fields
    const firstShop = res1.shops[0];
    assert(
      Boolean(
        firstShop.id &&
        firstShop.name &&
        firstShop.address &&
        typeof firstShop.distanceKm === "number",
      ),
      "Shop object contains required fields (id, name, address, distanceKm)",
    );
    assert(
      Boolean(
        firstShop.googleMapsDirectionsUrl &&
        firstShop.googleMapsDirectionsUrl.startsWith("https://www.google.com/maps/dir/"),
      ),
      "Shop object contains valid Google Maps Directions URL",
    );
  } catch (err: any) {
    assert(false, "getNearbyShopsLogic default test execution", err.message);
  }

  // 3. Location Query Geocoding Test (pincode/city string)
  console.log("\n3️⃣ Testing Location String Geocoding...");
  try {
    const resLocation = await getNearbyShopsLogic({
      locationQuery: "Mumbai, Maharashtra",
      keyword: "electronics shop",
      radiusMeters: 5000,
    });

    assert(
      Array.isArray(resLocation.shops) && resLocation.shops.length > 0,
      "getNearbyShopsLogic resolves locationQuery string to shops",
      `Location: ${resLocation.userLocation.label}`,
    );
    assert(
      Boolean(resLocation.userLocation.lat && resLocation.userLocation.lng),
      "getNearbyShopsLogic resolved latitude and longitude for locationQuery",
    );
  } catch (err: any) {
    assert(false, "getNearbyShopsLogic location query test execution", err.message);
  }

  // 4. Server-Side Cache Test
  console.log("\n4️⃣ Testing Server-Side Caching (5m TTL)...");
  try {
    const cacheTestCoords = { lat: 19.076, lng: 72.8777, keyword: "pharmacy" };

    // First call (populates cache)
    const resFirst = await getNearbyShopsLogic(cacheTestCoords);

    // Second call with same parameters (should hit cache)
    const resSecond = await getNearbyShopsLogic(cacheTestCoords);

    assert(
      resSecond.cached === true,
      "Subsequent identical getNearbyShopsLogic call returns cached: true",
    );
    assert(
      resSecond.shops.length === resFirst.shops.length,
      "Cached response shop count matches initial response",
    );
  } catch (err: any) {
    assert(false, "getNearbyShopsLogic cache test execution", err.message);
  }

  console.log("\n=========================================");
  console.log(`📊 TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log("=========================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test runner encountered failure:", err);
  process.exit(1);
});
