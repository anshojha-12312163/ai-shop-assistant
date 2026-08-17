async function testGeocoding() {
  const query = "Jalandhar, Punjab, India";
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=in&format=json&limit=5`;

  console.log("Fetching Nominatim geocoding for:", query);
  const res = await fetch(url, { headers: { "User-Agent": "AIShopAssistant/1.0" } });
  const data = await res.json();

  console.log("Results count:", data.length);
  data.forEach((item: any, i: number) => {
    console.log(`\n[Result #${i + 1}] ${item.display_name}`);
    console.log(`   Lat: ${item.lat}, Lon: ${item.lon}`);
    console.log(`   Class: ${item.class}, Type: ${item.type}`);
  });
}

testGeocoding();
