import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { Nav } from "@/components/marketplace/Nav";
import { Footer } from "@/components/marketplace/Footer";
import { useCart, formatPrice } from "@/lib/cart";
import { summarizeReviews, answerQuestion } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const getProduct = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const sb = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
      global: { fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      }},
    });
    const { data: p, error } = await sb.from("products").select("*").eq("id", data.id).maybeSingle();
    if (error) throw error;
    if (!p) throw notFound();
    const { data: reviews } = await sb.from("reviews").select("*").eq("product_id", data.id);
    const { data: questions } = await sb.from("questions").select("*").eq("product_id", data.id).order("created_at", { ascending: false });
    return { product: p, reviews: reviews ?? [], questions: questions ?? [] };
  });

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "Product — Synthetix" },
      { name: "description", content: "Curated marketplace product." },
    ],
  }),
  loader: async ({ params, context }) => {
    return context.queryClient.ensureQueryData({
      queryKey: ["product", params.id],
      queryFn: () => getProduct({ data: { id: params.id } }),
    });
  },
  component: ProductPage,
});

const gradients: Record<string, string> = {
  "Outdoor Gear": "linear-gradient(135deg, hsl(30 40% 55%), hsl(25 50% 35%))",
  "Home Goods": "linear-gradient(135deg, hsl(35 30% 75%), hsl(30 25% 55%))",
  "Handmade": "linear-gradient(135deg, hsl(20 45% 65%), hsl(15 55% 40%))",
};

function ProductPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data } = useSuspenseQuery({
    queryKey: ["product", id],
    queryFn: () => getProduct({ data: { id } }),
  });
  const { product } = data;
  const { add } = useCart();

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
        <div
          className="aspect-square rounded-2xl relative overflow-hidden"
          style={{ background: gradients[product.category] ?? gradients["Handmade"] }}
        >
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
            <p className="text-sm text-muted-foreground uppercase tracking-widest font-mono">By {product.seller_name}</p>
            <h1 className="text-4xl font-bold mt-2 leading-tight">{product.title}</h1>
            <p className="text-2xl font-mono mt-4">{formatPrice(product.price_cents)}</p>
          </div>
          <p className="text-lg leading-relaxed text-pretty">{product.description}</p>
          {product.material && (
            <div className="flex gap-3 text-sm">
              <span className="font-mono uppercase text-[10px] tracking-widest text-muted-foreground pt-1">Material</span>
              <span>{product.material}</span>
            </div>
          )}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((t) => (
                <span key={t} className="px-2 py-1 rounded bg-secondary text-[10px] font-mono uppercase text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
          )}
          <button
            onClick={() => {
              add({ id: product.id, title: product.title, seller_name: product.seller_name, price_cents: product.price_cents });
              toast.success(`Added to cart: ${product.title}`);
            }}
            className="w-full bg-foreground text-background py-4 rounded-full font-bold hover:bg-accent transition-colors"
          >
            Add to cart
          </button>
        </div>
      </section>

      {/* AI Review Summary */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-border">
        <div className="flex items-baseline justify-between mb-10">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-accent">AI-synthesized</span>
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
                  <li key={i} className="flex gap-2"><span className="text-accent">+</span>{p}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Cons</h4>
              <ul className="text-sm space-y-3 text-muted-foreground">
                {summary.data.cons.map((c: string, i: number) => (
                  <li key={i} className="flex gap-2"><span>–</span>{c}</li>
                ))}
              </ul>
            </div>
            <div className="p-6 bg-accent/5 rounded-2xl border border-accent/10">
              <h4 className="font-mono text-[10px] uppercase tracking-widest text-accent mb-4">Trust Signal</h4>
              <div className="text-4xl font-bold mb-2 font-display italic">{summary.data.trust}</div>
              <p className="text-xs leading-relaxed opacity-70">
                Avg rating {summary.data.avgRating.toFixed(1)}/5 across {summary.data.count} verified reviews.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Q&A */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-border">
        <span className="font-mono text-[10px] uppercase tracking-widest text-accent">AI-drafted, seller-approved</span>
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
                  <span className="font-mono text-[10px] uppercase tracking-widest text-foreground mb-1 block">Seller</span>
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

      <Footer />
    </div>
  );
}
