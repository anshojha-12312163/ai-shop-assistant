import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Nav } from "@/components/marketplace/Nav";
import { Footer } from "@/components/marketplace/Footer";
import { formatPrice } from "@/lib/cart";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/seller")({
  head: () => ({ meta: [{ title: "Seller Studio — Synthetix" }] }),
  component: SellerDashboard,
});

type Product = { id: string; title: string; price_cents: number; category: string; created_at: string; in_stock: number };
type Question = { id: string; question: string; buyer_name: string; ai_draft_answer: string | null; seller_answer: string | null; ai_confidence: number | null; product_id: string; status: string };

function SellerDashboard() {
  const [listings, setListings] = useState<Product[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isSeller, setIsSeller] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<{ total: number; count: number }>({ total: 0, count: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getUser();
      if (!s.user) return;
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", s.user.id);
      const seller = !!roles?.some((r) => r.role === "seller");
      setIsSeller(seller);
      if (!seller) return;

      const { data: p } = await supabase.from("products").select("id, title, price_cents, category, created_at, in_stock").eq("seller_id", s.user.id).order("created_at", { ascending: false });
      setListings(p ?? []);

      const ids = (p ?? []).map((x) => x.id);
      if (ids.length > 0) {
        const { data: qs } = await supabase.from("questions").select("id, question, buyer_name, ai_draft_answer, seller_answer, ai_confidence, product_id, status").in("product_id", ids).order("created_at", { ascending: false });
        setQuestions(qs ?? []);
      }
    })();
  }, []);

  async function becomeSeller() {
    const { data: s } = await supabase.auth.getUser();
    if (!s.user) return;
    const { error } = await supabase.from("user_roles").insert({ user_id: s.user.id, role: "seller" });
    if (error && !error.message.includes("duplicate")) { toast.error(error.message); return; }
    setIsSeller(true);
    toast.success("Seller access enabled");
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  async function approveAnswer(q: Question) {
    if (!q.ai_draft_answer) return;
    const { error } = await supabase.from("questions").update({ seller_answer: q.ai_draft_answer, status: "answered" }).eq("id", q.id);
    if (error) return toast.error(error.message);
    setQuestions((prev) => prev.map((x) => (x.id === q.id ? { ...x, seller_answer: q.ai_draft_answer, status: "answered" } : x)));
    toast.success("Answer published");
  }

  if (isSeller === null) return null;

  if (!isSeller) {
    return (
      <div className="min-h-screen bg-background">
        <Nav />
        <section className="max-w-2xl mx-auto pt-24 pb-24 px-6 text-center">
          <span className="font-mono text-[10px] uppercase tracking-widest text-accent">Almost there</span>
          <h1 className="text-4xl font-bold mt-3 mb-4">Enable your <span className="font-display italic">Seller Studio</span></h1>
          <p className="text-muted-foreground mb-8">One click to start listing with your AI co-pilot. You can still browse and buy on the same account.</p>
          <button onClick={becomeSeller} className="bg-foreground text-background px-8 py-3 rounded-full font-bold hover:bg-accent transition-colors">
            Become a seller
          </button>
        </section>
      </div>
    );
  }

  const monthly = listings.length * 340;

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <section className="max-w-7xl mx-auto pt-12 pb-16 px-6">
        <div className="flex items-baseline justify-between mb-10 flex-wrap gap-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-accent">Seller Studio</span>
            <h1 className="text-4xl font-bold mt-2">Your co-pilot is on.</h1>
          </div>
          <div className="flex gap-3">
            <Link to="/seller/new" className="bg-foreground text-background px-6 py-2.5 rounded-full font-bold text-sm hover:bg-accent transition-colors">
              + Draft with AI
            </Link>
            <button onClick={signOut} className="text-sm font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground">
              Sign out
            </button>
          </div>
        </div>

        {/* Analytics */}
        <div className="grid md:grid-cols-4 gap-4 mb-16">
          <StatCard label="Active listings" value={String(listings.length)} />
          <StatCard label="Pending Q&A" value={String(questions.filter((q) => !q.seller_answer).length)} accent />
          <StatCard label="Est. monthly views" value={monthly.toLocaleString()} />
          <StatCard label="Total inventory" value={String(listings.reduce((s, p) => s + p.in_stock, 0))} />
        </div>

        {/* Listings */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Your listings</h2>
          {listings.length === 0 ? (
            <div className="p-12 border border-dashed border-border rounded-2xl text-center">
              <p className="text-muted-foreground mb-6">No listings yet — let AI draft your first one from a rough note.</p>
              <Link to="/seller/new" className="bg-foreground text-background px-6 py-2.5 rounded-full font-bold text-sm hover:bg-accent transition-colors">
                Draft with AI
              </Link>
            </div>
          ) : (
            <div className="bg-surface-elevated ring-1 ring-black/5 rounded-2xl overflow-hidden">
              {listings.map((p) => (
                <Link key={p.id} to="/product/$id" params={{ id: p.id }} className="flex items-center justify-between p-5 border-b border-border last:border-b-0 hover:bg-secondary/40 transition-colors">
                  <div>
                    <h3 className="font-bold">{p.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono uppercase tracking-widest">{p.category} · {p.in_stock} in stock</p>
                  </div>
                  <span className="font-mono">{formatPrice(p.price_cents)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Q&A */}
        <div>
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-2xl font-bold">Buyer questions</h2>
            <span className="font-mono text-[10px] uppercase tracking-widest text-accent">AI-drafted, awaiting review</span>
          </div>
          {questions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No questions yet.</p>
          ) : (
            <div className="space-y-4">
              {questions.map((q) => (
                <div key={q.id} className="p-5 bg-surface-elevated ring-1 ring-black/5 rounded-xl">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div>
                      <p className="font-medium">{q.question}</p>
                      <p className="text-xs text-muted-foreground mt-1">{q.buyer_name}</p>
                    </div>
                    {q.seller_answer ? (
                      <span className="text-[10px] font-mono uppercase tracking-widest text-green-700 bg-green-500/10 px-2 py-1 rounded shrink-0">Sent</span>
                    ) : (
                      <span className="text-[10px] font-mono uppercase tracking-widest text-accent bg-accent/10 px-2 py-1 rounded shrink-0">
                        AI · {Math.round((q.ai_confidence ?? 0) * 100)}%
                      </span>
                    )}
                  </div>
                  {q.ai_draft_answer && !q.seller_answer && (
                    <div className="bg-accent/5 border border-accent/10 rounded-lg p-4 text-sm mb-3">
                      {q.ai_draft_answer}
                    </div>
                  )}
                  {q.seller_answer && (
                    <div className="bg-secondary/50 rounded-lg p-4 text-sm">{q.seller_answer}</div>
                  )}
                  {!q.seller_answer && (
                    <button onClick={() => approveAnswer(q)} className="text-xs font-bold uppercase font-mono tracking-widest text-accent hover:text-foreground">
                      Approve AI draft →
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`p-6 rounded-2xl ${accent ? "bg-accent/5 border border-accent/10" : "bg-surface-elevated ring-1 ring-black/5"}`}>
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
      <p className={`text-3xl font-bold ${accent ? "text-accent" : ""}`}>{value}</p>
    </div>
  );
}
