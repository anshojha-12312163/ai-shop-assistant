import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useCart, formatPrice } from "@/lib/cart";
import { Nav } from "@/components/marketplace/Nav";
import { Footer } from "@/components/marketplace/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Cart — Synthetix" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, remove, total, clear } = useCart();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState<{ id: string; total: number } | null>(null);

  async function checkout() {
    setConfirming(true);
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      toast.error("Sign in to complete checkout");
      navigate({ to: "/auth" });
      setConfirming(false);
      return;
    }
    const { data: order, error } = await supabase.from("orders").insert({
      buyer_id: data.session.user.id,
      total_cents: total,
      items: items.map((i) => ({ id: i.id, title: i.title, qty: i.qty, price_cents: i.price_cents })),
      status: "confirmed",
    }).select().single();
    if (error) {
      toast.error(error.message);
      setConfirming(false);
      return;
    }
    setConfirmed({ id: order.id, total });
    clear();
    setConfirming(false);
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-background">
        <Nav />
        <section className="max-w-2xl mx-auto pt-20 pb-24 px-6 text-center animate-fade-in">
          <span className="font-mono text-[10px] uppercase tracking-widest text-accent">Order confirmed</span>
          <h1 className="text-5xl font-bold mt-4">Thank you.</h1>
          <p className="mt-4 text-muted-foreground">
            <span className="font-display italic">Your order has been placed.</span> This is a demo checkout — no card was charged.
          </p>
          <div className="mt-8 p-6 bg-surface-elevated ring-1 ring-black/5 rounded-2xl text-left">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order</span>
              <span className="font-mono">{confirmed.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-muted-foreground">Total</span>
              <span className="font-mono">{formatPrice(confirmed.total)}</span>
            </div>
          </div>
          <button onClick={() => navigate({ to: "/" })} className="mt-8 bg-foreground text-background px-8 py-3 rounded-full font-bold hover:bg-accent transition-colors">
            Keep shopping
          </button>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <section className="max-w-4xl mx-auto pt-16 pb-24 px-6">
        <span className="font-mono text-[10px] uppercase tracking-widest text-accent">Your cart</span>
        <h1 className="text-4xl font-bold mt-2 mb-10">Ready to check out?</h1>

        {items.length === 0 && (
          <div className="p-8 border border-dashed border-border rounded-2xl text-center">
            <p className="text-muted-foreground mb-6">Nothing here yet.</p>
            <button onClick={() => navigate({ to: "/" })} className="bg-foreground text-background px-6 py-2.5 rounded-full font-bold text-sm hover:bg-accent transition-colors">
              Explore the marketplace
            </button>
          </div>
        )}

        {items.length > 0 && (
          <>
            <div className="space-y-4">
              {items.map((i) => (
                <div key={i.id} className="flex items-center justify-between p-5 bg-surface-elevated ring-1 ring-black/5 rounded-xl">
                  <div>
                    <h3 className="font-bold">{i.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">By {i.seller_name} · Qty {i.qty}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono">{formatPrice(i.price_cents * i.qty)}</span>
                    <button onClick={() => remove(i.id)} className="text-xs text-muted-foreground hover:text-destructive uppercase font-mono tracking-widest">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-foreground text-background rounded-2xl">
              <div className="flex justify-between text-sm mb-6">
                <span className="opacity-60">Total</span>
                <span className="font-mono text-lg">{formatPrice(total)}</span>
              </div>
              <button
                onClick={checkout}
                disabled={confirming}
                className="w-full bg-background text-foreground py-4 rounded-full font-bold hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
              >
                {confirming ? "Processing…" : "Complete order (demo)"}
              </button>
              <p className="text-[10px] uppercase tracking-widest opacity-40 text-center mt-3 font-mono">
                No payment processed · Test mode
              </p>
            </div>
          </>
        )}
      </section>
      <Footer />
    </div>
  );
}
