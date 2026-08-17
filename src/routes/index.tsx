import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { createServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { Nav } from "@/components/marketplace/Nav";
import { Footer } from "@/components/marketplace/Footer";
import { ProductCard, type ProductCardData } from "@/components/marketplace/ProductCard";
import { LoginGateModal } from "@/components/marketplace/LoginGateModal";
import { VisualLensModal } from "@/components/marketplace/VisualLensModal";
import { NewsletterForm } from "@/components/marketplace/NewsletterForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Shield,
  Zap,
  Star,
  Truck,
  Camera,
  Search,
  Sparkles,
  ArrowRight,
  BrainCircuit,
  MapPin,
  CheckCircle2,
  Scan,
} from "lucide-react";

const NOW_ISO = new Date().toISOString();
const TEN_MINS_AGO = new Date(Date.now() - 10 * 60 * 1000).toISOString();
const TWO_HOURS_AGO = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

const FALLBACK_PRODUCTS: ProductCardData[] = [
  {
    id: "fb-1",
    title: "Zudio Casual Streetwear Sneakers",
    seller_name: "Zudio Official Outlet — Jalandhar",
    price_cents: 149900,
    category: "Footwear",
    ai_summary:
      "Lightweight breathable canvas sneakers with reinforced rubber sole and modern urban fit.",
    material: "Canvas & Recycled Rubber",
    tags: ["Sneakers", "Zudio", "Footwear", "Trending"],
    image_url:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
    status: "in_stock",
    updated_at: TEN_MINS_AGO,
    phone: "+919876543210",
    whatsapp_number: "+919876543210",
  },
  {
    id: "fb-2",
    title: "Handcrafted Heritage Leather Backpack",
    seller_name: "Artisan Leather Co.",
    price_cents: 349900,
    category: "Outdoor Gear",
    ai_summary:
      "Full-grain vegetable-tanned leather backpack built for daily city commute and rugged travel.",
    material: "Full-Grain Leather",
    tags: ["Handmade", "Leather", "Bags"],
    image_url:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80",
    status: "in_stock",
    updated_at: NOW_ISO,
    phone: "+919876543210",
    whatsapp_number: "+919876543210",
  },
  {
    id: "fb-3",
    title: "Organic French Linen Duvet Set",
    seller_name: "Loom & Craft Home",
    price_cents: 499900,
    category: "Home Goods",
    ai_summary:
      "Pre-washed 100% French flax linen bedding for year-round temperature regulation and softness.",
    material: "100% French Flax Linen",
    tags: ["Bedding", "Home Goods", "Linen"],
    image_url:
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&auto=format&fit=crop&q=80",
    status: "low_stock",
    updated_at: TWO_HOURS_AGO,
    phone: "+919876543210",
    whatsapp_number: "+919876543210",
  },
  {
    id: "fb-4",
    title: "Ceramic Artisan Pour-Over Dripper",
    seller_name: "Mati Ceramic Studio",
    price_cents: 129900,
    category: "Home Goods",
    ai_summary:
      "Hand-thrown stoneware coffee dripper with spiral interior ribs for optimal coffee extraction.",
    material: "Stoneware Ceramic",
    tags: ["Ceramic", "Coffee", "Handmade"],
    image_url:
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
    status: "in_stock",
    updated_at: TEN_MINS_AGO,
    phone: "+919876543210",
    whatsapp_number: "+919876543210",
  },
  {
    id: "fb-5",
    title: "Waterproof All-Weather Parka",
    seller_name: "NorthPeak Outfitters",
    price_cents: 599900,
    category: "Outdoor Gear",
    ai_summary:
      "Seam-sealed 3-layer breathable waterproof shell jacket with adjustable hood and thermal lining.",
    material: "3-Layer Gore-Tex Poly",
    tags: ["Jacket", "Outdoor", "Waterproof"],
    image_url:
      "https://images.unsplash.com/photo-1544441893-675973e31985?w=600&auto=format&fit=crop&q=80",
    status: "in_stock",
    updated_at: NOW_ISO,
    phone: "+919876543210",
    whatsapp_number: "+919876543210",
  },
  {
    id: "fb-6",
    title: "Hand-Poured Soy Wax Botanical Candle",
    seller_name: "Aroma Botanical Studio",
    price_cents: 89900,
    category: "Handmade",
    ai_summary:
      "100% natural soy wax candle infused with wild lavender, cedarwood, and essential oils.",
    material: "Soy Wax & Cotton Wick",
    tags: ["Candle", "Handmade", "Home Goods"],
    image_url:
      "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&auto=format&fit=crop&q=80",
    status: "in_stock",
    updated_at: TWO_HOURS_AGO,
    phone: "+919876543210",
    whatsapp_number: "+919876543210",
  },
];

