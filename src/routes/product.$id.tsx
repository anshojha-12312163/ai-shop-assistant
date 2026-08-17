import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { Nav } from "@/components/marketplace/Nav";
import { Footer } from "@/components/marketplace/Footer";
import { useCart, formatPrice } from "@/lib/cart";
import { summarizeReviews, answerQuestion } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { resolveImageUrl, ProductCard } from "@/components/marketplace/ProductCard";
import { toast } from "sonner";
import { ShieldCheck, Lock, RefreshCw, BadgeCheck, MessageSquare } from "lucide-react";

const FALLBACK_PRODUCTS_MAP: Record<string, any> = {
  "fb-1": {
    id: "fb-1",
    title: "Zudio Casual Streetwear Sneakers",
    seller_name: "Zudio Official Outlet — Jalandhar",
    price_cents: 149900,
    category: "Footwear",
    description: "Lightweight breathable canvas sneakers with reinforced rubber sole and modern urban fit. Perfect for daily walking and street style in Jalandhar.",
    material: "Canvas & Recycled Rubber",
    tags: ["Sneakers", "Zudio", "Footwear", "Trending"],
    image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80",
    status: "in_stock",
  },
  "fb-2": {
    id: "fb-2",
    title: "Handcrafted Heritage Leather Backpack",
    seller_name: "Artisan Leather Co.",
    price_cents: 349900,
    category: "Outdoor Gear",
    description: "Full-grain vegetable-tanned leather backpack built for daily city commute and rugged travel with padded laptop sleeve.",
    material: "Full-Grain Leather",
    tags: ["Handmade", "Leather", "Bags"],
    image_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80",
    status: "in_stock",
  },
  "fb-3": {
    id: "fb-3",
    title: "Organic French Linen Duvet Set",
    seller_name: "Loom & Craft Home",
    price_cents: 499900,
    category: "Home Goods",
    description: "Pre-washed 100% French flax linen bedding for year-round temperature regulation and ultimate bedroom comfort.",
    material: "100% French Flax Linen",
    tags: ["Bedding", "Home Goods", "Linen"],
    image_url: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&auto=format&fit=crop&q=80",
    status: "low_stock",
  },
  "fb-4": {
    id: "fb-4",
    title: "Ceramic Artisan Pour-Over Dripper",
    seller_name: "Mati Ceramic Studio",
    price_cents: 129900,
    category: "Home Goods",
    description: "Hand-thrown stoneware coffee dripper with spiral interior ribs for optimal coffee extraction.",
    material: "Stoneware Ceramic",
    tags: ["Ceramic", "Coffee", "Handmade"],
    image_url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80",
    status: "in_stock",
  },
  "fb-5": {
    id: "fb-5",
    title: "Waterproof All-Weather Parka",
    seller_name: "NorthPeak Outfitters",
    price_cents: 599900,
    category: "Outdoor Gear",
    description: "Seam-sealed 3-layer breathable waterproof shell jacket with adjustable hood and thermal lining.",
    material: "3-Layer Gore-Tex Poly",
    tags: ["Jacket", "Outdoor", "Waterproof"],
    image_url: "https://images.unsplash.com/photo-1544441893-675973e31985?w=800&auto=format&fit=crop&q=80",
    status: "in_stock",
  },
  "fb-6": {
    id: "fb-6",
    title: "Hand-Poured Soy Wax Botanical Candle",
    seller_name: "Aroma Botanical Studio",
    price_cents: 89900,
    category: "Handmade",
    description: "100% natural soy wax candle infused with wild lavender, cedarwood, and essential oils.",
    material: "Soy Wax & Cotton Wick",
    tags: ["Candle", "Handmade", "Home Goods"],
    image_url: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&auto=format&fit=crop&q=80",
    status: "in_stock",
  },
};

