import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { createServerFn } from "@tanstack/react-start";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { Nav } from "@/components/marketplace/Nav";
import { Footer } from "@/components/marketplace/Footer";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Shield, Zap, Star, Truck } from "lucide-react";

const listFeatured = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://laujtdoemlavjjrdmdvv.supabase.co";
    const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_lyrll4W7yp-EhCtHG1LheA_PRfa78mU";
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
      .select("id, title, seller_name, price_cents, category, ai_summary, material, tags, image_url")
      .order("created_at", { ascending: false })
      .limit(9);
    if (error || !data) return [];
    return data;
  } catch (e) {
    console.warn("listFeatured fetch error:", e);
    return [];
  }
});

export const Route = createFileRoute("/")(({
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
}));

// Demo sponsored product titles (visually marked as featured)
const SPONSORED_TITLES = new Set([
  "The Heritage Scout Pack",
  "French Linen Duvet Cover",
  "Ceramic Pour-Over Set",
]);

const suggestions = [
  "A waterproof jacket under $150 for rainy hikes",
  "Small home goods for a slow morning routine",
  "Handmade gift under $50 for a coffee obsessive",
];

const categories = [
  {
    name: "Outdoor Gear",
    desc: "Backpacks, jackets, cook kits, and more for every trail.",
    seed: "outdoor-gear-category",
    q: "outdoor hiking gear",
  },
  {
    name: "Home Goods",
    desc: "Ceramics, linens, and woodwork for a considered home.",
    seed: "home-goods-category",
    q: "home goods handmade",
  },
  {
    name: "Handmade",
    desc: "Candles, stationery, and one-of-a-kind pieces from makers.",
    seed: "handmade-artisan-category",
    q: "handmade artisan",
  },
];

const testimonials = [
  { name: "Sarah K.", location: "Portland, OR", quote: "Found the perfect merino base layer in one query. No filters — just described what I wanted.", rating: 5, initials: "SK" },
  { name: "Marcus T.", location: "Brooklyn, NY", quote: "Listed my ceramics in under 3 minutes. The AI wrote better descriptions than I ever could.", rating: 5, initials: "MT" },
  { name: "Priya M.", location: "Austin, TX", quote: "The review summary saved me so much reading time. Pros and cons, instantly.", rating: 5, initials: "PM" },
  { name: "James W.", location: "Seattle, WA", quote: "Synthetix finds things I didn't know existed. It actually understands what I mean.", rating: 5, initials: "JW" },
];

const trustItems = [
  { icon: Shield, text: "Secure checkout" },
  { icon: Star, text: "Verified sellers" },
  { icon: Zap, text: "AI-powered search" },
  { icon: Truck, text: "Satisfaction guarantee" },
];

