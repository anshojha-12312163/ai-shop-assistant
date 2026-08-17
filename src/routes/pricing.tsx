import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Nav } from "@/components/marketplace/Nav";
import { Footer } from "@/components/marketplace/Footer";
import { Check, Zap, Crown, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Synthetix" },
      {
        name: "description",
        content:
          "Transparent seller subscription tiers. Start free, scale with AI tools. No hidden fees.",
      },
    ],
  }),
  component: PricingPage,
});

const tiers = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "forever",
    icon: Zap,
    color: "bg-secondary/50",
    badge: null,
    description: "Everything you need to start selling.",
    features: [
      "Up to 5 active listings",
      "Basic AI listing assistant",
      "Standard search placement",
      "Buyer Q&A (manual answers)",
      "5% platform commission",
      "Email support",
    ],
    cta: "Get started free",
    ctaStyle: "border border-border hover:border-accent hover:text-accent",
    stripeLive: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 19,
    period: "per month",
    icon: Zap,
    color: "bg-foreground text-background",
    badge: "Most Popular",
    description: "For makers who are serious about growth.",
    features: [
      "Up to 50 active listings",
      "Full AI co-pilot (title, description, price, tags)",
      "Priority search placement",
      "AI-drafted Q&A answers",
      "3% platform commission",
      "1 featured listing slot / month",
      "Sales analytics dashboard",
      "Priority support",
    ],
    cta: "Start Pro — $19/mo",
    ctaStyle: "bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
    stripeLive: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: 49,
    period: "per month",
    icon: Crown,
    color: "bg-accent/5",
    badge: "Best Value",
    description: "Maximum visibility. Maximum AI power.",
    features: [
      "Unlimited active listings",
      "Full AI co-pilot suite",
      "Top-of-search placement guaranteed",
      "AI-drafted Q&A, auto-approved at 90%+",
      "1% platform commission",
      "3 featured listing slots / month",
      "Advanced analytics + revenue forecasting",
      "Stripe Connect — instant payouts",
      "Dedicated account manager",
      "Custom seller storefront URL",
    ],
    cta: "Start Premium — $49/mo",
    ctaStyle: "bg-accent text-accent-foreground hover:bg-accent/90",
    stripeLive: true,
  },
];

const faqItems = [
  {
    q: "Can I change tiers at any time?",
    a: "Yes. Upgrade or downgrade instantly. You'll be billed pro-rata for the remainder of the month.",
  },
  {
    q: "What is the platform commission?",
    a: "We deduct a small commission at checkout: 5% for Free, 3% for Pro, 1% for Premium. This covers payment processing and AI infrastructure.",
  },
  {
    q: "How does Stripe Connect work?",
    a: "Premium sellers connect their Stripe account and receive payouts directly, typically within 2 business days of a completed sale.",
  },
  {
    q: "What counts as a 'featured listing slot'?",
    a: "Featured listings appear in the sponsored row on the homepage and at the top of relevant search results, marked with a gold badge.",
  },
];

function PricingPage() {
  const [stripeModal, setStripeModal] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      {/* Header */}
      <section className="max-w-4xl mx-auto pt-20 pb-12 px-6 text-center animate-slide-up">
        <span className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Transparent pricing
        </span>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mt-4 mb-6">
          Scale with <span className="font-display italic font-normal text-accent">AI tools</span>.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Start free. Upgrade when you're ready for priority placement, lower commissions, and the
          full AI co-pilot suite.
        </p>
      </section>

      {/* Tier cards */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`relative rounded-3xl p-8 flex flex-col ${tier.color} ${tier.id === "pro" ? "ring-2 ring-accent/30 shadow-xl scale-[1.02]" : "ring-1 ring-black/5"} transition-transform`}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold font-mono uppercase tracking-widest ${tier.id === "pro" ? "bg-accent text-accent-foreground" : "bg-foreground text-background"}`}
                  >
                    {tier.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h2 className={`text-xl font-bold ${tier.id === "pro" ? "text-background" : ""}`}>
                  {tier.name}
                </h2>
                <div className="flex items-baseline gap-1 mt-3">
                  <span
                    className={`text-4xl font-bold ${tier.id === "pro" ? "text-background" : ""}`}
                  >
                    {tier.price === 0 ? "Free" : `$${tier.price}`}
                  </span>
                  {tier.price > 0 && (
                    <span
                      className={`text-sm ${tier.id === "pro" ? "text-background/60" : "text-muted-foreground"}`}
                    >
                      /{tier.period}
                    </span>
                  )}
                </div>
                <p
                  className={`text-sm mt-3 ${tier.id === "pro" ? "text-background/70" : "text-muted-foreground"}`}
                >
                  {tier.description}
                </p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check
                      className={`size-4 shrink-0 mt-0.5 ${tier.id === "pro" ? "text-background/80" : "text-accent"}`}
                    />
                    <span className={tier.id === "pro" ? "text-background/85" : ""}>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => {
                  if (tier.stripeLive) setStripeModal(tier.name);
                  else window.location.href = "/auth?mode=signup&role=seller";
                }}
                className={`w-full py-3 rounded-full font-bold text-sm transition-colors ${tier.ctaStyle}`}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Commission comparison */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold mb-8 text-center">Commission at a glance</h2>
        <div className="bg-surface-elevated ring-1 ring-black/5 rounded-2xl overflow-hidden">
          {[
            ["Free", "5%", "Standard"],
            ["Pro", "3%", "Priority"],
            ["Premium", "1%", "Top placement"],
          ].map(([tier, commission, placement]) => (
            <div
              key={tier}
              className="flex items-center justify-between px-6 py-4 border-b border-border last:border-b-0"
            >
              <span className="font-bold">{tier}</span>
              <span className="text-accent font-mono font-bold">{commission} commission</span>
              <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                {placement}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold mb-8 text-center">Common questions</h2>
        <div className="space-y-4">
          {faqItems.map((item) => (
            <PricingFAQItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </section>

      {/* Stripe mock modal */}
      {stripeModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => setStripeModal(null)}
        >
          <div
            className="bg-background rounded-2xl p-8 max-w-md w-full ring-1 ring-black/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 bg-[#635BFF] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <div>
                <h3 className="font-bold">Connect with Stripe</h3>
                <p className="text-xs text-muted-foreground">
                  Synthetix uses Stripe Connect for payouts
                </p>
              </div>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6">
              <p className="text-sm text-amber-800 font-medium">Demo mode active</p>
              <p className="text-xs text-amber-700 mt-1">
                Add <code className="bg-amber-100 px-1 rounded">VITE_STRIPE_PUBLISHABLE_KEY</code>{" "}
                to your <code className="bg-amber-100 px-1 rounded">.env</code> file to enable real
                Stripe Connect for {stripeModal}.
              </p>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              In production, you'd be redirected to Stripe's onboarding to connect your bank account
              and enable instant payouts for your {stripeModal} plan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setStripeModal(null)}
                className="flex-1 py-2.5 rounded-full border border-border font-bold text-sm hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <a
                href="https://stripe.com/connect"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 rounded-full bg-[#635BFF] text-white font-bold text-sm text-center flex items-center justify-center gap-2 hover:bg-[#5349e5] transition-colors"
              >
                Learn more <ExternalLink className="size-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

function PricingFAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-surface-elevated ring-1 ring-black/5 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 font-medium hover:bg-secondary/30 transition-colors"
      >
        {q}
        <span
          className={`text-accent font-mono text-xl shrink-0 transition-transform ${open ? "rotate-45" : ""}`}
        >
          +
        </span>
      </button>
      {open && (
        <div className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
          {a}
        </div>
      )}
    </div>
  );
}
