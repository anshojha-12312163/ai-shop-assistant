import React, { useState } from "react";
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  Send,
  Mail,
  User,
  HelpCircle,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { submitContactMessage } from "@/lib/email-system";
import { toast } from "sonner";

export function SupportContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    website_hp: "", // Honeypot spam trap
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const executeContact = useServerFn(submitContactMessage);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage(null);
  }

  function validateForm(): string | null {
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      return "Please enter your name (at least 2 characters).";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      return "Please enter a valid email address.";
    }
    if (!formData.subject.trim() || formData.subject.trim().length < 3) {
      return "Please enter a subject (at least 3 characters).";
    }
    if (!formData.message.trim() || formData.message.trim().length < 10) {
      return "Please enter your message (at least 10 characters).";
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const res = await executeContact({
        data: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
          website_hp: formData.website_hp,
        },
      });

      if (res.success) {
        setIsSuccess(true);
        toast.success("Support ticket created! Check your email for auto-reply.");
      } else {
        setErrorMessage(res.error || "Could not send message. Please try again.");
      }
    } catch (err: any) {
      console.error("Contact form error:", err);
      setErrorMessage("Something went wrong, please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="p-8 bg-surface-elevated border border-accent/30 rounded-3xl text-center space-y-4 shadow-xl animate-scale-in">
        <div className="size-14 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="size-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-extrabold text-foreground tracking-tight">Message Sent!</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            We got your message and will respond within 24–48 hours. An auto-reply confirmation has
            been sent to <strong className="text-foreground">{formData.email}</strong>.
          </p>
        </div>

        <button
          onClick={() => {
            setIsSuccess(false);
            setFormData({ name: "", email: "", subject: "", message: "", website_hp: "" });
          }}
          className="px-5 py-2.5 bg-secondary text-foreground hover:bg-accent hover:text-accent-foreground rounded-2xl text-xs font-bold transition-all"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-sans">
      {/* Honeypot Anti-Spam Field (Hidden from human users) */}
      <div className="hidden" aria-hidden="true">
        <input
          type="text"
          name="website_hp"
          tabIndex={-1}
          value={formData.website_hp}
          onChange={handleChange}
          autoComplete="off"
        />
      </div>

      {/* Inline Error Notice */}
      {errorMessage && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center gap-2 text-xs text-destructive font-semibold font-mono animate-fade-in">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5 font-mono">
            <User className="size-3.5 text-accent" />
            <span>YOUR NAME</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            disabled={isLoading}
            className="w-full px-4 py-3 rounded-2xl bg-surface-elevated border border-border text-xs outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5 font-mono">
            <Mail className="size-3.5 text-accent" />
            <span>YOUR EMAIL</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="john@example.com"
            disabled={isLoading}
            className="w-full px-4 py-3 rounded-2xl bg-surface-elevated border border-border text-xs outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
          />
        </div>
      </div>

      {/* Subject */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-foreground flex items-center gap-1.5 font-mono">
          <HelpCircle className="size-3.5 text-accent" />
          <span>SUBJECT</span>
        </label>
        <input
          type="text"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          placeholder="How can we help you?"
          disabled={isLoading}
          className="w-full px-4 py-3 rounded-2xl bg-surface-elevated border border-border text-xs outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
        />
      </div>

      {/* Message */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-foreground flex items-center gap-1.5 font-mono">
          <MessageSquare className="size-3.5 text-accent" />
          <span>MESSAGE</span>
        </label>
        <textarea
          name="message"
          rows={4}
          value={formData.message}
          onChange={handleChange}
          placeholder="Describe your inquiry or support issue in detail..."
          disabled={isLoading}
          className="w-full px-4 py-3 rounded-2xl bg-surface-elevated border border-border text-xs outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all resize-none"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3.5 px-6 bg-accent text-accent-foreground hover:bg-accent/90 rounded-2xl font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            <span>Sending Message...</span>
          </>
        ) : (
          <>
            <Send className="size-4" />
            <span>Send Support Request</span>
          </>
        )}
      </button>

      <div className="text-center pt-1 space-y-1">
        <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1 font-mono">
          <ShieldCheck className="size-3.5 text-accent" />
          <span>Direct support email: <a href="mailto:anshojha420@gmail.com" className="text-accent hover:underline font-bold">anshojha420@gmail.com</a></span>
        </p>
        <p className="text-[11px] text-muted-foreground font-mono">
          Instagram Support: <a href="https://instagram.com/anshojha420" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-bold">@anshojha420</a>
        </p>
      </div>
    </form>
  );
}
