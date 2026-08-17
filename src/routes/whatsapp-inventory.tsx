import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Nav } from "@/components/marketplace/Nav";
import { Footer } from "@/components/marketplace/Footer";
import { WhatsAppInventoryModal } from "@/components/marketplace/WhatsAppInventoryModal";
import {
  MessageSquare,
  Sparkles,
  Share2,
  PackagePlus,
  Boxes,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/whatsapp-inventory")({
  head: () => ({
    meta: [
      { title: "WhatsApp Inventory Assistant — Synthetix" },
      {
        name: "description",
        content:
          "Sync, broadcast, and manage local shop inventory via WhatsApp catalog integration.",
      },
    ],
  }),
  component: WhatsAppInventoryPage,
});

function WhatsAppInventoryPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Nav />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-12 w-full animate-fade-in">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold rounded-full border border-emerald-500/20 uppercase">
            <MessageSquare className="size-3.5 text-emerald-500" />
            WHATSAPP INVENTORY SYNC 2.0
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
            Manage & Broadcast Local Inventory on <span className="text-emerald-600">WhatsApp</span>
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Import inventory straight from raw WhatsApp supplier texts, generate formatted WhatsApp broadcast catalogs, and let local buyers inquire stock in one tap.
          </p>
          <div className="pt-2 flex justify-center gap-4 flex-wrap">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-3.5 rounded-full text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Sparkles className="size-4" />
              Launch WhatsApp Inventory Hub
            </button>
            <Link
              to="/seller"
              className="border border-border bg-secondary hover:bg-secondary/80 text-foreground font-bold px-6 py-3.5 rounded-full text-sm flex items-center gap-2 transition-all"
            >
              Seller Studio →
            </Link>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="p-6 bg-surface-elevated border border-border rounded-3xl space-y-3 hover:border-emerald-500/40 transition-colors shadow-2xs">
            <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
              <Share2 className="size-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">1-Click Broadcast</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Auto-generate clean formatted WhatsApp catalog messages with stock counts and direct buy links for your broadcast groups.
            </p>
          </div>

          <div className="p-6 bg-surface-elevated border border-border rounded-3xl space-y-3 hover:border-amber-500/40 transition-colors shadow-2xs">
            <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
              <PackagePlus className="size-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Text-to-Inventory AI</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Paste raw WhatsApp notes or supplier messages. Synthetix AI extracts items, pricing, and quantities automatically.
            </p>
          </div>

          <div className="p-6 bg-surface-elevated border border-border rounded-3xl space-y-3 hover:border-sky-500/40 transition-colors shadow-2xs">
            <div className="size-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center border border-sky-500/20">
              <Boxes className="size-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Instant Stock Inquiry</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Shoppers can tap "Check Stock on WhatsApp" on any product page to chat directly with verified local store owners in India.
            </p>
          </div>
        </div>

        {/* Demo Interactive Banner */}
        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground">Ready to try WhatsApp Inventory?</h3>
            <p className="text-xs text-muted-foreground max-w-xl">
              Open the interactive WhatsApp Inventory Manager to test text parsing, preview WhatsApp broadcast catalogs, or manage live stock levels.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-3 rounded-2xl text-xs sm:text-sm shrink-0 flex items-center gap-2 cursor-pointer shadow-md"
          >
            Open Manager
            <ArrowRight className="size-4" />
          </button>
        </div>
      </main>

      <Footer />

      <WhatsAppInventoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
