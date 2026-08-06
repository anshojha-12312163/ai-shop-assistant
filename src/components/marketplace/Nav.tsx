import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
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
};

export function Nav() {
  const [session, setSession] = useState<Session | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { count } = useCart();
  const router = useRouterState();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isSellerRoute = router.location.pathname.startsWith("/seller");

  // ── Load session + roles ──────────────────────────────────
  useEffect(() => {
    let mounted = true;

    async function loadSession(userId: string, email: string) {
      const [rolesResult, profileResult] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle(),
      ]);
      if (!mounted) return;
      const isSeller = !!rolesResult.data?.some((r) => r.role === "seller");
      const displayName = profileResult.data?.display_name ?? email.split("@")[0];
      setSession({ email, id: userId, displayName, isSeller });
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session?.user) {
        loadSession(data.session.user.id, data.session.user.email ?? "");
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      if (!mounted) return;
      if (s?.user) {
        await loadSession(s.user.id, s.user.email ?? "");
      } else {
        setSession(null);
        setDropdownOpen(false);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
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
  useEffect(() => setMobileOpen(false), [router.location.pathname]);

  async function signOut() {
    setDropdownOpen(false);
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  }

  const initials = session?.displayName
    ? session.displayName.slice(0, 2).toUpperCase()
    : session?.email?.slice(0, 2).toUpperCase() ?? "";

  const navLinks = [
    { label: "Marketplace", href: "/", exact: true },
    { label: "AI Shop Assistant ✨", href: "/discover" },
    { label: "About", href: "/about" },
    { label: "Pricing", href: "/pricing" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-background/85 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">

        {/* Left — logo + desktop nav links */}
        <div className="flex items-center gap-8">
          <Link to="/" className="text-xl font-bold tracking-tighter uppercase">Synthetix</Link>
          <div className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
            {navLinks.map((l) => (
              <Link
                key={l.label}
                to={l.href}
                className="hover:text-foreground [&.active]:text-foreground"
                activeOptions={l.exact ? { exact: true } : undefined}
              >
                {l.label}
              </Link>
            ))}
            {session?.isSeller && (
              <Link to="/seller" className="hover:text-foreground [&.active]:text-foreground">
                Seller Studio
              </Link>
            )}
          </div>
        </div>

        {/* Right — cart + user */}
        <div className="flex items-center gap-3">

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

          {/* Signed in → avatar dropdown */}
          {session ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full hover:bg-secondary transition-colors"
              >
                <div className="size-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-[11px] font-bold text-accent">
                  {initials}
                </div>
                <ChevronDown className={`size-3.5 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-surface-elevated ring-1 ring-black/5 rounded-2xl shadow-2xl p-2 z-50 animate-slide-up">
                  {/* User info header */}
                  <div className="px-3 py-2.5 mb-1">
                    <p className="text-sm font-bold truncate">{session.displayName}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{session.email}</p>
                    <span className="mt-1.5 inline-block text-[9px] font-mono uppercase tracking-widest bg-secondary rounded-full px-2 py-0.5">
                      {session.isSeller ? "Seller · Free Plan" : "Buyer"}
                    </span>
                  </div>
                  <div className="h-px bg-border mx-1 mb-1" />

                  {/* Menu items */}
                  {[
                    ...(session.isSeller
                      ? [{ icon: Store, label: "Seller Studio", href: "/seller" }]
                      : []),
                    { icon: User, label: "Profile", href: "/profile" },
                  ].map(({ icon: Icon, label, href }) => (
                    <Link
                      key={label}
                      to={href}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-secondary transition-colors"
                    >
                      <Icon className="size-4 text-muted-foreground" />
                      {label}
                    </Link>
                  ))}

                  <div className="h-px bg-border mx-1 my-1" />
                  <button
                    onClick={signOut}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors"
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
              className="text-sm font-bold px-4 py-2 rounded-full bg-foreground text-background hover:bg-accent transition-colors"
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
          {navLinks.map((l) => (
            <Link
              key={l.label}
              to={l.href}
              className="block py-3 text-sm font-medium text-muted-foreground hover:text-foreground border-b border-border/50 last:border-0"
            >
              {l.label}
            </Link>
          ))}
          {session?.isSeller && (
            <Link to="/seller" className="block py-3 text-sm font-medium text-muted-foreground hover:text-foreground border-b border-border/50">
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