function Home() {
  const [q, setQ] = useState("");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const { data: featured } = useSuspenseQuery({ queryKey: ["featured"], queryFn: () => listFeatured() });

  function search(query: string) {
    const v = query.trim();
    if (v.length < 2) return;
    navigate({ to: "/discover", search: { q: v } });
  }

  function handleNewsletter(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    toast.success("You're on the list! We'll be in touch.");
    setEmail("");
  }

  // Separate sponsored from regular
  const sponsored = featured.filter((p) => SPONSORED_TITLES.has(p.title));
  const regular = featured.filter((p) => !SPONSORED_TITLES.has(p.title));

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent/20">
      <Nav />

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto pt-24 pb-16 px-6 animate-slide-up">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-balance leading-[1.05]">
          Find exactly what you{" "}
          <span className="font-display italic font-normal text-accent">actually</span> mean.
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
              className="w-full bg-transparent border-none outline-none focus:ring-0 text-lg md:text-xl placeholder:text-muted-foreground/50 resize-none min-h-[100px]"
              placeholder="I'm looking for a durable canvas backpack for weekend hiking that doesn't look like tech gear..."
            />
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border gap-4">
              <div className="flex gap-2 flex-wrap">
                {["Outdoor Gear", "Home Goods", "Handmade"].map((c) => (
                  <span key={c} className="px-2 py-1 rounded bg-secondary text-[10px] font-mono text-muted-foreground uppercase">{c}</span>
                ))}
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

      {/* ── Trust strip ── */}
      <section className="border-y border-border bg-secondary/30 py-4 overflow-x-auto">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-center gap-8 md:gap-16 min-w-max">
          {trustItems.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
              <Icon className="size-4 text-accent shrink-0" />
              {text}
            </div>
          ))}
        </div>
      </section>

      {/* ── Category tiles ── */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-baseline justify-between mb-8">
          <div>
            <span className="font-mono text-[10px] text-accent uppercase tracking-widest">Browse by category</span>
            <h2 className="text-3xl font-bold mt-2">Shop the collection</h2>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              to="/discover"
              search={{ q: cat.q }}
              className="group relative aspect-[4/3] rounded-2xl overflow-hidden block"
            >
              <img
                src={`https://picsum.photos/seed/${cat.seed}/800/600`}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-8">
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/60 mb-1">Explore</span>
                <h3 className="text-2xl font-bold text-white">{cat.name}</h3>
                <p className="text-sm text-white/70 mt-1">{cat.desc}</p>
                <span className="mt-4 text-[11px] font-bold uppercase tracking-widest text-white/80 group-hover:text-accent transition-colors">
                  Browse collection →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Sponsored / Featured listings ── */}
      {sponsored.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 pb-16">
          <div className="flex items-baseline justify-between mb-8">
            <div>
              <span className="font-mono text-[10px] text-amber-500 uppercase tracking-widest">★ Sponsored</span>
              <h2 className="text-3xl font-bold mt-2">Featured by top sellers</h2>
            </div>
            <Link to="/pricing" className="text-xs text-muted-foreground hover:text-accent underline underline-offset-4 transition-colors font-mono uppercase tracking-widest">
              Get featured →
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {sponsored.map((p) => (
              <ProductCard key={p.id} product={p} featured={true} />
            ))}
          </div>
        </section>
      )}

      {/* ── Curated from makers ── */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="flex items-baseline justify-between mb-8">
          <div>
            <span className="font-mono text-[10px] text-accent uppercase tracking-widest">Curated this week</span>
            <h2 className="text-3xl font-bold mt-2">From makers we trust</h2>
          </div>
          <Link to="/discover" className="text-xs text-muted-foreground hover:text-accent underline underline-offset-4 transition-colors font-mono uppercase tracking-widest">
            View all →
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {regular.slice(0, 6).map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* ── Seller Copilot Teaser ── */}
      <section className="bg-foreground text-background py-24 mt-4">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-16 items-center">
            <div className="md:w-1/2 space-y-6">
              <span className="font-mono text-[10px] text-accent uppercase tracking-widest">Seller Co-Pilot</span>
              <h2 className="text-4xl font-bold leading-tight">List in seconds.<br />AI handles the heavy lifting.</h2>
              <p className="text-background/60 leading-relaxed">
                Drop rough notes about your piece. Our AI drafts the title, description, category, tags, and a suggested price. You review, edit, publish.
              </p>
              <div className="flex gap-3">
                <a href="/auth?mode=signup&role=seller" className="inline-block bg-background text-foreground px-6 py-3 rounded-full font-bold text-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                  Start selling free
                </a>
                <Link to="/pricing" className="inline-block border border-background/30 text-background px-6 py-3 rounded-full font-bold text-sm hover:border-accent hover:text-accent transition-colors">
                  View plans
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 w-full">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                <div className="flex justify-between text-[10px] font-mono text-accent uppercase tracking-widest">
                  <span>AI Drafting</span><span>85% Complete</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5">
                  <div className="bg-accent h-1.5 rounded-full" style={{ width: "85%" }} />
                </div>
                <div className="p-4 bg-white/10 rounded-lg border border-white/5 italic text-sm text-background/85 font-display">
                  "Hand-thrown stoneware mug with a deep cobalt drip glaze. Wide ergonomic handle, holds 12oz. For slow mornings."
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/5 p-3 rounded-lg text-center">
                    <span className="block text-[10px] opacity-50 uppercase font-mono tracking-widest">Est. Price</span>
                    <span className="font-bold text-lg">$42</span>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg text-center">
                    <span className="block text-[10px] opacity-50 uppercase font-mono tracking-widest">Demand</span>
                    <span className="font-bold text-lg text-green-400">HIGH</span>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg text-center">
                    <span className="block text-[10px] opacity-50 uppercase font-mono tracking-widest">Category</span>
                    <span className="font-bold text-xs">Handmade</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <span className="font-mono text-[10px] text-accent uppercase tracking-widest">Social proof</span>
          <h2 className="text-4xl font-bold mt-2">What buyers and sellers say</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((t, i) => (
            <div key={t.name} className="p-6 bg-surface-elevated ring-1 ring-black/5 rounded-2xl space-y-4 animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map((s) => (
                  <svg key={s} className="size-4 text-amber-400 fill-amber-400" viewBox="0 0 24 24"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
                ))}
              </div>
              <p className="text-sm leading-relaxed text-foreground/80 font-display italic">"{t.quote}"</p>
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <div className="size-8 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-bold">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground">{t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Newsletter signup ── */}
      <section className="border-t border-border bg-secondary/40 py-20 px-6">
        <div className="max-w-xl mx-auto text-center">
          <span className="font-mono text-[10px] text-accent uppercase tracking-widest">Stay in the loop</span>
          <h2 className="text-3xl font-bold mt-3 mb-3">New makers, every week.</h2>
          <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
            We curate the best new products from independent makers and send them to your inbox — with an AI summary of why they're worth your attention.
          </p>
          <form onSubmit={handleNewsletter} className="flex gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 px-5 py-3 rounded-full bg-surface-elevated ring-1 ring-black/5 text-sm outline-none focus:ring-accent/40 placeholder:text-muted-foreground/50"
            />
            <button type="submit" className="bg-foreground text-background px-6 py-3 rounded-full font-bold text-sm hover:bg-accent transition-colors shrink-0">
              Join list
            </button>
          </form>
          <p className="text-xs text-muted-foreground mt-4">No spam. Unsubscribe any time.</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
