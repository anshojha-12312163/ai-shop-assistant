import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/marketplace/Nav";
import { Footer } from "@/components/marketplace/Footer";
import { SupportContactForm } from "@/components/marketplace/SupportContactForm";
import { Mail, Clock, MessageSquare, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Nav />

      <main className="flex-1 max-w-5xl mx-auto py-16 px-4 sm:px-6 w-full space-y-12">
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-accent/15 text-accent font-mono text-xs font-bold rounded-full border border-accent/20">
            <Sparkles className="size-3.5" />
            <span>SYNTHETIX SUPPORT CENTER</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight">
            How can we help you?
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Have questions about local store listings, AI visual search, or seller co-pilot? Send a
            message directly to our support team at{" "}
            <strong className="text-foreground">support@synthetix.io</strong>.
          </p>
        </div>

        {/* Workspace Grid: Info + Contact Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Side: Support Info Cards (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 bg-surface-elevated border border-border rounded-3xl space-y-6 shadow-sm">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Mail className="size-5 text-accent" />
                <span>Contact Info</span>
              </h3>

              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <div className="size-8 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
                    <Mail className="size-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">Support Email</h4>
                    <p className="text-muted-foreground font-mono">support@synthetix.io</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="size-8 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
                    <Clock className="size-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">Response Time</h4>
                    <p className="text-muted-foreground">Within 24–48 hours (Mon–Fri)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="size-8 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
                    <ShieldCheck className="size-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">Encryption & Safety</h4>
                    <p className="text-muted-foreground">SSL Encrypted • Strict Privacy</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border/60">
                <Link
                  to="/faq"
                  className="w-full py-2.5 px-4 bg-secondary text-foreground hover:bg-accent hover:text-accent-foreground rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare className="size-4" />
                  <span>Check FAQ Answers</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Side: Form Component (7 Cols) */}
          <div className="lg:col-span-7 bg-surface-elevated border border-border rounded-3xl p-6 sm:p-8 shadow-md">
            <SupportContactForm />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
