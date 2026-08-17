import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Nav } from "@/components/marketplace/Nav";
import { Footer } from "@/components/marketplace/Footer";
import { ChatAssistant } from "@/components/marketplace/ChatAssistant";

const searchSchema = z.object({ q: z.string().optional() });

export const Route = createFileRoute("/discover")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "AI Shop Assistant — Synthetix" },
      {
        name: "description",
        content:
          "6-Agent chain with vision scanning to find local shops, products, and services near you.",
      },
    ],
  }),
  component: Discover,
});

function Discover() {
  const { q } = Route.useSearch();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <Nav />

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-8 pb-16 w-full">
        {/* Page Hero Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-3">
          <span className="font-mono text-xs uppercase tracking-widest text-accent font-semibold px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
            Multi-Agent Vision Intelligence
          </span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Ask or Scan. Find Nearby.
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Upload a photo of any item or type what you're looking for. Our 6-agent chain
            identifies, resolves location, searches, ranks, and verifies top local shops for you.
          </p>
        </div>

        {/* Chat Assistant Interface */}
        <ChatAssistant initialQuery={q ?? ""} />
      </main>

      <Footer />
    </div>
  );
}