// Server Function to list featured products
const listFeatured = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const url =
      process.env.SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL ||
      "https://laujtdoemlavjjrdmdvv.supabase.co";
    const key =
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      "sb_publishable_lyrll4W7yp-EhCtHG1LheA_PRfa78mU";
    const sb = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    });
    const { data, error } = await sb
      .from("products")
      .select(
        "id, title, seller_name, price_cents, category, ai_summary, material, tags, image_url",
      )
      .order("created_at", { ascending: false })
      .limit(9);
    if (error || !data || data.length === 0) return FALLBACK_PRODUCTS;
    return data;
  } catch (e) {
    console.warn("listFeatured fetch error:", e);
    return FALLBACK_PRODUCTS;
  }
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Synthetix — Find exactly what you actually mean" },
      {
        name: "description",
        content:
          "AI-mediated marketplace with conversational discovery, Google Lens visual search, and local store matching.",
      },
      { property: "og:title", content: "Synthetix — Find exactly what you actually mean" },
      {
        property: "og:description",
        content: "AI-mediated marketplace with conversational discovery and visual search.",
      },
    ],
  }),
  loader: async ({ context }) => {
    try {
      await context.queryClient.prefetchQuery({
        queryKey: ["featured"],
        queryFn: () => listFeatured().catch(() => FALLBACK_PRODUCTS),
      });
    } catch {
      // Loader safety fallback
    }
  },
  component: Home,
});

// Sponsored product titles
const SPONSORED_TITLES = new Set([
  "The Heritage Scout Pack",
  "French Linen Duvet Cover",
  "Ceramic Pour-Over Set",
]);

// Suggestion chips matching design system pills
const SUGGESTION_CHIPS = [
  "Zudio Jalandhar",
  "Nike Running Shoes",
  "Waterproof Hiking Jacket",
  "Artisan Coffee Mug",
  "Pharmacy Health Box",
];

const CATEGORY_PILLS = [
  { name: "Outdoor Gear", q: "outdoor hiking gear" },
  { name: "Home Goods", q: "home goods handmade" },
  { name: "Handmade", q: "handmade artisan" },
];

// Real headshot photos for social proof
const PROOF_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
];

// Partner brand logos (clean SVGs in grayscale) for social proof
const PARTNER_STORES = [
  {
    name: "ZUDIO",
    logo: (
      <svg
        className="h-4 sm:h-5 w-auto fill-current text-muted-foreground/70"
        viewBox="0 0 110 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M0 3h16v3.5L5.5 17.5H16V21H0v-3.5L10.5 6.5H0V3z" />
        <text
          x="22"
          y="18"
          fontFamily="system-ui, sans-serif"
          fontWeight="900"
          fontSize="17"
          letterSpacing="2.5"
        >
          ZUDIO
        </text>
      </svg>
    ),
  },
  {
    name: "NIKE",
    logo: (
      <svg
        className="h-4 sm:h-5 w-auto fill-current text-muted-foreground/70"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M21.71 7.03c-2.31 2.54-6.22 5.64-11.4 8.7-2.92 1.72-5.91 3.23-8.31 3.23-1.34 0-2-.41-2-.9 0-.91 1.02-2.12 2.82-3.41 3.73-2.69 9.77-5.92 15.58-7.8 1.63-.53 2.77-.73 3.32-.73.49 0 .42.4.01.91z" />
      </svg>
    ),
  },
  {
    name: "RELIANCE SMART",
    logo: (
      <svg
        className="h-4 sm:h-5 w-auto fill-current text-muted-foreground/70"
        viewBox="0 0 145 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <polygon points="10,2 18,12 10,22 2,12" />
        <text
          x="23"
          y="14"
          fontFamily="system-ui, sans-serif"
          fontWeight="800"
          fontSize="12"
          letterSpacing="1"
        >
          RELIANCE
        </text>
        <text
          x="23"
          y="22"
          fontFamily="system-ui, sans-serif"
          fontWeight="900"
          fontSize="8"
          letterSpacing="3"
          opacity="0.8"
        >
          SMART
        </text>
      </svg>
    ),
  },
  {
    name: "CROMA",
    logo: (
      <svg
        className="h-4 sm:h-5 w-auto fill-current text-muted-foreground/70"
        viewBox="0 0 100 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="9" cy="12" r="7" stroke="currentColor" strokeWidth="2.5" fill="none" />
        <circle cx="9" cy="12" r="2.5" />
        <text
          x="22"
          y="18"
          fontFamily="system-ui, sans-serif"
          fontWeight="800"
          fontSize="16"
          letterSpacing="2"
        >
          croma
        </text>
      </svg>
    ),
  },
  {
    name: "D-MART",
    logo: (
      <svg
        className="h-4 sm:h-5 w-auto fill-current text-muted-foreground/70"
        viewBox="0 0 95 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M2 3h8c4.5 0 8 3.5 8 9s-3.5 9-8 9H2V3zm4 4v10h4c2.5 0 4.5-2 4.5-5S12.5 7 10 7H6z" />
        <path
          d="M19 8l3 3 5-7"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        <text
          x="28"
          y="18"
          fontFamily="system-ui, sans-serif"
          fontWeight="800"
          fontSize="15"
          letterSpacing="1.5"
        >
          Mart
        </text>
      </svg>
    ),
  },
];

