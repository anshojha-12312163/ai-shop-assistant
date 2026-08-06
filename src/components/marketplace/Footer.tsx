import { Link } from "@tanstack/react-router";
import { Twitter, Instagram, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-foreground text-background mt-24">
      {/* 4-column grid */}
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-background/10">

          {/* Brand */}
          <div className="space-y-5">
            <span className="text-xl font-bold tracking-tighter uppercase">Synthetix</span>
            <p className="text-sm text-background/55 leading-relaxed">
              The marketplace that shops and sells with you. AI-first discovery, human-first design.
            </p>
            <div className="flex gap-2.5 pt-1">
              {[
                { Icon: Twitter, label: "Twitter" },
                { Icon: Instagram, label: "Instagram" },
                { Icon: Linkedin, label: "LinkedIn" },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="size-9 rounded-full bg-background/10 flex items-center justify-center hover:bg-accent/80 transition-colors"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Marketplace */}
          <div>
            <h4 className="text-[11px] font-mono uppercase tracking-widest text-background/40 mb-5">Marketplace</h4>
            <ul className="space-y-3 text-sm text-background/70">
              {[
                { label: "Browse", href: "/" },
                { label: "Discover", href: "/discover" },
                { label: "About Us", href: "/about" },
                { label: "Pricing", href: "/pricing" },
                { label: "FAQ", href: "/faq" },
              ].map((l) => (
                <li key={l.label}>
                  <Link to={l.href} className="hover:text-background transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sellers */}
          <div>
            <h4 className="text-[11px] font-mono uppercase tracking-widest text-background/40 mb-5">Sellers</h4>
            <ul className="space-y-3 text-sm text-background/70">
              {[
                { label: "Start selling", href: "/auth?mode=signup&role=seller" },
                { label: "Seller Studio", href: "/seller" },
                { label: "Subscription tiers", href: "/pricing" },
                { label: "AI listing guide", href: "/faq" },
                { label: "Draft a listing", href: "/seller/new" },
              ].map((l) => (
                <li key={l.label}>
                  <Link to={l.href} className="hover:text-background transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support + Contact */}
          <div>
            <h4 className="text-[11px] font-mono uppercase tracking-widest text-background/40 mb-5">Support</h4>
            <ul className="space-y-3 text-sm text-background/70 mb-6">
              {[
                { label: "FAQ", href: "/faq" },
                { label: "Terms of service", href: "/faq" },
                { label: "Privacy policy", href: "/faq" },
                { label: "AI Ethics", href: "/faq" },
              ].map((l) => (
                <li key={l.label}>
                  <Link to={l.href} className="hover:text-background transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="space-y-1.5 text-xs text-background/40 font-mono">
              <div>support@synthetix.io</div>
              <div>San Francisco, CA 94102</div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-background/35 font-mono">
          <span>© 2026 Synthetix Inc. · AI-powered marketplace</span>
          <div className="flex gap-6">
            <Link to="/faq" className="hover:text-background/60 transition-colors">Terms</Link>
            <Link to="/faq" className="hover:text-background/60 transition-colors">Privacy</Link>
            <Link to="/faq" className="hover:text-background/60 transition-colors">Cookies</Link>
            <Link to="/about" className="hover:text-background/60 transition-colors">AI Ethics</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
