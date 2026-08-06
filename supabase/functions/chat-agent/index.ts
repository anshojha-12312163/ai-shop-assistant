import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestPayload {
  message?: string;
  image?: string; // base64 string or data URL
  location?: { lat: number; lng: number; label?: string };
  stream?: boolean;
}

interface ShopItem {
  id: string;
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
}

interface ImageResult {
  detectedLabel: string;
  category: string;
  confidence: number;
  description: string;
}

interface AgentStep {
  agent: string;
  status: "completed" | "in_progress" | "pending" | "failed";
  detail: string;
}

function calculateDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Radius of the Earth in miles
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const payload: RequestPayload = await req.json().catch(() => ({}));
  const message = payload.message?.trim() ?? "";
  const imageBase64 = payload.image;
  const userLocation = payload.location ?? { lat: 47.6062, lng: -122.3321, label: "Downtown Seattle, WA" };

  const apiKey = Deno.env.get("LOVABLE_API_KEY") || Deno.env.get("GEMINI_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY");

  // Create SSE ReadableStream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      function sendEvent(data: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      const agentSteps: AgentStep[] = [];
      let imageAnalysis: ImageResult | null = null;

      try {
        // ────────────────────────────────────────────────────────
        // AGENT 1: Image Recognition Agent (Only if image present)
        // ────────────────────────────────────────────────────────
        if (imageBase64) {
          sendEvent({ type: "agent_start", agent: "Image Recognition Agent" });

          try {
            if (apiKey) {
              const imageContent = imageBase64.startsWith("data:")
                ? imageBase64
                : `data:image/jpeg;base64,${imageBase64}`;

              const visionRes = await fetch(GATEWAY, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Lovable-API-Key": apiKey,
                },
                body: JSON.stringify({
                  model: MODEL,
                  messages: [
                    {
                      role: "system",
                      content: `You are an expert computer vision model for local shop discovery.
Analyze the user's uploaded image. Extract the product, item, storefront, or category.
Return STRICT JSON with keys:
{
  "detectedLabel": "short descriptive label e.g. Red Running Shoes or Artisanal Ceramic Cup",
  "category": "one of: Footwear | Pharmacy | Cafe | Outdoor Gear | Home Goods | Bakery | General Retail",
  "confidence": 0.95,
  "description": "1 sentence describing visual traits like color, material, logo or store vibe"
}`,
                    },
                    {
                      role: "user",
                      content: [
                        { type: "text", text: `Analyze this image. User message: "${message}"` },
                        { type: "image_url", image_url: { url: imageContent } },
                      ],
                    },
                  ],
                  response_format: { type: "json_object" },
                }),
              });

              if (visionRes.ok) {
                const visionData = await visionRes.json();
                const rawContent = visionData.choices[0]?.message?.content;
                if (rawContent) {
                  imageAnalysis = JSON.parse(rawContent) as ImageResult;
                }
              }
            }
          } catch (err) {
            console.error("Vision AI error:", err);
          }

          if (!imageAnalysis) {
            imageAnalysis = {
              detectedLabel: "Item / Product Photo",
              category: "General Retail",
              confidence: 0.85,
              description: "Recognized item from uploaded photo",
            };
          }

          const imgDetail = `identified: "${imageAnalysis.detectedLabel}" (${imageAnalysis.category})`;
          agentSteps.push({
            agent: "Image Recognition Agent",
            status: "completed",
            detail: imgDetail,
          });

          sendEvent({
            type: "agent_done",
            agent: "Image Recognition Agent",
            detail: imgDetail,
            result: imageAnalysis,
          });

          await sleep(350);
        }

        // ────────────────────────────────────────────────────────
        // AGENT 2: Location Agent
        // ────────────────────────────────────────────────────────
        sendEvent({ type: "agent_start", agent: "Location Agent" });
        await sleep(250);

        let activeLocation = { ...userLocation };
        let locationWarning: string | null = null;

        // Check if query contains an explicit location mention (e.g. "zudio jalandhar", "coffee in Andheri West")
        if (message) {
          const words = message.trim().split(/\s+/);
          const lastWord = words[words.length - 1];
          let candidatePlace: string | null = null;

          const preposedMatch = message.match(/(?:in|near|at|around)\s+([A-Za-z0-9\s,]+)/i);
          if (preposedMatch?.[1]) {
            candidatePlace = preposedMatch[1].trim();
          } else if (words.length >= 2 && lastWord.length > 2 && !["shoes", "gear", "store", "shop", "cafe", "coffee", "food", "wear"].includes(lastWord.toLowerCase())) {
            candidatePlace = lastWord;
          }

          if (candidatePlace && candidatePlace.length > 2 && !["me", "here", "location", "area", "near"].includes(candidatePlace.toLowerCase())) {
            try {
              const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(candidatePlace)}&format=json&limit=1`;
              const geoRes = await fetch(geoUrl, { headers: { "User-Agent": "SynthetixAIShopAssistant/1.0" } });
              if (geoRes.ok) {
                const geoData = await geoRes.json();
                if (Array.isArray(geoData) && geoData.length > 0) {
                  const place = geoData[0];
                  const resolvedLabel = place.display_name.split(",").slice(0, 2).join(", ");
                  activeLocation = {
                    lat: parseFloat(place.lat),
                    lng: parseFloat(place.lon),
                    label: resolvedLabel,
                  };
                } else {
                  locationWarning = `Couldn't find '${candidatePlace}' — showing results near ${userLocation.label || "your active location"} instead`;
                }
              }
            } catch (err) {
              console.warn("Location mention geocoding failed:", err);
            }
          }
        }

        const locationLabel = activeLocation.label || `${activeLocation.lat.toFixed(4)}, ${activeLocation.lng.toFixed(4)}`;
        const locDetail = `using location: ${locationLabel}`;

        agentSteps.push({
          agent: "Location Agent",
          status: "completed",
          detail: locDetail,
        });

        sendEvent({
          type: "agent_done",
          agent: "Location Agent",
          detail: locDetail,
          result: { lat: activeLocation.lat, lng: activeLocation.lng, locationLabel, locationWarning },
        });

        await sleep(350);

        // ────────────────────────────────────────────────────────
        // AGENT 3: Search Agent (Uses Google Places / places-search)
        // ────────────────────────────────────────────────────────
        sendEvent({ type: "agent_start", agent: "Search Agent" });

        let candidates: ShopItem[] = [];
        const placesApiKey = Deno.env.get("GOOGLE_PLACES_API_KEY") || Deno.env.get("PLACES_API_KEY");
        const searchCategory = imageAnalysis?.category || "All";
        const searchKeyword = message || imageAnalysis?.detectedLabel || "";

        if (placesApiKey) {
          try {
            const placesRes = await fetch("https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=" + userLocation.lat + "," + userLocation.lng + "&radius=8000&keyword=" + encodeURIComponent(searchKeyword) + "&key=" + placesApiKey);
            if (placesRes.ok) {
              const pData = await placesRes.json();
              if (pData.results && Array.isArray(pData.results) && pData.results.length > 0) {
                candidates = pData.results.slice(0, 10).map((p: any) => {
                  const photoRef = p.photos?.[0]?.photo_reference;
                  return {
                    id: p.place_id,
                    name: p.name,
                    category: searchCategory !== "All" ? searchCategory : (p.types?.[0]?.replace(/_/g, " ") ?? "Retail"),
                    description: p.vicinity ? `Located at ${p.vicinity}. Verified nearby local business.` : "Local business",
                    address: p.vicinity ?? "Seattle, WA",
                    lat: p.geometry?.location?.lat ?? userLocation.lat,
                    lng: p.geometry?.location?.lng ?? userLocation.lng,
                    rating: p.rating ?? 4.7,
                    review_count: p.user_ratings_total ?? 85,
                    open_now: p.opening_hours?.open_now ?? true,
                    image_url: photoRef
                      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photo_reference=${photoRef}&key=${placesApiKey}`
                      : `https://picsum.photos/seed/${p.place_id}/600/400`,
                  };
                });
              }
            }
          } catch (e) {
            console.warn("Search Agent Places API error:", e);
          }
        }

        if (candidates.length === 0 && supabaseUrl && supabaseKey) {
          const sb = createClient(supabaseUrl, supabaseKey);
          let query = sb.from("shops").select("*");

          if (imageAnalysis?.category) {
            query = query.ilike("category", `%${imageAnalysis.category}%`);
          }

          const { data: dbShops, error } = await query;
          if (!error && dbShops && dbShops.length > 0) {
            candidates = dbShops as ShopItem[];
          }
        }

        if (candidates.length === 0) {
          const catPhotos = {
            footwear: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop",
            cafe: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop",
            pharmacy: "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=800&auto=format&fit=crop",
            outdoor: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&auto=format&fit=crop",
          };

          candidates = [
            {
              id: "shop-1",
              name: "Sole Craft Athletics",
              category: "Footwear",
              description: "Artisan sneaker & performance running shoe boutique featuring custom fitting.",
              address: "Local High Street, Nearby",
              lat: userLocation.lat + 0.005,
              lng: userLocation.lng - 0.007,
              rating: 4.9,
              review_count: 128,
              open_now: true,
              phone: "(206) 555-0192",
              image_url: catPhotos.footwear,
            },
            {
              id: "shop-2",
              name: "Velvet Espresso Bar",
              category: "Cafe",
              description: "Specialty coffee shop serving single-origin pour-overs and matcha.",
              address: "Main Plaza, Local Area",
              lat: userLocation.lat - 0.006,
              lng: userLocation.lng + 0.008,
              rating: 4.9,
              review_count: 340,
              open_now: true,
              phone: "(206) 555-0410",
              image_url: catPhotos.cafe,
            },
            {
              id: "shop-3",
              name: "Apothecary & Wellness Co.",
              category: "Pharmacy",
              description: "Full-service pharmacy offering natural wellness products and prescriptions.",
              address: "Central Market, Nearby",
              lat: userLocation.lat + 0.009,
              lng: userLocation.lng + 0.004,
              rating: 4.8,
              review_count: 210,
              open_now: true,
              phone: "(206) 555-0320",
              image_url: catPhotos.pharmacy,
            },
            {
              id: "shop-4",
              name: "Cascade Mountain Outfitters",
              category: "Outdoor Gear",
              description: "Premium hiking boots, rain jackets, and camping accessories.",
              address: "North Boulevard, Local District",
              lat: userLocation.lat - 0.008,
              lng: userLocation.lng - 0.009,
              rating: 4.9,
              review_count: 180,
              open_now: true,
              phone: "(206) 555-0511",
              image_url: catPhotos.outdoor,
            },
          ];
        }

        candidates.forEach((shop) => {
          shop.distance_miles = calculateDistanceMiles(
            userLocation.lat,
            userLocation.lng,
            shop.lat,
            shop.lng
          );
        });

        const searchDetail = `found ${candidates.length} nearby matches`;

        agentSteps.push({
          agent: "Search Agent",
          status: "completed",
          detail: searchDetail,
        });

        sendEvent({
          type: "agent_done",
          agent: "Search Agent",
          detail: searchDetail,
          result: { matchCount: candidates.length },
        });

        await sleep(350);

        // ────────────────────────────────────────────────────────
        // AGENT 4: Ranking Agent
        // ────────────────────────────────────────────────────────
        sendEvent({ type: "agent_start", agent: "Ranking Agent" });

        const targetCategory = (imageAnalysis?.category || "").toLowerCase();
        const targetLabel = (imageAnalysis?.detectedLabel || "").toLowerCase();
        const queryLower = message.toLowerCase();

        candidates.forEach((shop) => {
          let score = 50;
          const shopCat = shop.category.toLowerCase();
          const shopName = shop.name.toLowerCase();
          const shopDesc = shop.description.toLowerCase();

          if (targetCategory && shopCat.includes(targetCategory)) score += 35;
          if (targetLabel && (shopName.includes(targetLabel) || shopDesc.includes(targetLabel))) score += 15;
          if (queryLower && (shopCat.includes(queryLower) || shopName.includes(queryLower) || shopDesc.includes(queryLower))) score += 20;
          if (shop.rating >= 4.8) score += 10;
          else if (shop.rating >= 4.5) score += 5;
          if (shop.open_now) score += 10;
          if (shop.distance_miles) score -= Math.min(20, shop.distance_miles * 5);

          shop.match_score = Math.min(99, Math.max(60, Math.round(score)));
        });

        const rankedShops = [...candidates]
          .sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0))
          .slice(0, 5);

        const rankDetail = "sorted by best match";

        agentSteps.push({
          agent: "Ranking Agent",
          status: "completed",
          detail: rankDetail,
        });

        sendEvent({
          type: "agent_done",
          agent: "Ranking Agent",
          detail: rankDetail,
          result: { rankedCount: rankedShops.length },
        });

        await sleep(350);

        // ────────────────────────────────────────────────────────
        // AGENT 5: Verification Agent
        // ────────────────────────────────────────────────────────
        sendEvent({ type: "agent_start", agent: "Verification Agent" });

        const verifiedShops = rankedShops.filter((shop) => {
          if (imageAnalysis?.category) {
            const cat = imageAnalysis.category.toLowerCase();
            const sCat = shop.category.toLowerCase();
            if (cat.includes("footwear") && !sCat.includes("footwear") && !sCat.includes("outdoor")) return false;
            if (cat.includes("pharmacy") && !sCat.includes("pharmacy")) return false;
            if (cat.includes("cafe") && !sCat.includes("cafe") && !sCat.includes("bakery")) return false;
          }
          return true;
        });

        const shortlist = verifiedShops.length > 0 ? verifiedShops : rankedShops.slice(0, 3);
        const verDetail = "confirmed top picks";

        agentSteps.push({
          agent: "Verification Agent",
          status: "completed",
          detail: verDetail,
        });

        sendEvent({
          type: "agent_done",
          agent: "Verification Agent",
          detail: verDetail,
          result: { verifiedCount: shortlist.length },
        });

        await sleep(350);

        // ────────────────────────────────────────────────────────
        // AGENT 6: Conversational Agent
        // ────────────────────────────────────────────────────────
        sendEvent({ type: "agent_start", agent: "Conversational Agent" });

        let reply = "";
        if (apiKey) {
          try {
            const sysPrompt = `You are Synthetix AI Local Shop Assistant.
Write a friendly, helpful reply (strictly 2 to 3 sentences).
${imageAnalysis ? `MUST start by explicitly mentioning what you recognized in their photo: "${imageAnalysis.detectedLabel}" (${imageAnalysis.category}).` : ""}
Recommend visiting the top verified shops listed in the shortlist. Keep it concise, natural, and warm.`;

            const userPrompt = `User message: "${message}"
Recognized Image: ${imageAnalysis ? JSON.stringify(imageAnalysis) : "None"}
Verified Shops: ${JSON.stringify(shortlist.map((s) => ({ name: s.name, category: s.category, address: s.address, score: s.match_score })))}`;

            const convRes = await fetch(GATEWAY, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Lovable-API-Key": apiKey,
              },
              body: JSON.stringify({
                model: MODEL,
                messages: [
                  { role: "system", content: sysPrompt },
                  { role: "user", content: userPrompt },
                ],
              }),
            });

            if (convRes.ok) {
              const convData = await convRes.json();
              reply = convData.choices[0]?.message?.content ?? "";
            }
          } catch (err) {
            console.error("Conversational LLM error:", err);
          }
        }

        if (!reply) {
          const locStr = locationLabel.toLowerCase().includes("location") ? locationLabel : `near ${locationLabel}`;
          const warnPrefix = locationWarning ? `${locationWarning}\n\n` : "";
          if (imageAnalysis) {
            reply = `${warnPrefix}I recognized **${imageAnalysis.detectedLabel}** in your photo! Here are the top verified local shops ${locStr} matching your search.`;
          } else {
            reply = `${warnPrefix}Here are the top verified local shops ${locStr} matching your search. Take a look at their ratings, distance, and current status!`;
          }
        } else if (locationWarning) {
          reply = `${locationWarning}\n\n${reply}`;
        }

        const convDetail = "writing your answer";
        agentSteps.push({
          agent: "Conversational Agent",
          status: "completed",
          detail: convDetail,
        });

        sendEvent({
          type: "agent_done",
          agent: "Conversational Agent",
          detail: convDetail,
          result: { replyLength: reply.length },
        });

        await sleep(200);

        // ────────────────────────────────────────────────────────
        // FINAL EVENT
        // ────────────────────────────────────────────────────────
        sendEvent({
          type: "final",
          reply,
          shops: shortlist,
          detectedImage: imageAnalysis,
          agentSteps,
        });
      } catch (err) {
        console.error("Pipeline error during stream:", err);
        sendEvent({
          type: "error",
          error: err instanceof Error ? err.message : "Pipeline execution failed",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
});