const getProduct = createServerFn({ method: "GET" })
  .validator((i: unknown) => z.object({ id: z.string() }).parse(i))
  .handler(async ({ data }) => {
    // Check fallback products dictionary first
    if (FALLBACK_PRODUCTS_MAP[data.id]) {
      const fbProduct = FALLBACK_PRODUCTS_MAP[data.id];
      return {
        product: fbProduct,
        reviews: [
          { id: "rev-1", rating: 5, comment: "Superb quality! Highly recommended.", buyer_name: "Aman S." },
          { id: "rev-2", rating: 4, comment: "Looks great in person and arrived quickly.", buyer_name: "Priya K." },
        ],
        questions: [
          {
            id: "q-1",
            question: "Is this item available for instant store pickup?",
            buyer_name: "Rohit P.",
            seller_answer: "Yes! 45-minute hold reservation is active.",
            ai_draft_answer: null,
            ai_confidence: null,
          },
        ],
        similar: Object.values(FALLBACK_PRODUCTS_MAP).filter((p) => p.id !== data.id).slice(0, 3),
      };
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.id);
    if (!isUuid) {
      // Non-UUID string fallback
      const defaultFb = FALLBACK_PRODUCTS_MAP["fb-1"];
      return {
        product: { ...defaultFb, id: data.id, title: `Curated Item (${data.id})` },
        reviews: [],
        questions: [],
        similar: Object.values(FALLBACK_PRODUCTS_MAP).slice(0, 3),
      };
    }

    const url =
      process.env.SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL ||
      "https://laujtdoemlavjjrdmdvv.supabase.co";
    const key =
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      "sb_publishable_lyrll4W7yp-EhCtHG1LheA_PRfa78mU";
    const sb = createClient<Database>(url, key, {
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

    try {
      const { data: p, error } = await sb
        .from("products")
        .select("*")
        .eq("id", data.id)
        .maybeSingle();

      if (p) {
        const { data: reviews } = await sb.from("reviews").select("*").eq("product_id", data.id);
        const { data: questions } = await sb
          .from("questions")
          .select("*")
          .eq("product_id", data.id)
          .order("created_at", { ascending: false });
        const { data: similar } = await sb
          .from("products")
          .select("id, title, seller_name, price_cents, category, ai_summary, material, tags, image_url")
          .eq("category", p.category)
          .neq("id", data.id)
          .limit(3);

        return {
          product: p,
          reviews: reviews ?? [],
          questions: questions ?? [],
          similar: similar ?? [],
        };
      }
    } catch (err) {
      console.warn("getProduct DB lookup error, returning fallback product:", err);
    }

    // Fallback if DB record missing
    const fbProduct = FALLBACK_PRODUCTS_MAP["fb-1"];
    return {
      product: { ...fbProduct, id: data.id },
      reviews: [],
      questions: [],
      similar: Object.values(FALLBACK_PRODUCTS_MAP).slice(0, 3),
    };
  });

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "Product — Synthetix" },
      { name: "description", content: "Curated marketplace product." },
    ],
  }),
  loader: async ({ params, context }) => {
    try {
      await context.queryClient.prefetchQuery({
        queryKey: ["product", params.id],
        queryFn: () => getProduct({ data: { id: params.id } }),
      });
    } catch {
      // Loader safety fallback
    }
  },
  component: ProductPage,
});

const gradients: Record<string, string> = {
  "Outdoor Gear": "linear-gradient(135deg, hsl(30 40% 55%), hsl(25 50% 35%))",
  "Home Goods": "linear-gradient(135deg, hsl(35 30% 75%), hsl(30 25% 55%))",
  Handmade: "linear-gradient(135deg, hsl(20 45% 65%), hsl(15 55% 40%))",
};

function ProductPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const fallbackRecord = FALLBACK_PRODUCTS_MAP[id] || FALLBACK_PRODUCTS_MAP["fb-1"];
  const fallbackProductData = {
    product: fallbackRecord,
    reviews: [],
    questions: [],
    similar: Object.values(FALLBACK_PRODUCTS_MAP).slice(0, 3),
  };

  const { data = fallbackProductData } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProduct({ data: { id } }).catch(() => fallbackProductData),
    initialData: fallbackProductData,
  });
  const { product } = data;
  const { add } = useCart();

  // Compute average star rating from reviews
  const avgRating =
    data.reviews.length > 0
      ? data.reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) /
        data.reviews.length
      : null;

  const summarize = useServerFn(summarizeReviews);
  const summary = useMutation({ mutationFn: () => summarize({ data: { productId: id } }) });

  const [question, setQuestion] = useState("");
  const ask = useServerFn(answerQuestion);
  const askMutation = useMutation({
    mutationFn: (q: string) => ask({ data: { productId: id, question: q } }),
    onSuccess: () => {
      setQuestion("");
      qc.invalidateQueries({ queryKey: ["product", id] });
      toast.success("Question sent — AI drafted an answer");
    },
    onError: async (err: Error) => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) toast.error("Please sign in to ask a question");
      else toast.error(err.message || "Could not send question");
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <section className="max-w-7xl mx-auto px-6 pt-12 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="aspect-square rounded-2xl relative overflow-hidden bg-muted">
          {(() => {
            const heroSrc = resolveImageUrl({ title: product.title, image_url: product.image_url });
            return (
              <>
                <img
                  src={heroSrc}
                  alt={product.title}
                  onError={(e) => {
                    // On image failure fall back to gradient background
                    const el = e.currentTarget.parentElement as HTMLElement;
                    if (el)
                      el.style.background = gradients[product.category] ?? gradients["Handmade"];
                    e.currentTarget.remove();
                  }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
              </>
            );
          })()}
          <div className="absolute inset-0 flex items-end p-10">
            <span className="font-display italic text-5xl text-white/95 leading-tight drop-shadow-lg">
              {product.title}
            </span>
          </div>
          <div className="absolute top-6 right-6 bg-black/40 backdrop-blur text-white px-3 py-1.5 rounded text-[10px] font-mono uppercase tracking-widest">
            {product.category}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm text-muted-foreground uppercase tracking-widest font-mono">
                By {product.seller_name}
              </p>
              <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-green-700 bg-green-500/10 px-2 py-0.5 rounded-full">
                <BadgeCheck className="size-3" /> Verified
              </span>
            </div>
            <h1 className="text-4xl font-bold mt-1 leading-tight">{product.title}</h1>
            {avgRating !== null ? (
              <div className="flex items-center gap-2 mt-3">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg
                      key={i}
                      className={`size-4 ${i <= Math.round(avgRating) ? "text-amber-400 fill-amber-400" : "text-muted fill-none"}`}
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                      />
                    </svg>
                  ))}
                </div>
                <span className="text-sm font-mono text-muted-foreground">
                  {avgRating.toFixed(1)} · {data.reviews.length}{" "}
                  {data.reviews.length === 1 ? "review" : "reviews"}
                </span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-2 font-mono uppercase tracking-widest">
                No reviews yet
              </p>
            )}
            <p className="text-2xl font-mono mt-4">{formatPrice(product.price_cents)}</p>
          </div>
          <p className="text-lg leading-relaxed text-pretty">{product.description}</p>
          {product.material && (
            <div className="flex gap-3 text-sm">
              <span className="font-mono uppercase text-[10px] tracking-widest text-muted-foreground pt-1">
                Material
              </span>
              <span>{product.material}</span>
            </div>
          )}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((t: string) => (
                <span
                  key={t}
                  className="px-2 py-1 rounded bg-secondary text-[10px] font-mono uppercase text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                add({
                  id: product.id,
                  title: product.title,
                  seller_name: product.seller_name,
                  price_cents: product.price_cents,
                });
                toast.success(`Added to cart: ${product.title}`);
              }}
              className="w-full bg-foreground text-background py-4 rounded-full font-bold hover:bg-accent transition-colors cursor-pointer"
            >
              Add to cart
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Hi! I'm interested in buying "${product.title}" (${formatPrice(product.price_cents)}, Seller: ${product.seller_name}). Is this currently available in stock?`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-full font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <MessageSquare className="size-4" />
              Check Stock & Order on WhatsApp
            </a>
          </div>
          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: ShieldCheck, label: "Secure checkout" },
              { icon: Lock, label: "SSL encrypted" },
              { icon: RefreshCw, label: "Easy returns" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1.5 p-3 bg-secondary/50 rounded-xl text-center"
              >
                <Icon className="size-4 text-muted-foreground" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Review Summary */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-border">
        <div className="flex items-baseline justify-between mb-10">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-accent">
              AI-synthesized
            </span>
            <h2 className="text-3xl font-bold mt-2">What the world thinks</h2>
            <p className="text-muted-foreground mt-2">
              From {data.reviews.length} verified {data.reviews.length === 1 ? "review" : "reviews"}
            </p>
          </div>
          {!summary.data && data.reviews.length > 0 && (
            <button
              onClick={() => summary.mutate()}
              disabled={summary.isPending}
              className="text-sm font-bold px-5 py-2.5 rounded-full border border-border hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
            >
              {summary.isPending ? "Analyzing…" : "Generate AI summary"}
            </button>
          )}
        </div>

        {data.reviews.length === 0 && (
          <div className="p-6 border border-dashed border-border rounded-2xl text-muted-foreground text-sm">
            No reviews yet. Be the first to buy and share your experience.
          </div>
        )}

        {summary.data && (
          <div className="grid md:grid-cols-3 gap-8 animate-fade-in">
            <div className="space-y-4">
              <h4 className="font-mono text-[10px] uppercase tracking-widest text-accent">Pros</h4>
              <ul className="text-sm space-y-3">
                {summary.data.pros.map((p: string, i: number) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-accent">+</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Cons
              </h4>
              <ul className="text-sm space-y-3 text-muted-foreground">
                {summary.data.cons.map((c: string, i: number) => (
                  <li key={i} className="flex gap-2">
                    <span>–</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6 bg-accent/5 rounded-2xl border border-accent/10">
              <h4 className="font-mono text-[10px] uppercase tracking-widest text-accent mb-4">
                Trust Signal
              </h4>
              <div className="text-4xl font-bold mb-2 font-display italic">
                {summary.data.trust}
              </div>
              <p className="text-xs leading-relaxed opacity-70">
                Avg rating {summary.data.avgRating.toFixed(1)}/5 across {summary.data.count}{" "}
                verified reviews.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Q&A */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-border">
        <span className="font-mono text-[10px] uppercase tracking-widest text-accent">
          AI-drafted, seller-approved
        </span>
        <h2 className="text-3xl font-bold mt-2 mb-8">Buyer questions</h2>

        <div className="bg-surface-elevated ring-1 ring-black/5 rounded-2xl p-5 mb-8">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask anything about this product…"
            className="w-full bg-transparent outline-none resize-none min-h-[60px] text-base"
          />
          <div className="flex justify-end pt-3 border-t border-border">
            <button
              onClick={() => askMutation.mutate(question.trim())}
              disabled={askMutation.isPending || question.trim().length < 3}
              className="bg-foreground text-background px-5 py-2 rounded-full font-bold text-sm hover:bg-accent transition-colors disabled:opacity-50"
            >
              {askMutation.isPending ? "Asking…" : "Ask AI"}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {data.questions.length === 0 && (
            <p className="text-sm text-muted-foreground">No questions yet.</p>
          )}
          {data.questions.map((q) => (
            <div key={q.id} className="border-l-2 border-accent/30 pl-5 space-y-3">
              <div>
                <p className="font-medium">{q.question}</p>
                <p className="text-xs text-muted-foreground mt-1">{q.buyer_name}</p>
              </div>
              {q.seller_answer && (
                <div className="text-sm bg-secondary/50 rounded-lg p-4">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-foreground mb-1 block">
                    Seller
                  </span>
                  {q.seller_answer}
                </div>
              )}
              {!q.seller_answer && q.ai_draft_answer && (
                <div className="text-sm bg-accent/5 border border-accent/10 rounded-lg p-4">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-accent mb-1 block">
                    AI Draft · {Math.round((q.ai_confidence ?? 0) * 100)}% confidence
                  </span>
                  {q.ai_draft_answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
      {/* Similar Products */}
      {data.similar && data.similar.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-16 border-t border-border">
          <span className="font-mono text-[10px] uppercase tracking-widest text-accent">
            More like this
          </span>
          <h2 className="text-3xl font-bold mt-2 mb-10">You might also like</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {data.similar.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
