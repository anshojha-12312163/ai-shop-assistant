import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { ShoppingBag } from "lucide-react";

export function Nav() {
  const [session, setSession] = useState<{ email: string; id: string; isSeller: boolean } | null>(null);
  const { count } = useCart();
  const router = useRouterState();
  const isSellerRoute = router.location.pathname.startsWith("/seller");

  useEffect(() => {
    let mounted = true;
    async function loadRoles(userId: string) {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      const isSeller = !!data?.some((r) => r.role === "seller");
      return isSeller;
    }
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      if (data.session?.user) {
        const isSeller = await loadRoles(data.session.user.id);
        setSession({ email: data.session.user.email ?? "", id: data.session.user.id, isSeller });
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      if (!mounted) return;
      if (s?.user) {
        const isSeller = await loadRoles(s.user.id);
        setSession({ email: s.user.email ?? "", id: s.user.id, isSeller });
      } else setSession(null);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  const initials = session?.email ? session.email.slice(0, 2).toUpperCase() : "";

  return (
    <nav className="sticky top-0 z-50 bg-background/85 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-xl font-bold tracking-tighter uppercase">Synthetix</Link>
          <div className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
            <Link to="/" className="hover:text-foreground [&.active]:text-foreground" activeOptions={{ exact: true }}>Marketplace</Link>
            <Link to="/discover" className="hover:text-foreground [&.active]:text-foreground">Discover</Link>
            {session?.isSeller && (
              <Link to="/seller" className="hover:text-foreground [&.active]:text-foreground">Seller Studio</Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {session?.isSeller && (
            <div className="hidden sm:flex bg-black/5 p-1 rounded-full">
              <Link to="/" className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors ${!isSellerRoute ? "bg-white shadow-sm" : "text-muted-foreground"}`}>Buyer</Link>
              <Link to="/seller" className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors ${isSellerRoute ? "bg-white shadow-sm" : "text-muted-foreground"}`}>Seller</Link>
            </div>
          )}
          <Link to="/cart" className="relative p-2 rounded-full hover:bg-black/5 transition-colors">
            <ShoppingBag className="size-5" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-accent text-accent-foreground text-[10px] font-bold rounded-full size-4 flex items-center justify-center">{count}</span>
            )}
          </Link>
          {session ? (
            <Link to="/seller" className="size-9 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-[11px] font-bold" title={session.email}>
              {initials}
            </Link>
          ) : (
            <Link to="/auth" className="text-sm font-bold px-4 py-2 rounded-full bg-foreground text-background hover:bg-accent transition-colors">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
