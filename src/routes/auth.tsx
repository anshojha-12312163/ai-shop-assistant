import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { Nav } from "@/components/marketplace/Nav";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
  role: z.enum(["buyer", "seller"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({ meta: [{ title: "Sign in — Synthetix" }] }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signup");
  const [role, setRole] = useState<"buyer" | "seller">(search.role ?? "buyer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName || email.split("@")[0], is_seller: role === "seller" },
          },
        });
        if (error) throw error;
        toast.success("Account created!");
        navigate({ to: role === "seller" ? "/seller" : "/" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        navigate({ to: "/" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (result.error) { toast.error(String(result.error)); setLoading(false); return; }
      if (result.redirected) return;
      toast.success("Signed in");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <section className="max-w-md mx-auto pt-16 pb-24 px-6">
        <div className="text-center mb-10">
          <span className="font-mono text-[10px] uppercase tracking-widest text-accent">
            {mode === "signin" ? "Welcome back" : "Join Synthetix"}
          </span>
          <h1 className="text-4xl font-bold mt-3 leading-tight">
            {mode === "signin" ? "Sign in to shop or sell." : (
              <>Start <span className="font-display italic text-accent">conversing</span> with the market.</>
            )}
          </h1>
        </div>

        <div className="bg-surface-elevated ring-1 ring-black/5 rounded-2xl p-8 shadow-xl">
          {mode === "signup" && (
            <div className="mb-6">
              <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-3">I want to</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-secondary rounded-full">
                <button type="button" onClick={() => setRole("buyer")}
                  className={`py-2 rounded-full text-sm font-bold transition-colors ${role === "buyer" ? "bg-white shadow-sm" : "text-muted-foreground"}`}>
                  Buy
                </button>
                <button type="button" onClick={() => setRole("seller")}
                  className={`py-2 rounded-full text-sm font-bold transition-colors ${role === "seller" ? "bg-white shadow-sm" : "text-muted-foreground"}`}>
                  Sell
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 border border-border rounded-full font-medium text-sm hover:bg-secondary transition-colors mb-6 disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.2 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.2-3.1-.4-4.6H24v9.1h12.6c-.6 3-2.3 5.5-4.9 7.2l7.5 5.8c4.4-4 6.9-9.9 6.9-17.5z"/><path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.8-4.5l-7.9-6.1C1 17.5 0 20.6 0 24s1 6.5 2.6 9.4l7.9-4.7z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-3.7-13.5-9.7l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>
            Continue with Google
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-mono text-muted-foreground">
              <span className="bg-surface-elevated px-3">or</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-xs uppercase font-mono tracking-widest text-muted-foreground block mb-1.5">Display name</label>
                <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-background outline-none focus:border-accent transition-colors" />
              </div>
            )}
            <div>
              <label className="text-xs uppercase font-mono tracking-widest text-muted-foreground block mb-1.5">Email</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background outline-none focus:border-accent transition-colors" />
            </div>
            <div>
              <label className="text-xs uppercase font-mono tracking-widest text-muted-foreground block mb-1.5">Password</label>
              <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background outline-none focus:border-accent transition-colors" />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-foreground text-background rounded-full font-bold hover:bg-accent transition-colors disabled:opacity-50"
            >
              {loading ? "…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {mode === "signin" ? (
              <>New here? <button onClick={() => setMode("signup")} className="text-foreground font-bold hover:text-accent">Create an account</button></>
            ) : (
              <>Have an account? <button onClick={() => setMode("signin")} className="text-foreground font-bold hover:text-accent">Sign in</button></>
            )}
          </p>
        </div>
      </section>
    </div>
  );
}
