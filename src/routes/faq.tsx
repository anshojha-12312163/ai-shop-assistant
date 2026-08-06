import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Nav } from "@/components/marketplace/Nav";
import { Footer } from "@/components/marketplace/Footer";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Synthetix" },
      { name: "description", content: "Answers to common questions about Synthetix — buying, selling, AI features, commissions, and payouts." },
    ],
  }),
  component: FAQPage,
});

const categories = [
  {
    title: "For Buyers",
    items: [
      {
        q: "How does AI search work?",
        a: "Type what you want in plain English — no keywords required. Synthetix's AI reads your intent, scans the full catalog, and returns the best matches with a one-sentence explanation for each recommendation. The more specific you are, the better it gets.",
      },
      {
        q: "Are the AI review summaries accurate?",
        a: "The AI reads every verified review and summarizes Pros and Cons based only on what reviewers actually said. It never invents facts. You'll also see a 'trust grade' (A+, A, B, C) based on rating consistency and how specific the reviews are.",
      },
      {
        q: "Can I return a product?",
        a: "Return policies are set by individual sellers. Look for the return policy in each product listing. Synthetix facilitates disputes — contact support@synthetix.io if you have a problem with an order.",
      },
      {
        q: "Is checkout secure?",
        a: "Yes. All payments are processed via Stripe — PCI-DSS Level 1 certified. We never store your card details. You'll see the 🔒 Secure Checkout badge at every checkout step.",
      },
    ],
  },
  {
    title: "For Sellers",
    items: [
      {
        q: "How do I start selling?",
        a: "Sign up for a free account, enable your Seller Studio with one click, then use the AI listing assistant to create your first listing in under 3 minutes. Describe your product in rough notes — the AI handles the rest.",
      },
      {
        q: "What commission does Synthetix take?",
        a: "Platform commission depends on your subscription: Free plan = 5%, Pro = 3%, Premium = 1%. Commission is automatically deducted at checkout. The buyer pays your listed price; you receive the remainder after commission.",
      },
      {
        q: "How do sponsored / featured listings work?",
        a: "Pro sellers get 1 featured slot per month, Premium sellers get 3. Featured products appear in the sponsored row on the homepage and rank above standard results for relevant searches. Slots are assigned monthly via your Seller Studio.",
      },
      {
        q: "When do I get paid?",
        a: "Free and Pro sellers receive payouts weekly via bank transfer. Premium sellers with Stripe Connect enabled receive payouts within 2 business days of a completed sale.",
      },
    ],
  },
  {
    title: "Platform & AI",
    items: [
      {
        q: "What AI model powers Synthetix?",
        a: "Synthetix uses a state-of-the-art large language model via our AI gateway. It powers the conversational search, listing co-pilot, review summarizer, and buyer Q&A drafting. The model is updated regularly.",
      },
      {
        q: "Is my data used to train AI models?",
        a: "No. Your product data, reviews, and conversations are never used to train external AI models. See our Privacy Policy and AI Ethics page for full details.",
      },
    ],
  },
];

function FAQPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      <section className="max-w-3xl mx-auto pt-20 pb-12 px-6 text-center animate-slide-up">
        <span className="font-mono text-[10px] uppercase tracking-widest text-accent">Help center</span>
        <h1 className="text-5xl font-bold tracking-tight mt-4 mb-6">
          Frequently asked <span className="font-display italic font-normal text-accent">questions</span>.
        </h1>
        <p className="text-lg text-muted-foreground">
          Everything you need to know about buying and selling on Synthetix. Can't find what you need?{" "}
          <a href="mailto:support@synthetix.io" className="text-accent underline underline-offset-4">Email us</a>.
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-24 space-y-16">
        {categories.map((cat) => (
          <div key={cat.title}>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
              <span className="flex-1 h-px bg-border" />
              <span>{cat.title}</span>
              <span className="flex-1 h-px bg-border" />
            </h2>
            <div className="space-y-3">
              {cat.items.map((item) => (
                <FAQItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Contact CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <div className="bg-foreground text-background rounded-2xl p-10 text-center">
          <h2 className="text-2xl font-bold mb-3">Still have questions?</h2>
          <p className="text-background/60 mb-6">Our team responds within 24 hours on business days.</p>
          <a
            href="mailto:support@synthetix.io"
            className="inline-block bg-background text-foreground px-8 py-3 rounded-full font-bold hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Contact support
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-surface-elevated ring-1 ring-black/5 rounded-xl overflow-hidden transition-all">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 font-medium hover:bg-secondary/30 transition-colors"
        aria-expanded={open}
      >
        <span>{q}</span>
        <span className={`text-accent font-mono text-2xl leading-none shrink-0 transition-transform duration-200 ${open ? "rotate-45" : ""}`}>+</span>
      </button>
      {open && (
        <div className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4 animate-fade-in">
          {a}
        </div>
      )}
    </div>
  );
}
