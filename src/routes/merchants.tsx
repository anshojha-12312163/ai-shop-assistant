import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav } from "@/components/marketplace/Nav";
import { Footer } from "@/components/marketplace/Footer";
import { getSupportWhatsAppUrl } from "@/lib/whatsapp";
import {
  Store,
  MessageSquare,
  Sparkles,
  Share2,
  PackagePlus,
  Boxes,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/merchants")({
  head: () => ({
    meta: [
      { title: "For Merchants — Synthetix AI Local Shop Platform" },
      {
        name: "description",
        content:
          "Self-report inventory, boost confidence scores, parse WhatsApp texts, and get customer search leads for local store owners.",
      },
    ],
  }),
  component: MerchantLandingPage,
});

function MerchantLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Nav />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-16 w-full animate-fade-in">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent/10 text-accent font-mono text-xs font-bold rounded-full border border-accent/20 uppercase">
            <Store className="size-3.5 text-accent" />
            SYNTHETIX FOR LOCAL STORE OWNERS
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
            Put Your Local Store on the <span className="text-accent underline decoration-accent/40 underline-offset-8">AI Map</span>
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Synthetix connects local store owners directly with buyers searching nearby. Self-report inventory in seconds, broadcast WhatsApp catalogs, and hold reservations for incoming customers.
          </p>
          <div className="pt-2 flex justify-center gap-4 flex-wrap">
            <Link
              to="/merchant"
              className="bg-foreground text-background hover:bg-accent font-extrabold px-6 py-3.5 rounded-full text-sm flex items-center gap-2 shadow-lg transition-all hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-[44px]"
            >
              <Sparkles className="size-4" />
              Open Merchant Dashboard
            </Link>
            <a
              href="#pricing"
              className="border border-border bg-secondary hover:bg-secondary/80 text-foreground font-bold px-6 py-3.5 rounded-full text-sm flex items-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-[44px]"
            >
              View Pricing Tiers ↓
            </a>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-surface-elevated border border-border rounded-3xl space-y-3 hover:border-accent/40 transition-colors shadow-2xs">
            <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
              <PackagePlus className="size-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Text-to-Inventory AI</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Paste raw WhatsApp notes or supplier messages. Synthetix AI extracts items, pricing, and quantities with a mandatory approval step before publishing.
            </p>
          </div>

          <div className="p-6 bg-surface-elevated border border-border rounded-3xl space-y-3 hover:border-emerald-500/40 transition-colors shadow-2xs">
            <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
              <Share2 className="size-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">1-Click WhatsApp Broadcast</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Auto-generate clean formatted WhatsApp catalog messages with stock badges, pricing, and direct buy links for broadcast lists.
            </p>
          </div>

          <div className="p-6 bg-surface-elevated border border-border rounded-3xl space-y-3 hover:border-sky-500/40 transition-colors shadow-2xs">
            <div className="size-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center border border-sky-500/20">
              <Boxes className="size-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Confidence Score Badges</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Every inventory update refreshes your customer-facing Confidence Score — from 🟢 Verified minutes ago down to 🟠 Likely available if it's been a while — so shoppers always see how fresh your stock data is.
            </p>
          </div>
        </div>

        {/* Pricing Tiers */}
        <div id="pricing" className="space-y-6 pt-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">Simple Merchant Pricing</h2>
            <p className="text-xs text-muted-foreground">Start free, upgrade as your local store grows.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 max-w-3xl mx-auto">
            {/* Free Tier */}
            <div className="bg-surface-elevated border border-border rounded-3xl p-6 space-y-5">
              <div className="space-y-1">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  FREE STARTER
                </span>
                <h3 className="text-2xl font-extrabold text-foreground">Free Account</h3>
                <p className="text-3xl font-mono font-extrabold pt-2">₹0 <span className="text-xs font-sans text-muted-foreground">/ month</span></p>
              </div>

              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  Self-report inventory & confidence scores
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  Customer 45-minute reservation holds
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  Text-to-Inventory AI parsing with review step
                </li>
              </ul>

              <Link
                to="/merchant"
                className="w-full bg-secondary hover:bg-border text-foreground font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 transition-colors block text-center"
              >
                Start Free
              </Link>
            </div>

            {/* Pro Tier */}
            <div className="bg-emerald-950/20 border-2 border-emerald-500/50 rounded-3xl p-6 space-y-5 relative shadow-lg">
              <div className="space-y-1">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                  PRO MERCHANT
                </span>
                <h3 className="text-2xl font-extrabold text-foreground">Synthetix Pro</h3>
                <p className="text-3xl font-mono font-extrabold pt-2 text-foreground">₹499 <span className="text-xs font-sans text-muted-foreground">/ month</span></p>
              </div>

              <ul className="space-y-2.5 text-xs text-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  Unlimited inventory updates
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  WhatsApp Business Bot automated sync
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  Priority Sponsored Search Placement
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  Advanced Search Lead Analytics
                </li>
              </ul>

              <Link
                to="/merchant"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 transition-colors block text-center shadow-md"
              >
                Open Merchant Dashboard →
              </Link>
            </div>
          </div>
        </div>

        {/* WhatsApp Merchant Support Section */}
        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="size-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <MessageSquare className="size-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-foreground">Need Merchant Onboarding Support?</h4>
              <p className="text-xs text-muted-foreground">
                Have questions about inventory parsing or listing your local shop? Chat directly with our team.
              </p>
            </div>
          </div>
          <a
            href={getSupportWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 transition-all shadow-md shrink-0 cursor-pointer"
          >
            <MessageSquare className="size-4" />
            Chat with us on WhatsApp
          </a>
        </div>

        {/* CTA Box */}
        <div className="bg-surface-elevated border border-border rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground">Ready to list your local store?</h3>
            <p className="text-xs text-muted-foreground max-w-xl">
              Register or claim your shop in 2 minutes. Start updating stock and receiving customer reservations.
            </p>
          </div>
          <Link
            to="/merchant"
            className="bg-foreground text-background hover:bg-accent font-extrabold px-6 py-3 rounded-2xl text-xs sm:text-sm shrink-0 flex items-center gap-2 shadow-md"
          >
            Go to Merchant App
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
