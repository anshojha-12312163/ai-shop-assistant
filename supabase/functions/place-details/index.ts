import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestPayload {
  place_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: RequestPayload = await req.json().catch(() => ({ place_id: "" }));
    const placeId = payload.place_id;

    if (!placeId) {
      return new Response(JSON.stringify({ error: "Missing place_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY") || Deno.env.get("PLACES_API_KEY");

    if (apiKey && !placeId.startsWith("fallback-") && !placeId.startsWith("s") && !placeId.startsWith("shop-")) {
      try {
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,formatted_phone_number,formatted_address,photos,reviews,opening_hours,website,geometry&key=${apiKey}`;
        const res = await fetch(detailsUrl);

        if (res.ok) {
          const data = await res.json();
          const p = data.result;

          if (p) {
            const photos = (p.photos ?? []).slice(0, 5).map((ph: any) =>
              `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${ph.photo_reference}&key=${apiKey}`
            );

            const reviews = (p.reviews ?? []).slice(0, 5).map((r: any) => ({
              author_name: r.author_name,
              rating: r.rating,
              relative_time: r.relative_time_description,
              text: r.text,
              profile_photo_url: r.profile_photo_url,
            }));

            return new Response(
              JSON.stringify({
                details: {
                  place_id: placeId,
                  name: p.name,
                  address: p.formatted_address,
                  phone: p.formatted_phone_number ?? "(206) 555-0199",
                  website: p.website ?? "https://google.com/maps",
                  rating: p.rating ?? 4.8,
                  user_ratings_total: p.user_ratings_total ?? 100,
                  photos: photos.length > 0 ? photos : [`https://picsum.photos/seed/${placeId}/800/600`],
                  reviews,
                  weekday_text: p.opening_hours?.weekday_text ?? [
                    "Monday - Friday: 8:00 AM - 8:00 PM",
                    "Saturday - Sunday: 9:00 AM - 6:00 PM",
                  ],
                  open_now: p.opening_hours?.open_now ?? true,
                  lat: p.geometry?.location?.lat,
                  lng: p.geometry?.location?.lng,
                  isFallback: false,
                },
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      } catch (err) {
        console.error("Place details API error:", err);
      }
    }

    // Fallback details if key is missing or mock shop
    const fallbackDetails = {
      place_id: placeId,
      name: "Craft Merchant & Store",
      address: "412 Pike St, Seattle, WA 98101",
      phone: "(206) 555-0192",
      website: "https://example.com",
      rating: 4.9,
      user_ratings_total: 142,
      photos: [
        `https://picsum.photos/seed/${placeId}-1/800/600`,
        `https://picsum.photos/seed/${placeId}-2/800/600`,
        `https://picsum.photos/seed/${placeId}-3/800/600`,
      ],
      reviews: [
        {
          author_name: "Sarah M.",
          rating: 5,
          relative_time: "a week ago",
          text: "Phenomenal local merchant! Great customer service, custom fitting, and top products.",
        },
        {
          author_name: "David K.",
          rating: 5,
          relative_time: "2 months ago",
          text: "Found exactly what I was looking for. Super friendly staff and fast checkout.",
        },
      ],
      weekday_text: [
        "Monday - Friday: 8:00 AM - 8:00 PM",
        "Saturday: 9:00 AM - 7:00 PM",
        "Sunday: 10:00 AM - 6:00 PM",
      ],
      open_now: true,
      isFallback: true,
    };

    return new Response(JSON.stringify({ details: fallbackDetails }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("place-details function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Details error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
