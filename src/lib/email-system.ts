import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// In-Memory Rate Limiter (5 requests/minute per IP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, limit = 5, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}

// Initialize Supabase Client
function getSupabaseClient() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    "https://laujtdoemlavjjrdmdvv.supabase.co";
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    "sb_publishable_lyrll4W7yp-EhCtHG1LheA_PRfa78mU";
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
}

// ── Email Service Helper (Resend / API Integration) ─────────────────
async function sendEmailViaResend(to: string, subject: string, html: string, replyTo?: string) {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "SYNTHETIX <newsletter@synthetix.io>",
          to: [to],
          reply_to: replyTo,
          subject,
          html,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.warn("Resend API warning:", res.status, errorText);
      } else {
        console.log(`✅ Resend email sent to ${to}: "${subject}"`);
      }
    } catch (err) {
      console.error("Resend API fetch error:", err);
    }
  } else {
    // Development console logger if RESEND_API_KEY is not configured
    console.log(`[EMAIL SYSTEM DEMO] Simulated send to ${to}: "${subject}"`);
  }
}

const inMemorySubscribers = new Set<string>();

// ── 1. Newsletter Subscription Logic Handler ────────────────────────
export async function subscribeNewsletterLogic(data: {
  email: string;
  sourcePage?: string;
  clientIp?: string;
}) {
  const ip = data.clientIp || "127.0.0.1";

  // Server-Side Rate Limiting (5 requests/minute per IP)
  if (!checkRateLimit(ip, 5, 60000)) {
    return {
      success: false,
      error: "Too many requests. Please wait a minute before trying again.",
      statusCode: 429,
    };
  }

  const email = data.email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      success: false,
      error: "Please enter a valid email address",
      statusCode: 400,
    };
  }

  // Fast In-Memory & Database Duplicate Check
  if (inMemorySubscribers.has(email)) {
    return {
      success: false,
      error: "This email is already subscribed!",
      statusCode: 400,
    };
  }

  const sb = getSupabaseClient();
  const sourcePage = data.sourcePage || "/";

  try {
    // Check Supabase DB for duplicate subscription
    const { data: existing } = await (sb as any)
      .from("subscribers")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      inMemorySubscribers.add(email);
      return {
        success: false,
        error: "This email is already subscribed!",
        statusCode: 400,
      };
    }

    inMemorySubscribers.add(email);

    const unsubscribeToken = Math.random().toString(36).substring(2) + Date.now().toString(36);

    // Insert record into subscribers table
    const { error: insertErr } = await (sb as any).from("subscribers").insert({
      email,
      subscribed_at: new Date().toISOString(),
      source_page: sourcePage,
      confirmed: true,
      unsubscribe_token: unsubscribeToken,
    });

    if (insertErr) {
      console.warn("Subscribers insert warning:", insertErr.message);
    }

    // Send Welcome / Confirmation Email immediately
    const welcomeHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b;">
        <h2 style="color: #0f172a; border-bottom: 2px solid #0d9488; padding-bottom: 10px;">Welcome to SYNTHETIX ✨</h2>
        <p>Thank you for subscribing to SYNTHETIX! You're now on the list to receive weekly curated products, local store discoveries, and AI shopping insights.</p>
        <p style="margin-top: 20px;">If you ever wish to stop receiving emails, click below:</p>
        <p><a href="https://synthetix.io/unsubscribe?token=${unsubscribeToken}" style="color: #0d9488; font-size: 12px;">Unsubscribe from newsletter</a></p>
      </div>
    `;

    await sendEmailViaResend(email, "Welcome to SYNTHETIX! You're on the list 🎉", welcomeHtml);

    return {
      success: true,
      message: "You're on the list! Check your inbox to confirm.",
      statusCode: 200,
    };
  } catch (err: any) {
    console.error("Newsletter submission error:", err);
    return {
      success: false,
      error: "Something went wrong. Please try again.",
      statusCode: 500,
    };
  }
}

// ── 2. Support Contact Form Logic Handler ───────────────────────────
export async function submitContactMessageLogic(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
  website_hp?: string;
  clientIp?: string;
}) {
  // Spam Protection: Honeypot field must be empty!
  if (data.website_hp && data.website_hp.trim().length > 0) {
    console.warn("Spam bot detected via honeypot field:", data.website_hp);
    return {
      success: true,
      message: "Message sent! We'll be in touch soon.",
      statusCode: 200,
    };
  }

  const ip = data.clientIp || "127.0.0.1";

  // Rate limit: 3 contact submissions per 5 minutes per IP
  if (!checkRateLimit(`contact_${ip}`, 3, 300000)) {
    return {
      success: false,
      error: "Too many messages sent. Please wait a few minutes.",
      statusCode: 429,
    };
  }

  const sb = getSupabaseClient();
  const name = data.name.trim();
  const email = data.email.trim().toLowerCase();
  const subject = data.subject.trim();
  const message = data.message.trim();

  try {
    // Insert record into contact_messages table
    const { error: dbErr } = await (sb as any).from("contact_messages").insert({
      name,
      email,
      subject,
      message,
      submitted_at: new Date().toISOString(),
      status: "new",
    });

    if (dbErr) {
      console.warn("contact_messages insert warning:", dbErr.message);
    }

    // Send formatted notification to support@synthetix.io
    const supportNotificationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #cbd5e1; rounded: 12px;">
        <h3 style="color: #0f172a; margin-top: 0;">New Support Ticket — SYNTHETIX</h3>
        <p><strong>From:</strong> ${name} (&lt;${email}&gt;)</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0;" />
        <p style="white-space: pre-wrap; background: #f8fafc; padding: 15px; border-radius: 8px;">${message}</p>
      </div>
    `;

    await sendEmailViaResend(
      "anshojha420@gmail.com",
      `[Support Request] ${subject}`,
      supportNotificationHtml,
      email,
    );

    // Send Auto-Reply Confirmation to the user
    const autoReplyHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; color: #1e293b;">
        <h3 style="color: #0f172a;">We received your message! ✨</h3>
        <p>Hi ${name},</p>
        <p>Thank you for contacting SYNTHETIX Support. We have received your inquiry regarding <strong>"${subject}"</strong> and our support team will respond within 24–48 hours.</p>
        <p style="color: #64748b; font-size: 13px; margin-top: 20px;">Reference ID: TICKET-${Date.now().toString(36).toUpperCase()}</p>
      </div>
    `;

    await sendEmailViaResend(email, "We got your message! (SYNTHETIX Support)", autoReplyHtml);

    return {
      success: true,
      message: "Message sent! We'll be in touch soon.",
      statusCode: 200,
    };
  } catch (err: any) {
    console.error("Contact submission error:", err);
    return {
      success: false,
      error: "Something went wrong, please try again.",
      statusCode: 500,
    };
  }
}

// TanStack Server Functions
export const subscribeNewsletter = createServerFn({ method: "POST" })
  .validator((i: unknown) =>
    z
      .object({
        email: z.string().email("Please enter a valid email address"),
        sourcePage: z.string().optional(),
        clientIp: z.string().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    return subscribeNewsletterLogic(data);
  });

export const submitContactMessage = createServerFn({ method: "POST" })
  .validator((i: unknown) =>
    z
      .object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Please enter a valid email address"),
        subject: z.string().min(3, "Subject must be at least 3 characters"),
        message: z.string().min(10, "Message must be at least 10 characters"),
        website_hp: z.string().optional(),
        clientIp: z.string().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    return submitContactMessageLogic(data);
  });
