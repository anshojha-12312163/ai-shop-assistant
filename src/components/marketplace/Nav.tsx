import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { ShoppingBag, LogOut, User, Store, ChevronDown, Menu, X } from "lucide-react";
import { toast } from "sonner";

type Session = {
  email: string;
  id: string;
  displayName: string;
  isSeller: boolean;
  plan: "PRO" | "FREE";
};

export function Nav() {
  const { count } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isSellerRoute = location.pathname.startsWith("/seller");

  // ── Load session + roles ──────────────────────────────────
  useEffect(() => {
    let mounted = true;

    async function updateSession(user: {
      id: string;
      email?: string;
      user_metadata?: Record<string, any>;
    }) {
      const email = user.email ?? "";
      const metaName =
        user.user_metadata?.display_name ||
        user.user_metadata?.full_name ||
        (email ? email.split("@")[0] : "User");

      // Instantly set session from user token data
      if (mounted) {
        setSession({ email, id: user.id, displayName: metaName, isSeller: false, plan: "PRO" });
      }

      // Fetch extra roles/profile data asynchronously without blocking UI
      try {
        const [rolesResult, profileResult] = await Promise.all([
          supabase.from("user_roles").select("role").eq("user_id", user.id),
          supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
        ]);

        if (!mounted) return;
        const isSeller = !!rolesResult.data?.some((r) => r.role === "seller");
        const displayName = profileResult.data?.display_name || metaName;
        setSession({ email, id: user.id, displayName, isSeller, plan: "PRO" });
      } catch (err) {
        console.warn("Profile roles query error:", err);
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session?.user) {
        updateSession(data.session.user);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!mounted) return;
      if (s?.user) {
        updateSession(s.user);
      } else {
        setSession(null);
        setDropdownOpen(false);
      }
    });

    function handleStorageChange() {
      supabase.auth.getSession().then(({ data }) => {
        if (!mounted) return;
        if (data.session?.user) {
          updateSession(data.session.user);
        } else {
          setSession(null);
        }
      });
    }

    window.addEventListener("storage", handleStorageChange);

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // ── Close dropdown on outside click ──────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => setMobileOpen(false), [location.pathname]);

  async function signOut() {
    setDropdownOpen(false);
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  }

  const initials = session?.displayName
    ? session.displayName.slice(0, 2).toUpperCase()
    : (session?.email?.slice(0, 2).toUpperCase() ?? "");

  const currentPath = location.pathname;
  const isMerchantDashboard =
    currentPath.startsWith("/merchant") || currentPath.startsWith("/merchants");

  const customerNavLinks = [
    { label: "Discover 📍", href: "/nearby", exact: true },
    { label: "AI Assistant ✨", href: "/discover" },
    { label: "Scan 🔍", href: "/lens" },
    { label: "About", href: "/about" },
    { label: "Pricing", href: "/pricing" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-background/85 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        {/* Left — logo + desktop nav links */}
        <div className="flex items-center gap-8">
          <Link to="/" className="text-xl font-bold tracking-tighter uppercase">
            Synthetix
          </Link>
          <div className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
            {customerNavLinks.map((l) => (
              <Link
                key={l.label}
                to={l.href}
                className="hover:text-foreground [&.active]:text-foreground"
                activeOptions={l.exact ? { exact: true } : undefined}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right — For Merchants link + cart + user */}
        <div className="flex items-center gap-4">
          <Link
            to="/merchants"
            className="hidden sm:inline-flex text-xs font-bold text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-full hover:bg-secondary transition-colors"
          >
            For Merchants 🏪
          </Link>
          {/* Buyer/Seller context switcher (seller accounts, desktop) */}
          {session?.isSeller && (
            <div className="hidden sm:flex bg-black/5 p-1 rounded-full">
              <Link
                to="/"
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors ${!isSellerRoute ? "bg-white shadow-sm" : "text-muted-foreground"}`}
              >
                Buyer
              </Link>
              <Link
                to="/seller"
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors ${isSellerRoute ? "bg-white shadow-sm" : "text-muted-foreground"}`}
              >
                Seller
              </Link>
            </div>
          )}

          {/* Cart */}
          <Link to="/cart" className="relative p-2 rounded-full hover:bg-black/5 transition-colors">
            <ShoppingBag className="size-5" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-accent text-accent-foreground text-[10px] font-bold rounded-full size-4 flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>

          {/* Signed in → Account Name + PRO/FREE Badge + Avatar Dropdown */}
          {session ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full bg-secondary/80 hover:bg-secondary border border-border transition-all shadow-xs"
              >
                <div className="size-7 rounded-full bg-accent text-accent-foreground font-extrabold text-xs flex items-center justify-center shadow-xs">
                  {initials}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <span className="max-w-[110px] sm:max-w-[140px] truncate">
                    {session.displayName}
                  </span>
                  <span className="bg-amber-500 text-white font-mono text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                    {session.plan}
                  </span>
                </div>
                <ChevronDown
                  className={`size-3.5 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-surface-elevated ring-1 ring-black/5 rounded-2xl shadow-2xl p-2.5 z-50 animate-slide-up border border-border">
                  {/* User info header */}
                  <div className="px-3 py-2.5 mb-1 bg-secondary/40 rounded-xl">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold truncate text-foreground">
                        {session.displayName}
                      </p>
                      <span className="bg-amber-500 text-white text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full">
                        {session.plan} Plan
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {session.email}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider bg-accent/15 text-accent font-bold rounded-full px-2.5 py-0.5 border border-accent/20">
                        {session.isSeller ? "Seller Account" : "Verified Buyer"}
                      </span>
                    </div>
                  </div>
                  <div className="h-px bg-border mx-1 mb-1" />

                  {/* Menu items */}
                  {[
                    ...(session.isSeller
                      ? [{ icon: Store, label: "Seller Studio", href: "/seller" }]
                      : []),
                    { icon: User, label: "My Profile & Plan", href: "/profile" },
                  ].map(({ icon: Icon, label, href }) => (
                    <Link
                      key={label}
                      to={href}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-secondary transition-colors"
                    >
                      <Icon className="size-4 text-muted-foreground" />
                      {label}
                    </Link>
                  ))}

                  <div className="h-px bg-border mx-1 my-1" />
                  <button
                    onClick={signOut}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="size-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/auth"
              className="text-sm font-bold px-4 py-2 rounded-full bg-foreground text-background hover:bg-accent transition-colors shadow-xs"
            >
              Sign in
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden p-2 rounded-full hover:bg-secondary transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur px-6 py-4 space-y-1 animate-slide-up">
          {customerNavLinks.map((l) => (
            <Link
              key={l.label}
              to={l.href}
              className="block py-3 text-sm font-medium text-muted-foreground hover:text-foreground border-b border-border/50 last:border-0"
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/merchants"
            className="block py-3 text-sm font-bold text-emerald-600 dark:text-emerald-400 border-b border-border/50"
          >
            For Merchants 🏪
          </Link>
          {session?.isSeller && (
            <Link
              to="/seller"
              className="block py-3 text-sm font-medium text-muted-foreground hover:text-foreground border-b border-border/50"
            >
              Seller Studio
            </Link>
          )}
          {session ? (
            <button
              onClick={signOut}
              className="w-full text-left py-3 text-sm font-medium text-red-600 hover:text-red-700"
            >
              Sign out
            </button>
          ) : (
            <Link to="/auth" className="block py-3 text-sm font-bold">
              Sign in / Create account
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
