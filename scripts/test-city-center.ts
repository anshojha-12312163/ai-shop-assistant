async function testCityGeocoding(cityName: string) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName + ", India")}&countrycodes=in&format=json&limit=5`;
  const res = await fetch(url, { headers: { "User-Agent": "AIShopAssistant/1.0" } });
  const data = await res.json();

  console.log(`\n=========================================`);
  console.log(`📍 Geocoding Query: "${cityName}, India"`);
  console.log(`=========================================`);

  // Find best city center match (place = city/town/locality)
  const bestMatch =
    data.find((d: any) => d.type === "city" || d.type === "town" || d.class === "place") || data[0];

  if (bestMatch) {
    console.log(`✅ Best Match: ${bestMatch.display_name}`);
    console.log(`   Lat: ${bestMatch.lat}, Lon: ${bestMatch.lon}`);
    console.log(`   Class: ${bestMatch.class}, Type: ${bestMatch.type}`);
  }
}

async function run() {
  await testCityGeocoding("Jalandhar");
  await testCityGeocoding("Ludhiana");
  await testCityGeocoding("Amritsar");
  await testCityGeocoding("Chandigarh");
}

run();
