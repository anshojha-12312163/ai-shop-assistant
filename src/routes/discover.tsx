import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Nav } from "@/components/marketplace/Nav";
import { Footer } from "@/components/marketplace/Footer";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { conversationalSearch } from "@/lib/ai.functions";

const searchSchema = z.object({ q: z.string().optional() });

export const Route = createFileRoute("/discover")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Discover — Synthetix" },
      { name: "description", content: "AI-curated results for your query, with explained reasoning." },
    ],
  }),
  component: Discover,
});

function Discover() {
  const { q } = Route.useSearch();
  const [query, setQuery] = useState(q ?? "");
  const search = useServerFn(conversationalSearch);
  const mutation = useMutation({
    mutationFn: (v: string) => search({ data: { query: v } }),
  });

  useEffect(() => {
    if (q && q.length > 1) mutation.mutate(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function submit() {
    if (query.trim().length < 2) return;
    mutation.mutate(query.trim());
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <section className="max-w-5xl mx-auto pt-12 pb-8 px-6">
        <div className="bg-surface-elevated ring-1 ring-black/5 rounded-2xl shadow-md p-5">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }}}
            className="w-full bg-transparent border-none outline-none focus:ring-0 text-lg placeholder:text-muted-foreground/50 resize-none min-h-[80px]"
            placeholder="Describe what you're looking for..."
          />
          <div className="flex items-center justify-end pt-4 border-t border-border">
            <button
              onClick={submit}
              disabled={mutation.isPending}
              className="bg-foreground text-background px-6 py-2.5 rounded-full font-bold text-sm hover:bg-accent transition-colors disabled:opacity-50"
            >
              {mutation.isPending ? "Thinking..." : "Consult AI →"}
            </button>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* AI Reasoning */}
        <div className="lg:col-span-4">
          <div className="sticky top-24">
            <div className="font-mono text-[10px] text-accent uppercase tracking-widest mb-4">
              Assistant Reasoning
            </div>
            {mutation.isPending && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="size-2 bg-accent rounded-full animate-pulse" />
                  <span className="text-[11px] font-mono uppercase text-muted-foreground">Synthesizing…</span>
                </div>
                <div className="h-4 bg-muted/50 rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-muted/50 rounded w-full animate-pulse" />
                <div className="h-4 bg-muted/50 rounded w-1/2 animate-pulse" />
              </div>
            )}
            {mutation.isError && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-sm">
                Search failed. Try again in a moment.
              </div>
            )}
            {mutation.data && (
              <div className="space-y-6 animate-fade-in">
                <p className="text-lg leading-relaxed text-pretty font-display italic">
                  "{mutation.data.reasoning}"
                </p>
                {mutation.data.criteria.length > 0 && (
                  <div className="p-4 bg-surface-elevated/70 border border-border rounded-lg space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="size-2 bg-green-500 rounded-full" />
                      <span className="text-[11px] font-mono uppercase text-muted-foreground">Criteria applied</span>
                    </div>
                    <ul className="text-xs space-y-2 text-muted-foreground">
                      {mutation.data.criteria.map((c, i) => (
                        <li key={i} className="flex gap-2"><span>→</span>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {!mutation.isPending && !mutation.data && !mutation.isError && (
              <p className="text-sm text-muted-foreground">
                Ask a question above to see the assistant reason about your needs.
              </p>
            )}
          </div>
        </div>

        {/* Products */}
        <div className="lg:col-span-8">
          {mutation.data && mutation.data.matches.length === 0 && (
            <div className="p-8 border border-dashed border-border rounded-2xl text-center text-muted-foreground">
              No matches. Try rephrasing.
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {mutation.data?.matches.map((m, i) => (
              <div key={m.id} className="animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                <ProductCard product={m.product} match={m.match} insight={m.insight} />
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