// How It Works 3-Step Row
const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    title: "Describe or Scan Photo",
    desc: "Type in your own natural words or scan a photo with Visual Lens camera.",
    icon: Scan,
  },
  {
    step: "02",
    title: "AI Reasons Intent",
    desc: "Multi-agent vision & neural ranking models analyze exact product details.",
    icon: BrainCircuit,
  },
  {
    step: "03",
    title: "Get Matched Locally",
    desc: "Discover verified stores & products near you in India sorted by distance.",
    icon: MapPin,
  },
];

const TESTIMONIALS = [
  {
    name: "Sarah K.",
    location: "Model Town, Jalandhar",
    quote:
      "Scanned a picture of Zudio sneakers and found the exact store in 3 seconds. Unbelievable accuracy!",
    rating: 5,
    initials: "SK",
  },
  {
    name: "Marcus T.",
    location: "GT Road, Ludhiana",
    quote: "Listed my ceramics in under 3 minutes. The AI drafted perfect descriptions.",
    rating: 5,
    initials: "MT",
  },
  {
    name: "Priya M.",
    location: "Civil Lines, Amritsar",
    quote: "The review summary and local distance filter saved me so much shopping time.",
    rating: 5,
    initials: "PM",
  },
  {
    name: "James W.",
    location: "High Street, Chandigarh",
    quote: "Synthetix finds local stores I didn't know existed. It actually understands intent.",
    rating: 5,
    initials: "JW",
  },
];

const TRUST_ITEMS = [
  { icon: Shield, text: "Secure checkout" },
  { icon: Star, text: "Verified local sellers" },
  { icon: Zap, text: "AI-powered vision search" },
  { icon: Truck, text: "Satisfaction guarantee" },
];

