import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { draftListing } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { Nav } from "@/components/marketplace/Nav";
import { Footer } from "@/components/marketplace/Footer";
import { formatPrice } from "@/lib/cart";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/seller/new")({
  head: () => ({ meta: [{ title: "Draft a listing — Synthetix" }] }),
  component: NewListing,
});

function NewListing() {
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState("Handmade");
  const [draft, setDraft] = useState<null | {
    title: string;
    description: string;
    category: string;
    tags: string[];
    suggested_price_cents: number;
    price_reasoning: string;
    demand_signal: string;
  }>(null);
  const [publishing, setPublishing] = useState(false);
  const navigate = useNavigate();

  const drafter = useServerFn(draftListing);
  const draftMutation = useMutation({
    mutationFn: () => drafter({ data: { notes, category_hint: category } }),
    onSuccess: (d) => setDraft(d),
    onError: (e: Error) => toast.error(e.message),
  });

  async function publish() {
    if (!draft) return;
    setPublishing(true);
    const { data: s } = await supabase.auth.getUser();
    if (!s.user) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", s.user.id)
      .maybeSingle();
    const { data: p, error } = await supabase
      .from("products")
      .insert({
        seller_id: s.user.id,
        seller_name: profile?.display_name ?? s.user.email?.split("@")[0] ?? "Maker",
        title: draft.title,
        description: draft.description,
        category: draft.category,
        tags: draft.tags,
        price_cents: draft.suggested_price_cents,
        ai_summary: draft.description.split(".")[0] + ".",
      })
      .select()
      .single();
    setPublishing(false);
    if (error) return toast.error(error.message);
    toast.success("Listing published");
    navigate({ to: "/product/$id", params: { id: p.id } });
  }

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <section className="max-w-4xl mx-auto pt-12 pb-16 px-6">
        <span className="font-mono text-[10px] uppercase tracking-widest text-accent">
          AI Listing Assistant
        </span>
        <h1 className="text-4xl font-bold mt-2 mb-2">
          Turn <span className="font-display italic">rough notes</span> into a listing.
        </h1>
        <p className="text-muted-foreground mb-10">
          Describe your piece in your own words. AI drafts a title, description, category, tags, and
          a suggested price. You edit and publish.
        </p>

        <div className="bg-surface-elevated ring-1 ring-black/5 rounded-2xl p-6 mb-8">
          <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-2">
            Rough notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Old leather chair from my studio. Scuffed but great bones. Mid-century vibes. Thinking $300?"
            className="w-full bg-transparent outline-none resize-none min-h-[140px] text-base"
          />
          <div className="flex justify-between items-center pt-4 border-t border-border gap-4">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="text-sm bg-transparent border-none font-medium outline-none"
            >
              <option>Handmade</option>
              <option>Home Goods</option>
              <option>Outdoor Gear</option>
            </select>
            <button
              onClick={() => draftMutation.mutate()}
              disabled={draftMutation.isPending || notes.trim().length < 5}
              className="bg-foreground text-background px-6 py-2.5 rounded-full font-bold text-sm hover:bg-accent transition-colors disabled:opacity-50"
            >
              {draftMutation.isPending ? "Drafting…" : "Draft with AI"}
            </button>
          </div>
        </div>

        {draftMutation.isPending && (
          <div className="p-6 bg-accent/5 border border-accent/10 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="size-2 bg-accent rounded-full animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-accent">
                AI analyzing your notes…
              </span>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-muted/60 rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-muted/60 rounded w-full animate-pulse" />
              <div className="h-4 bg-muted/60 rounded w-1/2 animate-pulse" />
            </div>
          </div>
        )}

        {draft && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-surface-elevated ring-1 ring-black/5 rounded-2xl p-8">
              <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-accent mb-6">
                <span>Draft ready</span>
                <span>Editable — review before publishing</span>
              </div>

              <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">
                Title
              </label>
              <input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                className="w-full text-xl font-bold px-4 py-2 border border-border rounded-lg mb-5 bg-background outline-none focus:border-accent"
              />

              <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">
                Description
              </label>
              <textarea
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-lg min-h-[120px] mb-5 bg-background outline-none focus:border-accent resize-none"
              />

              <div className="grid md:grid-cols-3 gap-4 mb-5">
                <div>
                  <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">
                    Category
                  </label>
                  <select
                    value={draft.category}
                    onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background outline-none"
                  >
                    <option>Handmade</option>
                    <option>Home Goods</option>
                    <option>Outdoor Gear</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">
                    Price
                  </label>
                  <input
                    type="number"
                    value={draft.suggested_price_cents / 100}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        suggested_price_cents: Math.round(parseFloat(e.target.value) * 100) || 0,
                      })
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">
                    AI demand
                  </label>
                  <div className="px-4 py-2 rounded-lg bg-accent/10 text-accent font-bold text-center">
                    {draft.demand_signal}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                {draft.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-1 rounded bg-secondary text-[10px] font-mono uppercase text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div className="p-4 bg-accent/5 border border-accent/10 rounded-lg text-sm text-accent mb-6">
                <span className="font-bold uppercase text-[10px] tracking-widest">
                  AI pricing rationale ·{" "}
                </span>
                {draft.price_reasoning}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={publish}
                  disabled={publishing}
                  className="flex-1 bg-foreground text-background py-3 rounded-full font-bold hover:bg-accent transition-colors disabled:opacity-50"
                >
                  {publishing
                    ? "Publishing…"
                    : `Publish for ${formatPrice(draft.suggested_price_cents)}`}
                </button>
                <button
                  onClick={() => draftMutation.mutate()}
                  className="px-6 py-3 rounded-full border border-border font-bold text-sm hover:bg-secondary transition-colors"
                >
                  Redraft
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
}
