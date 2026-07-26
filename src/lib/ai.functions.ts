import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

function publicClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

async function chat(system: string, user: string, opts: { json?: boolean } = {}) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY missing");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI gateway ${res.status}: ${t}`);
  }
  const data = await res.json();
  return data.choices[0].message.content as string;
}

// ============== CONVERSATIONAL SEARCH ==============
export const conversationalSearch = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ query: z.string().min(2).max(1000) }).parse(i))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: products, error } = await sb
      .from("products")
      .select("id, title, description, price_cents, category, tags, material, seller_name, ai_summary");
    if (error) throw error;

    const catalog = (products ?? []).map((p) => ({
      id: p.id,
      title: p.title,
      category: p.category,
      price: `$${(p.price_cents / 100).toFixed(0)}`,
      summary: p.ai_summary,
      material: p.material,
      tags: p.tags,
    }));

    const system = `You are Synthetix, an AI shopping assistant for a curated marketplace of independent makers.
You reason about buyer intent and pick the best-matching products from the provided catalog.
Return STRICT JSON with this shape:
{
  "reasoning": "1-2 sentence explanation of what you understood the buyer wants and how you filtered",
  "criteria": ["short criterion", "short criterion", "short criterion"],
  "matches": [{"id": "product-uuid", "match": 95, "insight": "one sentence, specific to this product and buyer's stated needs"}]
}
Pick 3-6 best products. "match" is 0-100. "insight" must reference the buyer's actual words.
If nothing fits, return an empty matches array and explain why in reasoning.`;

    const user = `Buyer says: "${data.query}"

Catalog (JSON):
${JSON.stringify(catalog)}`;

    const raw = await chat(system, user, { json: true });
    let parsed: {
      reasoning: string;
      criteria: string[];
      matches: { id: string; match: number; insight: string }[];
    };
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { reasoning: "Could not parse AI response.", criteria: [], matches: [] };
    }

    const byId = new Map(products?.map((p) => [p.id, p]) ?? []);
    const hydrated = parsed.matches
      .filter((m) => byId.has(m.id))
      .map((m) => ({ ...m, product: byId.get(m.id)! }));

    return { reasoning: parsed.reasoning, criteria: parsed.criteria, matches: hydrated };
  });

// ============== LISTING DRAFT ==============
export const draftListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      notes: z.string().min(3).max(2000),
      category_hint: z.string().optional(),
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const system = `You are an AI listing co-pilot for artisan sellers. Given rough notes about a product, draft a polished marketplace listing.
Return STRICT JSON:
{
  "title": "compelling 3-8 word title",
  "description": "2-3 sentence description emphasizing materials, use, feel",
  "category": "one of: Outdoor Gear, Home Goods, Handmade",
  "tags": ["3-6 lowercase tags"],
  "suggested_price_cents": 8500,
  "price_reasoning": "1 sentence explaining pricing",
  "demand_signal": "LOW" | "MEDIUM" | "HIGH"
}`;
    const user = `Seller notes: "${data.notes}"
Category hint: ${data.category_hint ?? "unspecified"}`;
    const raw = await chat(system, user, { json: true });
    return JSON.parse(raw) as {
      title: string;
      description: string;
      category: string;
      tags: string[];
      suggested_price_cents: number;
      price_reasoning: string;
      demand_signal: "LOW" | "MEDIUM" | "HIGH";
    };
  });

// ============== REVIEW SUMMARY ==============
export const summarizeReviews = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ productId: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: reviews } = await sb
      .from("reviews")
      .select("rating, body, verified_purchase")
      .eq("product_id", data.productId);

    if (!reviews || reviews.length === 0) {
      return { pros: [], cons: [], themes: [], trust: "NEW", avgRating: 0, count: 0 };
    }

    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

    const system = `You summarize product reviews. Return STRICT JSON:
{
  "pros": ["3-4 short bullet points, prefix with a % if possible"],
  "cons": ["1-3 honest downsides"],
  "themes": ["2-3 recurring themes"],
  "trust": "A+" | "A" | "B" | "C"
}
Trust is based on rating consistency and specificity of reviews. Do NOT invent facts not in the reviews.`;

    const user = `Reviews:\n${reviews.map((r) => `[${r.rating}/5] ${r.body}`).join("\n")}`;
    const raw = await chat(system, user, { json: true });
    const parsed = JSON.parse(raw);
    return { ...parsed, avgRating: avg, count: reviews.length };
  });

// ============== ANSWER QUESTION ==============
export const answerQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ productId: z.string().uuid(), question: z.string().min(3).max(500) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const sb = publicClient();
    const { data: product } = await sb
      .from("products")
      .select("title, description, category, material, tags, ai_summary")
      .eq("id", data.productId)
      .maybeSingle();
    if (!product) throw new Error("Product not found");

    const system = `You draft AI answers to buyer questions using ONLY the provided product details.
Return STRICT JSON: { "answer": "helpful 1-3 sentence reply", "confidence": 0.0-1.0 }
If the question cannot be answered from the listing, set confidence < 0.5 and say the seller will follow up.`;

    const user = `Product: ${JSON.stringify(product)}
Buyer question: "${data.question}"`;
    const raw = await chat(system, user, { json: true });
    const parsed = JSON.parse(raw) as { answer: string; confidence: number };

    // Store as a pending question with AI draft
    const { data: profile } = await context.supabase
      .from("profiles").select("display_name").eq("id", context.userId).maybeSingle();

    await context.supabase.from("questions").insert({
      product_id: data.productId,
      buyer_id: context.userId,
      buyer_name: profile?.display_name ?? "Anonymous",
      question: data.question,
      ai_draft_answer: parsed.answer,
      ai_confidence: parsed.confidence,
      status: parsed.confidence >= 0.7 ? "answered" : "pending",
    });

    return parsed;
  });
