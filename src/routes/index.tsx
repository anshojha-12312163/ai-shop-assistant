import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { createServerFn } from "@tanstack/react-start";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { Nav } from "@/components/marketplace/Nav";
import { Footer } from "@/components/marketplace/Footer";
import { ProductCard } from "@/components/marketplace/ProductCard";

const listFeatured = createServerFn({ method: "GET" }).handler(async () => {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
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
  const { data, error } = await sb
    .from("products")
    .select("id, title, seller_name, price_cents, category, ai_summary, material, tags")
    .order("created_at", { ascending: false })
    .limit(6);
  if (error) throw error;
  return data ?? [];
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Synthetix — Find exactly what you actually mean" },
      { name: "description", content: "AI-mediated marketplace with conversational discovery. Curated goods from independent makers." },
      { property: "og:title", content: "Synthetix — Find exactly what you actually mean" },
      { property: "og:description", content: "AI-mediated marketplace with conversational discovery and a seller co-pilot." },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["featured"],
      queryFn: () => listFeatured(),
    });
  },
  component: Home,
});

function Home() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const { data: featured } = useSuspenseQuery({ queryKey: ["featured"], queryFn: () => listFeatured() });

  function search(query: string) {
    const v = query.trim();
    if (v.length < 2) return;
    navigate({ to: "/discover", search: { q: v } });
  }

  const suggestions = [
    "A durable canvas backpack for hiking that fits a 16\" laptop",
    "Small home goods for a slow morning routine",
    "Handmade gift under $50 for a coffee obsessive",
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent/20">
      <Nav />

      {/* Hero */}
      <section className="max-w-5xl mx-auto pt-24 pb-24 px-6 animate-slide-up">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-balance leading-[1.05]">
          Find exactly what you <span className="font-display italic font-normal text-accent">actually</span> mean.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-10 leading-relaxed">
          Describe what you want in your own words. Our AI reasons about your intent, then explains every recommendation. No filters, no ranked keywords.
        </p>
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-accent/20 to-transparent rounded-2xl blur opacity-25 group-focus-within:opacity-100 transition duration-1000" />
          <div className="relative bg-surface-elevated ring-1 ring-black/5 rounded-2xl shadow-xl p-6">
            <textarea
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); search(q); }
              }}
              className="w-full bg-transparent border-none outline-none focus:ring-0 text-lg md:text-xl placeholder:text-muted-foreground/50 resize-none min-h-[120px]"
              placeholder="I'm looking for a durable canvas backpack for weekend hiking that doesn't look like tech gear and fits a 16-inch laptop..."
            />
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border gap-4">
              <div className="flex gap-2 flex-wrap">
                <span className="px-2 py-1 rounded bg-secondary text-[10px] font-mono text-muted-foreground uppercase">Outdoor Gear</span>
                <span className="px-2 py-1 rounded bg-secondary text-[10px] font-mono text-muted-foreground uppercase">Home Goods</span>
                <span className="px-2 py-1 rounded bg-secondary text-[10px] font-mono text-muted-foreground uppercase">Handmade</span>
              </div>
              <button
                onClick={() => search(q)}
                className="bg-foreground text-background px-8 py-3 rounded-full font-bold text-sm hover:bg-accent transition-colors shrink-0"
              >
                Consult AI →
              </button>
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground self-center mr-2 font-mono uppercase tracking-wider">Try:</span>
          {suggestions.map((s) => (
            <button key={s} onClick={() => search(s)}
              className="text-xs text-muted-foreground hover:text-foreground underline decoration-border underline-offset-4 hover:decoration-accent transition-colors">
              {s}
            </button>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="flex items-baseline justify-between mb-8">
          <div>
            <span className="font-mono text-[10px] text-accent uppercase tracking-widest">Curated this week</span>
            <h2 className="text-3xl font-bold mt-2">From makers we trust</h2>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Seller Copilot Teaser */}
      <section className="bg-foreground text-background py-24 mt-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-16 items-center">
            <div className="md:w-1/2 space-y-6">
              <span className="font-mono text-[10px] text-accent uppercase tracking-widest">Seller Co-Pilot</span>
              <h2 className="text-4xl font-bold leading-tight">List in seconds.<br />AI handles the heavy lifting.</h2>
              <p className="text-background/60 leading-relaxed">
                Drop rough notes about your piece. Our AI drafts the title, description, category, tags, and a suggested price based on the market. You review, edit, publish.
              </p>
              <a href="/auth?mode=signup&role=seller" className="inline-block bg-background text-foreground px-6 py-3 rounded-full font-bold text-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                Start selling
              </a>
            </div>
            <div className="md:w-1/2 w-full">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                <div className="flex justify-between text-[10px] font-mono text-accent uppercase tracking-widest">
                  <span>AI Drafting</span><span>85% Complete</span>
                </div>
                <div className="p-4 bg-white/10 rounded-lg border border-white/5 italic text-sm text-background/85 font-display">
                  "Hand-thrown stoneware mug with a deep cobalt drip glaze. Wide ergonomic handle, holds 12oz. For slow mornings."
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 p-3 rounded-lg text-center">
                    <span className="block text-[10px] opacity-50 uppercase font-mono tracking-widest">Est. Price</span>
                    <span className="font-bold text-lg">$42</span>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg text-center">
                    <span className="block text-[10px] opacity-50 uppercase font-mono tracking-widest">Demand</span>
                    <span className="font-bold text-lg text-green-400">HIGH</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
