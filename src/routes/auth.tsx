import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Nav } from "@/components/marketplace/Nav";
import { Footer } from "@/components/marketplace/Footer";
import { Mail, ArrowLeft, ShieldCheck, AlertCircle, Sparkles } from "lucide-react";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup", "reset"]).optional(),
  role: z.enum(["buyer", "seller"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({ meta: [{ title: "Sign in — Synthetix" }] }),
  component: AuthPage,
});

type AuthView =
  | "signin"
  | "signup"
  | "reset_request"
  | "reset_sent"
  | "confirm_email";

export function AuthPage() {
  const search = Route.useSearch();
  const [view, setView] = useState<AuthView>(search.mode === "signin" ? "signin" : "signup");
  const [role, setRole] = useState<"buyer" | "seller">(search.role ?? "buyer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  // Inline Field Errors
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [googleNotice, setGoogleNotice] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/discover" });
    });
  }, [navigate]);

  function clearErrors() {
    setEmailError(null);
    setPasswordError(null);
    setFormError(null);
    setGoogleNotice(false);
  }

  // ── Sign up ──────────────────────────────────────────────
  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    clearErrors();

    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            display_name: displayName || email.split("@")[0],
            is_seller: role === "seller",
          },
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already in use")) {
          setEmailError("This email is already in use. Please sign in instead.");
        } else if (error.message.toLowerCase().includes("password")) {
          setPasswordError(error.message);
        } else {
          setFormError(error.message);
        }
        return;
      }

      // Upsert profile row into profiles table
      if (data.user) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          display_name: displayName || email.split("@")[0],
        });
      }

      if (data.session) {
        toast.success("Account created! Welcome to Synthetix.");
        navigate({ to: role === "seller" ? "/seller" : "/discover" });
      } else {
        setView("confirm_email");
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  // ── Sign in ──────────────────────────────────────────────
  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    clearErrors();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setFormError("Incorrect email or password. Please try again.");
        return;
      }
      toast.success("Welcome back!");
      navigate({ to: "/discover" });
    } catch (err) {
      setFormError("Incorrect email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Password reset request ───────────────────────────────
  async function handleResetRequest(e: React.FormEvent) {
    e.preventDefault();
    clearErrors();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });
      if (error) {
        setEmailError(error.message);
        return;
      }
      setView("reset_sent");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Reset request failed");
    } finally {
      setLoading(false);
    }
  }

  // ── Google OAuth ─────────────────────────────────────────
  async function handleGoogle() {
    clearErrors();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/discover` },
      });
      if (error) {
        setGoogleNotice(true);
      }
    } catch {
      setGoogleNotice(true);
    } finally {
      setLoading(false);
    }
  }

  // ── Resend confirmation ──────────────────────────────────
  async function resendConfirmation() {
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) toast.error(error.message);
    else toast.success("Confirmation email resent!");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <Nav />
      <section className="max-w-md mx-auto pt-12 pb-24 px-6 w-full">

        {/* ── Confirm email state ── */}
        {view === "confirm_email" && (
          <div className="text-center animate-fade-in space-y-4">
            <div className="size-16 bg-accent/10 border border-accent/30 rounded-full flex items-center justify-center mx-auto mb-2 text-accent">
              <Mail className="size-8" />
            </div>
            <h1 className="text-3xl font-bold">Check your inbox</h1>
            <p className="text-muted-foreground text-sm">
              We sent a confirmation link to{" "}
              <span className="font-bold text-foreground">{email}</span>.
            </p>
            <p className="text-xs text-muted-foreground">
              Click the link in the email to activate your account and access Synthetix.
            </p>
            <div className="space-y-3 pt-4">
              <button
                onClick={resendConfirmation}
                className="w-full py-3 border border-border rounded-full text-xs font-bold hover:bg-secondary transition-colors"
              >
                Resend confirmation email
              </button>
              <button
                onClick={() => setView("signin")}
                className="w-full py-3 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="size-4" /> Back to sign in
              </button>
            </div>
          </div>
        )}

        {/* ── Reset sent state ── */}
        {view === "reset_sent" && (
          <div className="text-center animate-fade-in space-y-4">
            <div className="size-16 bg-accent/10 border border-accent/30 rounded-full flex items-center justify-center mx-auto mb-2 text-accent">
              <Mail className="size-8" />
            </div>
            <h1 className="text-3xl font-bold">Reset link sent</h1>
            <p className="text-muted-foreground text-sm">
              Check <span className="font-bold text-foreground">{email}</span> for instructions to reset your password.
            </p>
            <button
              onClick={() => setView("signin")}
              className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors pt-4"
            >
              <ArrowLeft className="size-4" /> Back to sign in
            </button>
          </div>
        )}

        {/* ── Password reset request ── */}
        {view === "reset_request" && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center">
              <span className="font-mono text-[10px] uppercase tracking-widest text-accent">
                Password recovery
              </span>
              <h1 className="text-3xl font-bold mt-2">Forgot your password?</h1>
              <p className="text-muted-foreground mt-2 text-xs">
                Enter your email address and we'll send you a password reset link.
              </p>
            </div>
            <div className="bg-surface-elevated ring-1 ring-black/5 rounded-3xl p-8 shadow-xl">
              <form onSubmit={handleResetRequest} className="space-y-4">
                <div>
                  <label className="text-xs uppercase font-mono tracking-widest text-muted-foreground block mb-1.5">
                    Email address
                  </label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError(null);
                    }}
                    placeholder="your@email.com"
                    className={`w-full px-4 py-2.5 border rounded-xl bg-background outline-none text-sm focus:border-accent transition-colors ${
                      emailError ? "border-rose-500" : "border-border"
                    }`}
                  />
                  {emailError && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-mono">
                      <AlertCircle className="size-3 shrink-0" /> {emailError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-foreground text-background rounded-full font-bold text-sm hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
                >
                  {loading ? "Sending link…" : "Send reset link"}
                </button>
              </form>
              <button
                onClick={() => setView("signin")}
                className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="size-4" /> Back to sign in
              </button>
            </div>
          </div>
        )}

        {/* ── Sign In / Sign Up Form ── */}
        {(view === "signin" || view === "signup") && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center">
              <span className="font-mono text-[10px] uppercase tracking-widest text-accent">
                {view === "signin" ? "Welcome Back" : "Join Synthetix"}
              </span>
              <h1 className="text-4xl font-bold mt-2 leading-tight">
                {view === "signin"
                  ? "Sign in to shop or sell"
                  : <>Start <span className="font-display italic text-accent">discovering</span> with AI.</>}
              </h1>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-1 p-1 bg-secondary rounded-full">
              <button
                onClick={() => {
                  setView("signin");
                  clearErrors();
                }}
                className={`flex-1 py-2 rounded-full text-xs font-bold transition-colors ${
                  view === "signin" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Sign in
              </button>
              <button
                onClick={() => {
                  setView("signup");
                  clearErrors();
                }}
                className={`flex-1 py-2 rounded-full text-xs font-bold transition-colors ${
                  view === "signup" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Create account
              </button>
            </div>

            <div className="bg-surface-elevated ring-1 ring-black/5 rounded-3xl p-8 shadow-xl space-y-5">

              {/* Form Global Error Banner */}
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-600 flex items-center gap-2 font-medium animate-fade-in">
                  <AlertCircle className="size-4 shrink-0 text-rose-500" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Google OAuth Coming Soon Notice */}
              {googleNotice && (
                <div className="p-3 bg-accent/10 border border-accent/30 rounded-xl text-xs text-accent flex items-center gap-2 font-medium animate-fade-in">
                  <Sparkles className="size-4 shrink-0 text-accent" />
                  <span>Google OAuth coming soon! Please sign in using your Email & Password below.</span>
                </div>
              )}

              {/* Buyer/Seller Role selection (Signup only) */}
              {view === "signup" && (
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">
                    Account Type
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-secondary rounded-full">
                    <button
                      type="button"
                      onClick={() => setRole("buyer")}
                      className={`py-1.5 rounded-full text-xs font-bold transition-colors ${
                        role === "buyer" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                      }`}
                    >
                      Buyer Account
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("seller")}
                      className={`py-1.5 rounded-full text-xs font-bold transition-colors ${
                        role === "seller" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                      }`}
                    >
                      Seller Account
                    </button>
                  </div>
                </div>
              )}

              {/* Google OAuth Button */}
              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-2.5 border border-border rounded-full font-semibold text-xs hover:bg-secondary transition-colors disabled:opacity-50"
              >
                <svg width="16" height="16" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.2 17.7 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.5 24.5c0-1.6-.2-3.1-.4-4.6H24v9.1h12.6c-.6 3-2.3 5.5-4.9 7.2l7.5 5.8c4.4-4 6.9-9.9 6.9-17.5z" />
                  <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.8-4.5l-7.9-6.1C1 17.5 0 20.6 0 24s1 6.5 2.6 9.4l7.9-4.7z" />
                  <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-3.7-13.5-9.7l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
                </svg>
                Continue with Google
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-mono text-muted-foreground">
                  <span className="bg-surface-elevated px-3">or email</span>
                </div>
              </div>

              {/* Authentication Form */}
              <form onSubmit={view === "signup" ? handleSignUp : handleSignIn} className="space-y-4">
                {view === "signup" && (
                  <div>
                    <label className="text-xs uppercase font-mono tracking-widest text-muted-foreground block mb-1.5">
                      Full Name
                    </label>
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="w-full px-4 py-2.5 border border-border rounded-xl bg-background text-sm outline-none focus:border-accent transition-colors"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs uppercase font-mono tracking-widest text-muted-foreground block mb-1.5">
                    Email address
                  </label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError(null);
                    }}
                    placeholder="your@email.com"
                    className={`w-full px-4 py-2.5 border rounded-xl bg-background text-sm outline-none focus:border-accent transition-colors ${
                      emailError ? "border-rose-500" : "border-border"
                    }`}
                  />
                  {emailError && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-mono">
                      <AlertCircle className="size-3 shrink-0" /> {emailError}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs uppercase font-mono tracking-widest text-muted-foreground">
                      Password
                    </label>
                    {view === "signin" && (
                      <button
                        type="button"
                        onClick={() => {
                          setView("reset_request");
                          clearErrors();
                        }}
                        className="text-xs text-muted-foreground hover:text-accent transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <input
                    required
                    type="password"
                    minLength={6}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError(null);
                    }}
                    placeholder="Minimum 6 characters"
                    className={`w-full px-4 py-2.5 border rounded-xl bg-background text-sm outline-none focus:border-accent transition-colors ${
                      passwordError ? "border-rose-500" : "border-border"
                    }`}
                  />
                  {passwordError && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-mono">
                      <AlertCircle className="size-3 shrink-0" /> {passwordError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-foreground text-background rounded-full font-bold text-sm hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
                >
                  {loading ? "Processing…" : view === "signin" ? "Sign in" : "Create account"}
                </button>
              </form>

              {/* Trust Footer */}
              <p className="text-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-2 pt-2">
                <ShieldCheck className="size-3.5 text-emerald-500" />
                Secured by Supabase Auth
              </p>
            </div>
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
}
