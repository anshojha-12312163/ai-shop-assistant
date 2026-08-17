import React, { useState } from "react";
import { CheckCircle2, Loader2, AlertCircle, Sparkles, Mail } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { subscribeNewsletter } from "@/lib/email-system";
import { toast } from "sonner";

interface NewsletterFormProps {
  sourcePage?: string;
  className?: string;
}

export function NewsletterForm({ sourcePage = "/", className = "" }: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const executeSubscribe = useServerFn(subscribeNewsletter);

  // Client-Side Email Validation Regex
  function validateEmail(val: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(val.trim());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();

    // 1. Client-side Validation (Don't hit backend with bad data)
    if (!trimmedEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);

    try {
      // 2. Call Backend Subscription Endpoint
      const res = await executeSubscribe({
        data: {
          email: trimmedEmail,
          sourcePage,
        },
      });

      if (res.success) {
        setIsSuccess(true);
        toast.success("You're on the list! Welcome to SYNTHETIX.");
      } else {
        setErrorMessage(res.error || "Subscription failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Newsletter submission error:", err);
      setErrorMessage("Something went wrong, please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // 3. Success State Render (Replaces input+button with confirmation message)
  if (isSuccess) {
    return (
      <div
        className={`p-6 bg-accent/15 border border-accent/30 rounded-3xl text-center space-y-2 animate-scale-in ${className}`}
      >
        <div className="size-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="size-6" />
        </div>
        <h4 className="text-base font-extrabold text-foreground tracking-tight">
          You're on the list!
        </h4>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
          We sent a confirmation email to <strong className="text-foreground">{email}</strong>.
          Check your inbox to confirm!
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto relative"
      >
        <div className="relative flex-1">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder="your@email.com"
            disabled={isLoading}
            className={`w-full pl-11 pr-5 py-3 rounded-full bg-surface-elevated border text-xs outline-none transition-all ${
              errorMessage
                ? "border-destructive ring-2 ring-destructive/20"
                : "border-border focus:border-accent focus:ring-2 focus:ring-accent/20"
            }`}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="bg-foreground text-background hover:bg-accent hover:text-accent-foreground px-6 py-3 rounded-full font-extrabold text-xs transition-all duration-200 shrink-0 flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin text-accent" />
              <span>Joining...</span>
            </>
          ) : (
            <>
              <span>Join list</span>
              <Sparkles className="size-3.5" />
            </>
          )}
        </button>
      </form>

      {/* Inline Validation Error Message */}
      {errorMessage && (
        <div className="flex items-center justify-center gap-1.5 text-xs text-destructive font-semibold animate-fade-in font-mono">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