function Home() {
  const [q, setQ] = useState("");
  const [email, setEmail] = useState("");
  const [userSession, setUserSession] = useState<{ id: string; email: string } | null>(null);

  // Modal States
  const [isLoginGateOpen, setIsLoginGateOpen] = useState(false);
  const [isLensModalOpen, setIsLensModalOpen] = useState(false);
  const [pendingQuery, setPendingQuery] = useState<string>("");

  const navigate = useNavigate();
  const { data: featured = FALLBACK_PRODUCTS } = useQuery({
    queryKey: ["featured"],
    queryFn: () => listFeatured().catch(() => FALLBACK_PRODUCTS),
    initialData: FALLBACK_PRODUCTS,
  });

  // Load session state
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUserSession({ id: data.session.user.id, email: data.session.user.email || "" });
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s?.user) {
        setUserSession({ id: s.user.id, email: s.user.email || "" });
      } else {
        setUserSession(null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // Login-Gated Search Handler
  async function handleSearchTrigger(queryToRun?: string) {
    const targetQuery = queryToRun ?? q;
    const v = targetQuery.trim();
    if (v.length < 2) return;

    // Check if user is logged in
    const { data } = await supabase.auth.getSession();
    const currentUser = data.session?.user || userSession;

    if (!currentUser) {
      // User is signed out -> pop open LoginGateModal and save pending query!
      setPendingQuery(v);
      setIsLoginGateOpen(true);
      return;
    }

    // User is signed in -> execute search immediately!
    navigate({ to: "/discover", search: { q: v } });
  }

  // Resume pending query after login succeeds
  function handleLoginSuccess() {
    setUserSession({ id: "demo-id", email: "demo@synthetix.com" });
    const target = pendingQuery || q || "Zudio Jalandhar";
    navigate({ to: "/discover", search: { q: target } });
  }

  // Visual Lens image selected handler
  function handleLensImageSelect(imageDataUrl: string) {
    navigate({ to: "/lens" });
  }

  function handleNewsletter(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    toast.success("You're on the list! We'll be in touch.");
    setEmail("");
  }

  const sponsored = (featured || []).filter((p) => SPONSORED_TITLES.has(p.title));
  const regular = (featured && featured.length > 0 ? featured : FALLBACK_PRODUCTS).filter(
    (p) => !SPONSORED_TITLES.has(p.title),
  );
  const displayProducts = regular.length > 0 ? regular : FALLBACK_PRODUCTS;

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent/20 font-sans relative overflow-x-hidden">
      {/* Ambient Radial Background Glow Treatment */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-accent/15 via-accent/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      <Nav />

      {/* ── Hero Section ── */}
      <section className="max-w-5xl mx-auto pt-16 pb-10 px-4 sm:px-6 animate-slide-up space-y-5">
        {/* Hero Title Header */}
        <div className="space-y-3 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent/10 text-accent font-mono text-[11px] font-bold rounded-full border border-accent/25 shadow-2xs tracking-wider uppercase">
            <Sparkles className="size-3 animate-pulse text-accent" />
            <span>SYNTHETIX AI 2.0 • MULTI-AGENT VISUAL DISCOVERY</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-balance leading-[1.05]">
            Find exactly what you{" "}
            <span className="font-display italic font-normal text-accent underline decoration-accent/60 decoration-2 underline-offset-6">
              actually
            </span>{" "}
            mean.
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Describe what you want in natural language or scan a photo with Visual Lens. Our AI
            reasons about intent and matches nearby verified stores in India.
          </p>
        </div>

        {/* ── Hero Search Card with Prominent Camera Button ── */}
        <div className="relative group w-full">
          <div className="absolute -inset-1 bg-gradient-to-r from-accent/25 via-accent/10 to-transparent rounded-3xl blur-md opacity-30 group-focus-within:opacity-100 transition duration-500 pointer-events-none" />

          <div className="relative bg-surface-elevated ring-1 ring-black/5 dark:ring-white/10 rounded-2xl sm:rounded-3xl shadow-md shadow-black/5 dark:shadow-black/40 p-4 sm:p-5 space-y-3 border border-border/80 transition-shadow duration-300 group-focus-within:shadow-lg">
            {/* Input Text Area */}
            <div className="relative">
              <textarea
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSearchTrigger();
                  }
                }}
                className="w-full bg-transparent border-none outline-none focus:ring-0 text-base sm:text-lg placeholder:text-muted-foreground/50 resize-none min-h-[60px] sm:min-h-[70px] text-foreground font-medium py-0.5"
                placeholder="I'm looking for Zudio casual sneakers or a waterproof jacket near Jalandhar..."
              />
            </div>

            {/* Bottom Controls Row inside Search Card */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2.5 border-t border-border/50">
              {/* Prominent Camera / Scan Photo Button inside Search Bar */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsLensModalOpen(true)}
                  className="px-3.5 py-2 bg-accent/10 hover:bg-accent/20 text-accent border border-accent/25 rounded-xl font-bold text-xs transition-all flex items-center gap-2 group/cam shadow-2xs cursor-pointer"
                >
                  <Camera className="size-3.5 group-hover/cam:scale-110 transition-transform text-accent" />
                  <span>or scan a photo instead</span>
                </button>

                {/* Category Chips */}
                <div className="hidden md:flex items-center gap-1.5">
                  {CATEGORY_PILLS.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => handleSearchTrigger(c.q)}
                      className="px-2.5 py-1 rounded-full bg-secondary/80 hover:bg-secondary border border-border text-[10px] font-mono text-muted-foreground hover:text-foreground uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Consult AI Button with subtle hover scale (1.02) + arrow translate */}
              <button
                type="button"
                onClick={() => handleSearchTrigger()}
                className="group bg-foreground text-background hover:bg-accent hover:text-accent-foreground px-6 py-2.5 rounded-full font-extrabold text-xs sm:text-sm transition-all duration-200 ease-out hover:scale-[1.02] shrink-0 flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:shadow-accent/20 active:scale-[0.98] cursor-pointer"
              >
                <span>Consult AI</span>
                <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform duration-200 ease-out" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Social Proof & Suggestion Chips Row ── */}
        <div className="space-y-3 pt-1">
          {/* TRY Suggestions matching pill design system */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider mr-1">
              TRY:
            </span>
            {SUGGESTION_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => {
                  setQ(chip);
                  handleSearchTrigger(chip);
                }}
                className="px-3.5 py-1.5 rounded-full bg-surface-elevated hover:bg-accent/15 border border-border hover:border-accent/40 text-xs font-medium text-muted-foreground hover:text-foreground transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Search className="size-3 text-accent" />
                <span>{chip}</span>
              </button>
            ))}
          </div>

          {/* Social Proof Line with Real Avatars & Partner Brand Logo SVGs */}
          <div className="pt-3 border-t border-border/40 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2 overflow-hidden py-0.5">
                {PROOF_AVATARS.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt="Shopper avatar"
                    loading="lazy"
                    decoding="async"
                    className="size-7 sm:size-8 rounded-full object-cover border-2 border-background shadow-2xs ring-1 ring-border/40 shrink-0"
                  />
                ))}
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-foreground text-xs sm:text-sm">
                <CheckCircle2 className="size-4 text-amber-500 fill-amber-500/20 shrink-0" />
                <span>Trusted by 12,000+ local shoppers in India</span>
              </div>
            </div>

            <div className="flex items-center gap-6 sm:gap-8 text-muted-foreground/60 overflow-x-auto py-1 shrink-0">
              {PARTNER_STORES.map((store) => (
                <div
                  key={store.name}
                  className="opacity-70 hover:opacity-100 transition-opacity duration-200 flex items-center"
                  title={store.name}
                >
                  {store.logo}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── "How It Works" 3-Step Row ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-surface-elevated border border-border rounded-3xl p-8 shadow-sm space-y-8">
          <div className="text-center space-y-1">
            <span className="font-mono text-[10px] text-accent uppercase tracking-widest font-bold">
              3-STEP INTELLIGENT DISCOVERY
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              How Synthetix Visual AI Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {HOW_IT_WORKS_STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.step}
                  className="relative p-6 bg-background border border-border rounded-2xl space-y-4 hover:border-accent/40 transition-all shadow-2xs group"
                >
                  <div className="flex items-center justify-between">
                    <div className="size-12 rounded-2xl bg-accent/15 text-accent flex items-center justify-center border border-accent/20 group-hover:scale-105 transition-transform">
                      <Icon className="size-6" />
                    </div>
                    <span className="font-mono text-2xl font-black text-muted-foreground/30">
                      {step.step}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-foreground group-hover:text-accent transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Trust Strip ── */}
      <section className="border-y border-border bg-secondary/30 py-5 overflow-x-auto">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-center gap-8 md:gap-16 min-w-max">
          {TRUST_ITEMS.map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap"
            >
              <Icon className="size-4 text-accent shrink-0" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Category Tiles ── */}
      <section className="max-w-7xl mx-auto px-6 py-20 space-y-8">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="font-mono text-[10px] text-accent uppercase tracking-widest font-bold">
              Browse by category
            </span>
            <h2 className="text-3xl font-extrabold mt-1">Shop the local collection</h2>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {CATEGORIES_DATA.map((cat) => (
            <Link
              key={cat.name}
              to="/discover"
              search={{ q: cat.q }}
              className="group relative aspect-[4/3] rounded-3xl overflow-hidden block border border-border shadow-md"
            >
              <img
                src={cat.image}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-8">
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/70 mb-1">
                  Explore
                </span>
                <h3 className="text-2xl font-bold text-white">{cat.name}</h3>
                <p className="text-sm text-white/80 mt-1">{cat.desc}</p>
                <span className="mt-4 text-xs font-bold uppercase tracking-widest text-white/90 group-hover:text-accent transition-colors flex items-center gap-1">
                  <span>Browse collection</span>
                  <ArrowRight className="size-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Sponsored / Featured Listings ── */}
      {sponsored.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 pb-16 space-y-8">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="font-mono text-[10px] text-amber-500 uppercase tracking-widest font-bold">
                ★ Sponsored
              </span>
              <h2 className="text-3xl font-extrabold mt-1">Featured by top local sellers</h2>
            </div>
            <Link
              to="/pricing"
              className="text-xs text-muted-foreground hover:text-accent underline underline-offset-4 transition-colors font-mono uppercase tracking-widest"
            >
              Get featured →
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {sponsored.map((p) => (
              <ProductCard key={p.id} product={p} featured={true} />
            ))}
          </div>
        </section>
      )}

      {/* ── Curated from Makers ── */}
      <section className="max-w-7xl mx-auto px-6 pb-20 space-y-8">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="font-mono text-[10px] text-accent uppercase tracking-widest font-bold">
              Curated this week
            </span>
            <h2 className="text-3xl font-extrabold mt-1">From verified stores & makers</h2>
          </div>
          <Link
            to="/discover"
            className="text-xs text-muted-foreground hover:text-accent underline underline-offset-4 transition-colors font-mono uppercase tracking-widest"
          >
            View all →
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayProducts.slice(0, 6).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="max-w-7xl mx-auto px-6 py-20 space-y-12">
        <div className="text-center space-y-2">
          <span className="font-mono text-[10px] text-accent uppercase tracking-widest font-bold">
            Social proof
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold">What buyers & sellers say</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={t.name}
              className="p-6 bg-surface-elevated border border-border rounded-3xl space-y-4 shadow-sm"
            >
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="size-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs leading-relaxed text-foreground/90 italic">"{t.quote}"</p>
              <div className="flex items-center gap-3 pt-3 border-t border-border/50">
                <div className="size-8 rounded-full bg-accent/20 text-accent font-bold text-[10px] flex items-center justify-center border border-accent/30">
                  {t.initials}
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Newsletter Signup ── */}
      <section className="border-t border-border bg-secondary/40 py-20 px-6">
        <div className="max-w-xl mx-auto text-center space-y-4">
          <span className="font-mono text-[10px] text-accent uppercase tracking-widest font-bold">
            Stay in the loop
          </span>
          <h2 className="text-3xl font-extrabold">New stores & products every week</h2>
          <p className="text-muted-foreground text-xs leading-relaxed">
            We curate the best new products from local stores in India — with AI summaries of why
            they're worth your attention.
          </p>
          <div className="pt-2">
            <NewsletterForm sourcePage="/" />
          </div>
        </div>
      </section>

      <Footer />

      {/* ── Login Gate Modal (Pops open if unauthenticated user clicks Consult AI) ── */}
      <LoginGateModal
        isOpen={isLoginGateOpen}
        onClose={() => setIsLoginGateOpen(false)}
        onSuccess={handleLoginSuccess}
        pendingQuery={pendingQuery}
      />

      {/* ── Visual Lens Upload Modal (Pops open when prominent camera button clicked) ── */}
      <VisualLensModal
        isOpen={isLensModalOpen}
        onClose={() => setIsLensModalOpen(false)}
        onSelectImage={handleLensImageSelect}
      />
    </div>
  );
}

// Category Tile Data with high-res photos
const CATEGORIES_DATA = [
  {
    name: "Outdoor Gear",
    desc: "Backpacks, jackets, cook kits, and more for every trail.",
    image:
      "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&auto=format&fit=crop&q=80",
    q: "outdoor hiking gear",
  },
  {
    name: "Home Goods",
    desc: "Ceramics, linens, and woodwork for a considered home.",
    image:
      "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=800&auto=format&fit=crop&q=80",
    q: "home goods handmade",
  },
  {
    name: "Handmade",
    desc: "Candles, stationery, and one-of-a-kind pieces from makers.",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80",
    q: "handmade artisan",
  },
];
