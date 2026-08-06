import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestPayload {
  lat: number;
  lng: number;
  radiusMeters?: number;
  category?: string;
  keyword?: string;
}

interface NormalizedShop {
  id: string;
  place_id?: string;
  name: string;
  category: string;
  description: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  review_count: number;
  open_now: boolean;
  phone?: string | null;
  image_url?: string | null;
  distance_miles?: number;
  match_score?: number;
  isFallback?: boolean;
}

// In-memory brief cache (5 minutes)
const cache = new Map<string, { timestamp: number; data: NormalizedShop[] }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function calculateDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Map app categories to Google Places types & keywords
function mapCategoryToGoogleParams(category?: string, keyword?: string) {
  const cat = (category || "").toLowerCase();
  let type = "store";
  let kw = keyword || "";

  if (cat.includes("footwear") || cat.includes("shoe")) {
    type = "shoe_store";
    kw = kw || "shoes footwear sneakers";
  } else if (cat.includes("cafe") || cat.includes("coffee")) {
    type = "cafe";
    kw = kw || "espresso coffee bakery";
  } else if (cat.includes("pharmacy") || cat.includes("medicine")) {
    type = "pharmacy";
    kw = kw || "drugstore health wellness";
  } else if (cat.includes("outdoor") || cat.includes("hiking")) {
    type = "sporting_goods_store";
    kw = kw || "hiking camping outdoor gear";
  } else if (cat.includes("home") || cat.includes("ceramic")) {
    type = "home_goods_store";
    kw = kw || "home decor ceramics pottery";
  } else if (cat.includes("grocery") || cat.includes("food")) {
    type = "supermarket";
    kw = kw || "grocery market artisan food";
  } else if (cat.includes("electronics")) {
    type = "electronics_store";
    kw = kw || "electronics gadgets tech";
  }

  return { type, keyword: kw };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: RequestPayload = await req.json().catch(() => ({
      lat: 47.6062,
      lng: -122.3321,
    }));

    const lat = payload.lat ?? 47.6062;
    const lng = payload.lng ?? -122.3321;
    const radiusMeters = payload.radiusMeters ?? 8000;
    const category = payload.category ?? "All";
    const keyword = payload.keyword ?? "";

    const cacheKey = `${lat.toFixed(3)}_${lng.toFixed(3)}_${radiusMeters}_${category}_${keyword}`;
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return new Response(JSON.stringify({ shops: cached.data, source: "cache" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY") || Deno.env.get("PLACES_API_KEY");
    let shops: NormalizedShop[] = [];
    let isFallback = false;

    if (apiKey) {
      try {
        const { type, keyword: googleKw } = mapCategoryToGoogleParams(category, keyword);
        const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radiusMeters}&type=${type}${googleKw ? `&keyword=${encodeURIComponent(googleKw)}` : ""}&key=${apiKey}`;

        const res = await fetch(placesUrl);
        if (res.ok) {
          const data = await res.json();
          if (data.results && Array.isArray(data.results) && data.results.length > 0) {
            shops = data.results.slice(0, 15).map((place: any) => {
              const photoRef = place.photos?.[0]?.photo_reference;
              const photoUrl = photoRef
                ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photo_reference=${photoRef}&key=${apiKey}`
                : `https://picsum.photos/seed/${place.place_id}/600/400`;

              const pLat = place.geometry?.location?.lat ?? lat;
              const pLng = place.geometry?.location?.lng ?? lng;
              const dist = calculateDistanceMiles(lat, lng, pLat, pLng);

              return {
                id: place.place_id,
                place_id: place.place_id,
                name: place.name,
                category: category !== "All" ? category : (place.types?.[0]?.replace(/_/g, " ") ?? "Retail"),
                description: place.vicinity ? `Located at ${place.vicinity}. Top-rated local merchant.` : "Local commercial store",
                address: place.vicinity ?? place.formatted_address ?? "Seattle, WA",
                lat: pLat,
                lng: pLng,
                rating: place.rating ?? 4.5,
                review_count: place.user_ratings_total ?? 42,
                open_now: place.opening_hours?.open_now ?? true,
                phone: null,
                image_url: photoUrl,
                distance_miles: dist,
                isFallback: false,
              };
            });
          }
        }
      } catch (err) {
        console.error("Google Places API error:", err);
      }
    }

    // Automatic fallback if API key unconfigured or query returned empty
    if (shops.length === 0) {
      isFallback = true;

      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY");

      if (supabaseUrl && supabaseKey) {
        const sb = createClient(supabaseUrl, supabaseKey);
        let query = sb.from("shops").select("*");

        if (category && category !== "All") {
          query = query.ilike("category", `%${category}%`);
        }

        const { data: dbShops } = await query;
        if (dbShops && dbShops.length > 0) {
          shops = dbShops.map((s: any) => ({
            ...s,
            distance_miles: calculateDistanceMiles(lat, lng, s.lat, s.lng),
            isFallback: true,
          }));
        }
      }

      // Hardcoded curated fallback if DB query empty
      if (shops.length === 0) {
        shops = [
          {
            id: "fallback-1",
            name: "Sole Craft Athletics",
            category: "Footwear",
            description: "Artisan sneaker & performance running shoe boutique featuring custom fitting.",
            address: "412 Pike St, Seattle, WA",
            lat: 47.6101,
            lng: -122.3365,
            rating: 4.9,
            review_count: 128,
            open_now: true,
            phone: "(206) 555-0192",
            image_url: "https://picsum.photos/seed/sole-craft/600/400",
            distance_miles: calculateDistanceMiles(lat, lng, 47.6101, -122.3365),
            isFallback: true,
          },
          {
            id: "fallback-2",
            name: "Velvet Espresso Bar",
            category: "Cafe",
            description: "Specialty coffee shop serving single-origin pour-overs and matcha.",
            address: "1400 2nd Ave, Seattle, WA",
            lat: 47.6090,
            lng: -122.3385,
            rating: 4.9,
            review_count: 340,
            open_now: true,
            phone: "(206) 555-0410",
            image_url: "https://picsum.photos/seed/velvet-espresso/600/400",
            distance_miles: calculateDistanceMiles(lat, lng, 47.6090, -122.3385),
            isFallback: true,
          },
          {
            id: "fallback-3",
            name: "Apothecary & Wellness Co.",
            category: "Pharmacy",
            description: "Full-service pharmacy offering natural wellness products and prescriptions.",
            address: "1215 4th Ave, Seattle, WA",
            lat: 47.6088,
            lng: -122.3352,
            rating: 4.8,
            review_count: 210,
            open_now: true,
            phone: "(206) 555-0320",
            image_url: "https://picsum.photos/seed/apothecary-wellness/600/400",
            distance_miles: calculateDistanceMiles(lat, lng, 47.6088, -122.3352),
            isFallback: true,
          },
          {
            id: "fallback-4",
            name: "Cascade Mountain Outfitters",
            category: "Outdoor Gear",
            description: "Premium hiking boots, rain jackets, and camping accessories.",
            address: "1530 Post Alley, Seattle, WA",
            lat: 47.6098,
            lng: -122.3412,
            rating: 4.9,
            review_count: 180,
            open_now: true,
            phone: "(206) 555-0511",
            image_url: "https://picsum.photos/seed/cascade-outfitters/600/400",
            distance_miles: calculateDistanceMiles(lat, lng, 47.6098, -122.3412),
            isFallback: true,
          },
        ];
      }
    }

    // Cache non-empty result
    cache.set(cacheKey, { timestamp: Date.now(), data: shops });

    return new Response(
      JSON.stringify({
        shops,
        source: isFallback ? "fallback" : "google_places",
        isFallbackMode: isFallback,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("places-search function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Search error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
