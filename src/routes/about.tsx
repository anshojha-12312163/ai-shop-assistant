import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/marketplace/Nav";
import { Footer } from "@/components/marketplace/Footer";
import { Sparkles, Shield, TrendingUp, Users } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — Synthetix" },
      {
        name: "description",
        content:
          "We're building the first AI-native marketplace. Learn our mission, values, and why we believe AI changes everything about how people shop and sell.",
      },
    ],
  }),
  component: AboutPage,
});

const differentiators = [
  {
    icon: Sparkles,
    title: "AI that reasons, not ranks",
    description:
      "Synthetix doesn't sort by keyword. It reads your intent, weighs product attributes, and explains every choice — like a knowledgeable friend who knows the whole catalog.",
  },
  {
    icon: Shield,
    title: "Seller co-pilot built in",
    description:
      "From rough notes to polished listings in seconds. Our AI writes titles, descriptions, and suggests prices based on real market signals — not guesswork.",
  },
  {
    icon: TrendingUp,
    title: "Reviews synthesized, not scrolled",
    description:
      "Stop reading 200 reviews. Our AI reads them all and gives you pros, cons, and a trust grade you can act on in under 10 seconds.",
  },
];

const stats = [
  { value: "30+", label: "Independent makers" },
  { value: "100+", label: "Curated products" },
  { value: "< 3s", label: "Avg. AI search" },
  { value: "2026", label: "AI-first since" },
];

const team = [
  {
    name: "Aria Chen",
    role: "CEO & Co-founder",
    bio: "Former ML engineer at a major retailer. Spent 6 years building search systems that never actually understood what people wanted.",
    seed: "aria-chen-founder",
  },
  {
    name: "Declan Walsh",
    role: "CTO & Co-founder",
    bio: "Built marketplaces for a decade. Believes every bad shopping experience is a product failure, not a user failure.",
    seed: "declan-walsh-founder",
  },
  {
    name: "Priya Nair",
    role: "Head of AI",
    bio: "PhD in NLP. Led language model research before deciding that talking to a computer about hiking boots was more interesting.",
    seed: "priya-nair-founder",
  },
];

function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      {/* Hero */}
      <section className="max-w-5xl mx-auto pt-24 pb-20 px-6 animate-slide-up">
        <span className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Our mission
        </span>
        <h1 className="text-6xl md:text-7xl font-bold tracking-tight mt-4 mb-8 text-balance leading-[1.05]">
          Shopping should{" "}
          <span className="font-display italic font-normal text-accent">understand</span> you.
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
          We built Synthetix because we were tired of guessing keywords, drowning in filters, and
          writing product descriptions no one reads. There's a better way — and it starts with
          language.
        </p>
      </section>

      {/* Mission quote */}
      <section className="bg-foreground text-background py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-2xl md:text-3xl font-display italic text-balance leading-[1.4] text-background/90">
            "We believe the future of commerce isn't more categories and faceted search — it's a
            conversation between buyer, seller, and an AI that actually cares about the outcome."
          </p>
          <p className="mt-8 text-background/50 text-sm font-mono uppercase tracking-widest">
            — The Synthetix Team, San Francisco 2026
          </p>
        </div>
      </section>

      {/* Why different */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <span className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Why we're different
        </span>
        <h2 className="text-4xl font-bold mt-3 mb-16">AI-first, in every corner.</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {differentiators.map((d) => (
            <div
              key={d.title}
              className="p-8 bg-surface-elevated ring-1 ring-black/5 rounded-2xl space-y-4 hover:ring-accent/30 transition-all duration-300"
            >
              <div className="size-12 bg-accent/10 rounded-xl flex items-center justify-center">
                <d.icon className="size-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold">{d.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{d.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-border py-16 px-6 bg-secondary/30">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-4xl font-bold text-accent">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-2 font-mono uppercase tracking-widest">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <span className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Founders
        </span>
        <h2 className="text-4xl font-bold mt-3 mb-12">Built by people who love making things.</h2>
        <div className="grid md:grid-cols-3 gap-10">
          {team.map((t) => (
            <div key={t.name} className="space-y-4">
              <img
                src={`https://picsum.photos/seed/${t.seed}/200/200`}
                alt={t.name}
                className="w-20 h-20 rounded-full object-cover ring-2 ring-accent/20"
              />
              <div>
                <h3 className="font-bold text-lg">{t.name}</h3>
                <p className="text-sm text-accent font-mono uppercase tracking-widest mt-0.5">
                  {t.role}
                </p>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{t.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Seller CTA */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="bg-foreground text-background rounded-3xl p-12 text-center">
          <Users className="size-10 mx-auto mb-6 opacity-60" />
          <h2 className="text-3xl font-bold mb-4">Join 30+ independent makers</h2>
          <p className="text-background/60 mb-8 max-w-md mx-auto">
            List your first product in under 3 minutes. No experience required — just describe what
            you make.
          </p>
          <a
            href="/auth?mode=signup&role=seller"
            className="inline-block bg-background text-foreground px-8 py-3 rounded-full font-bold hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Start selling free →
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
