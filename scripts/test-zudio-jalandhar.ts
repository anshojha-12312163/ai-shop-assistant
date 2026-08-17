import { getNearbyShopsLogic } from "../src/lib/nearby-shops.ts";

async function verifyZudioJalandhar() {
  console.log("=========================================");
  console.log("🧪 TESTING SEARCH: 'Zudio Jalandhar'");
  console.log("=========================================\n");

  const res = await getNearbyShopsLogic({
    keyword: "zudio jalandhar",
  });

  console.log("📍 User Resolved Location Label:", res.userLocation.label);
  console.log("📍 User Lat / Lng:", res.userLocation.lat, res.userLocation.lng);
  console.log("🏪 Total Stores Returned:", res.shops.length);
  console.log("📊 Data Source:", res.source);
  console.log("\n--- STORE CARDS OUTPUT ---");

  res.shops.forEach((shop, index) => {
    console.log(`\n[Card #${index + 1}] ${shop.name}`);
    console.log(`   📍 Address: ${shop.address}`);
    console.log(`   📏 Distance: ${shop.distanceText}`);
    console.log(`   ⭐ Rating: ${shop.rating} (${shop.reviewCount} reviews)`);
    console.log(`   🗺️ Directions: ${shop.googleMapsDirectionsUrl}`);
  });

  console.log("\n=========================================");

  // Verification Assertions
  const isIndia =
    res.userLocation.label.toLowerCase().includes("india") ||
    res.userLocation.label.toLowerCase().includes("jalandhar") ||
    res.shops.some(
      (s) =>
        s.address.toLowerCase().includes("india") ||
        s.address.toLowerCase().includes("jalandhar") ||
        s.address.toLowerCase().includes("punjab"),
    );

  if (isIndia && res.shops.length > 0) {
    console.log("✅ SUCCESS: Search 'Zudio Jalandhar' correctly resolved to Jalandhar, India!");
  } else {
    console.error("❌ FAIL: Location was not localized to India.");
    process.exit(1);
  }
}

verifyZudioJalandhar().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
