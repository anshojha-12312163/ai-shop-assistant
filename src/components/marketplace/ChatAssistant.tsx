import { useState, useRef, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Camera,
  Image as ImageIcon,
  Send,
  X,
  Sparkles,
  MapPin,
  RefreshCw,
  ShoppingBag,
  AlertCircle,
  RotateCcw,
  Map as MapIcon,
  List as ListIcon,
  SlidersHorizontal,
  Navigation,
  Loader2,
  Info,
  Heart,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LocationSearchBox, LocationState } from "./LocationSearchBox";
import { MarketplaceSearchCard } from "./MarketplaceSearchCard";
import {
  runAgentChain,
  searchNearbyPlaces,
  type AgentStepResult,
  type ImageAnalysisResult,
  type ShopResultItem,
  type StreamAgentEvent,
} from "@/lib/ai.functions";
import { AgentStatusChecklist } from "./AgentStatusChecklist";
import { ShopCard } from "./ShopCard";
import { ShopMap } from "./ShopMap";
import { ShopDetailModal } from "./ShopDetailModal";

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text?: string;
  image?: string; // base64 / data URL
  detectedImage?: ImageAnalysisResult | null;
  agentSteps?: AgentStepResult[];
  shops?: ShopResultItem[];
  timestamp: string;
  isStreamingText?: boolean;
}

const DEFAULT_SUGGESTIONS = [
  { text: "Find nearby sneaker and running shoe stores", icon: "👟" },
  { text: "Where is an open coffee shop with single-origin espresso?", icon: "☕" },
  { text: "Find a local pharmacy stocking wellness supplements", icon: "💊" },
  { text: "Looking for hiking boots & rain jackets nearby", icon: "🥾" },
];

export function ChatAssistant({ initialQuery = "" }: { initialQuery?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState(initialQuery);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [streamFailed, setStreamFailed] = useState(false);
  const [lastPrompt, setLastPrompt] = useState<{ text: string; image: string | null } | null>(null);
  const [activeSteps, setActiveSteps] = useState<AgentStepResult[]>([]);

  // Google Places Live Search & Filter States
  const [userLocation, setUserLocation] = useState<LocationState>({
    lat: 31.3260,
    lng: 75.5762,
    label: "Jalandhar, Punjab",
    isGPS: false,
  });
  const [isGeoDenied, setIsGeoDenied] = useState(false);
  const [radiusMiles, setRadiusMiles] = useState(5);
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [hoveredShopId, setHoveredShopId] = useState<string | null>(null);
  const [detailModalPlaceId, setDetailModalPlaceId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");

  // Live Places Search State
  const [liveShops, setLiveShops] = useState<ShopResultItem[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [userFavorites, setUserFavorites] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const executeChain = useServerFn(runAgentChain);
  const fetchPlaces = useServerFn(searchNearbyPlaces);

  // Helper to log searches to Supabase search_history table
  async function logSearch(query: string, resultCount: number) {
    if (!query || query.trim().length === 0) return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (user) {
        await supabase.from("search_history").insert({
          user_id: user.id,
          query_text: query.trim(),
          location_label: userLocation.label,
          result_count: resultCount,
        });
      }
    } catch (e) {
      console.warn("Could not log search history:", e);
    }
  }

  // Load user favorites on mount
  useEffect(() => {
    async function loadFavorites() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (user) {
        const { data: favs } = await supabase.from("favorites").select("shop_id").eq("user_id", user.id);
        if (favs) {
          setUserFavorites(new Set(favs.map((f) => f.shop_id)));
        }
      }
    }
    loadFavorites();
  }, []);

  // Handle favorite toggle from ShopCard
  async function handleToggleFavorite(shopId: string, currentFav: boolean) {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      toast.error("Please sign in to save favorite shops.");
      return;
    }

    const nextFav = !currentFav;
    setUserFavorites((prev) => {
      const next = new Set(prev);
      if (nextFav) next.add(shopId);
      else next.delete(shopId);
      return next;
    });

    const targetShop = activeShops.find((s) => (s.place_id || s.id) === shopId);

    try {
      if (nextFav && targetShop) {
        const { error } = await supabase.from("favorites").upsert({
          user_id: user.id,
          shop_id: shopId,
          shop_name: targetShop.name,
          shop_image: targetShop.image_url ?? null,
          shop_category: targetShop.category,
          shop_rating: targetShop.rating,
        });
        if (error) throw error;
        toast.success(`Saved "${targetShop.name}" to favorites`);
      } else {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("shop_id", shopId);
        if (error) throw error;
        toast.success(`Removed shop from favorites`);
      }
    } catch (err) {
      setUserFavorites((prev) => {
        const next = new Set(prev);
        if (currentFav) next.add(shopId);
        else next.delete(shopId);
        return next;
      });
      toast.error("Could not update favorites.");
    }
  }

  // Get user geolocation if permitted and reverse-geocode label via Nominatim
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
            headers: { "User-Agent": "SynthetixAIShopAssistant/1.0" },
          })
            .then((r) => r.json())
            .then((data) => {
              const addr = data.address;
              const shortLabel = addr
                ? `${addr.city || addr.town || addr.suburb || addr.neighbourhood || addr.county || "Your Location"}, ${addr.state || addr.country || ""}`
                : "Your Current Location";
              setUserLocation({
                lat,
                lng,
                label: shortLabel,
                isGPS: true,
              });
              setIsGeoDenied(false);
            })
            .catch(() => {
              setUserLocation({
                lat,
                lng,
                label: "Your Current Location",
                isGPS: true,
              });
              setIsGeoDenied(false);
            });
        },
        async (err) => {
          console.warn("Geolocation denied/unavailable:", err);
          setIsGeoDenied(true);
          try {
            const res = await fetch("https://nominatim.openstreetmap.org/search?q=Jalandhar,+Punjab&format=json&limit=1", {
              headers: { "User-Agent": "SynthetixAIShopAssistant/1.0" },
            });
            if (res.ok) {
              const data = await res.json();
              if (data?.[0]) {
                setUserLocation({
                  lat: parseFloat(data[0].lat),
                  lng: parseFloat(data[0].lon),
                  label: "Jalandhar, Punjab",
                  isGPS: false,
                });
              }
            }
          } catch {
            setUserLocation({
              lat: 31.3260,
              lng: 75.5762,
              label: "Jalandhar, Punjab",
              isGPS: false,
            });
          }
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      setIsGeoDenied(true);
    }
  }, []);

  // Fetch live Google Places data on location, radius, or category change
  useEffect(() => {
    let mounted = true;
    setIsSearchingPlaces(true);

    fetchPlaces({
      data: {
        lat: userLocation.lat,
        lng: userLocation.lng,
        radiusMeters: radiusMiles * 1609.34,
        category: categoryFilter,
      },
    })
      .then((res) => {
        if (mounted) {
          setLiveShops(res.shops);
          setIsFallbackMode(res.isFallback);
          setIsSearchingPlaces(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch live Google Places:", err);
        if (mounted) setIsSearchingPlaces(false);
      });

    return () => {
      mounted = false;
    };
  }, [userLocation.lat, userLocation.lng, radiusMiles, categoryFilter]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeSteps, isPending]);

  const [modalInitialTab, setModalInitialTab] = useState<"details" | "route">("details");

  // Client-side image compression helper
  async function compressImageBase64(dataUrl: string, maxWidth = 800, quality = 0.75): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
    });
  }

  // Handle file / photo selection
  async function handleImageFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WEBP)");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image size should be less than 8MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const rawBase64 = e.target?.result as string;
      const compressed = await compressImageBase64(rawBase64);
      setSelectedImage(compressed);
      toast.success("Photo attached & compressed! Ready to scan.");
    };
    reader.readAsDataURL(file);
  }

  // Typewriter effect helper
  function typewriteReply(msgId: string, fullReply: string, onFinish: () => void) {
    let curr = 0;
    const interval = setInterval(() => {
      curr += Math.min(4, fullReply.length - curr);
      const textChunk = fullReply.slice(0, curr);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, text: textChunk, isStreamingText: curr < fullReply.length } : m
        )
      );

      if (curr >= fullReply.length) {
        clearInterval(interval);
        onFinish();
      }
    }, 16);
  }

  async function handleSubmit(overrideText?: string) {
    const textToSend = overrideText ?? inputText.trim();
    if (!textToSend && !selectedImage) {
      toast.error("Please type a message or upload an image to scan.");
      return;
    }

    if (isPending) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: "user",
      text: textToSend,
      image: selectedImage ?? undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    const imageToScan = selectedImage;
    setLastPrompt({ text: textToSend, image: imageToScan });
    setInputText("");
    setSelectedImage(null);
    setIsPending(true);
    setStreamFailed(false);

    const hasImage = !!imageToScan;
    const initialAgentList = [
      ...(hasImage ? ["Image Recognition Agent"] : []),
      "Location Agent",
      "Search Agent",
      "Ranking Agent",
      "Verification Agent",
      "Conversational Agent",
    ];

    const initialSteps: AgentStepResult[] = initialAgentList.map((agent) => ({
      agent,
      status: "pending",
      detail: "",
    }));

    setActiveSteps(initialSteps);

    let streamedSuccessfully = false;

    // Try Real-Time Streaming SSE Edge Function
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://ai-shop-assistant.supabase.co";
      const edgeUrl = `${supabaseUrl}/functions/v1/chat-agent`;

      const response = await fetch(edgeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          image: imageToScan ?? undefined,
          location: userLocation,
          stream: true,
        }),
      });

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const clean = line.replace(/^data:\s*/, "").trim();
            if (!clean) continue;

            try {
              const event: StreamAgentEvent = JSON.parse(clean);

              if (event.type === "agent_start" && event.agent) {
                setActiveSteps((prev) =>
                  prev.map((s) => (s.agent === event.agent ? { ...s, status: "in_progress" } : s))
                );
              } else if (event.type === "agent_done" && event.agent) {
                if (event.agent === "Location Agent" && event.result && typeof event.result === "object") {
                  const resLoc = event.result as { lat?: number; lng?: number; locationLabel?: string };
                  if (resLoc.lat && resLoc.lng && resLoc.locationLabel) {
                    setUserLocation({
                      lat: resLoc.lat,
                      lng: resLoc.lng,
                      label: resLoc.locationLabel,
                      isGPS: false,
                    });
                  }
                }
                setActiveSteps((prev) =>
                  prev.map((s) =>
                    s.agent === event.agent
                      ? { ...s, status: "completed", detail: event.detail ?? s.detail }
                      : s
                  )
                );
              } else if (event.type === "final" && event.reply) {
                streamedSuccessfully = true;
                const assistantMsgId = `assistant-${Date.now()}`;
                const finalReply = event.reply;
                const finalShops = event.shops;
                const finalDetected = event.detectedImage;
                const finalSteps = event.agentSteps ?? activeSteps;

                setMessages((prev) => [
                  ...prev,
                  {
                    id: assistantMsgId,
                    sender: "assistant",
                    text: "",
                    detectedImage: finalDetected,
                    agentSteps: finalSteps,
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    isStreamingText: true,
                  },
                ]);

                setIsPending(false);

                typewriteReply(assistantMsgId, finalReply, () => {
                  logSearch(textToSend, finalShops?.length ?? 0);
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsgId ? { ...m, shops: finalShops, isStreamingText: false } : m
                    )
                  );
                });
              } else if (event.type === "error") {
                throw new Error(event.error ?? "Stream error");
              }
            } catch (pErr) {
              console.warn("SSE parse error:", pErr);
            }
          }
        }
      }
    } catch (streamErr) {
      console.warn("SSE stream fallback:", streamErr);
    }

    // Fallback: TanStack Server Function
    if (!streamedSuccessfully) {
      try {
        let currentStepIdx = 0;
        const fallbackTimer = setInterval(() => {
          setActiveSteps((prev) => {
            const next = [...prev];
            if (currentStepIdx < next.length) {
              next[currentStepIdx] = {
                ...next[currentStepIdx],
                status: "completed",
                detail: next[currentStepIdx].detail || "step completed",
              };
              currentStepIdx++;
              if (currentStepIdx < next.length) {
                next[currentStepIdx] = { ...next[currentStepIdx], status: "in_progress" };
              }
            }
            return next;
          });
        }, 350);

        const res = await executeChain({
          data: {
            message: textToSend,
            image: imageToScan ?? undefined,
            location: userLocation,
          },
        });

        clearInterval(fallbackTimer);

        const assistantMsgId = `assistant-${Date.now()}`;
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMsgId,
            sender: "assistant",
            text: "",
            detectedImage: res.detectedImage,
            agentSteps: res.agentSteps,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isStreamingText: true,
          },
        ]);

        setIsPending(false);

        typewriteReply(assistantMsgId, res.reply, () => {
          logSearch(textToSend, res.shops?.length ?? 0);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, shops: res.shops, isStreamingText: false } : m
            )
          );
        });
      } catch (fallbackErr) {
        setIsPending(false);
        setStreamFailed(true);
        setActiveSteps((prev) =>
          prev.map((s) => (s.status === "in_progress" ? { ...s, status: "failed", detail: "step failed" } : s))
        );
        toast.error("Pipeline interrupted. Click retry to run again.");
        console.error("Agent fallback error:", fallbackErr);
      }
    }
  }

  function handleRetry() {
    if (lastPrompt) {
      setSelectedImage(lastPrompt.image);
      handleSubmit(lastPrompt.text);
    }
  }

  // Determine current active shop dataset (from assistant reply or live Places API search)
  const latestMessageWithShops = [...messages].reverse().find((m) => m.shops && m.shops.length > 0);
  const rawActiveShops = latestMessageWithShops?.shops ?? liveShops;

  const activeShops = showFavoritesOnly
    ? rawActiveShops.filter((s) => userFavorites.has(s.place_id || s.id))
    : rawActiveShops;

  // Handle pin click -> scroll to card
  function handleSelectShopFromMap(shopId: string) {
    setSelectedShopId(shopId);
    const cardEl = document.getElementById(`shop-card-${shopId}`);
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col space-y-4">
      {/* Shop Detail Modal */}
      <ShopDetailModal
        placeId={detailModalPlaceId}
        onClose={() => setDetailModalPlaceId(null)}
        userLocation={userLocation}
        initialTab={modalInitialTab}
      />

      {/* Location Search Bar & Geolocation Controls */}
      <div className="bg-surface-elevated p-3.5 border border-border rounded-2xl shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 max-w-xl">
          <LocationSearchBox
            currentLocation={userLocation}
            onLocationChange={(newLoc) => {
              setUserLocation(newLoc);
              setIsGeoDenied(false);
            }}
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground shrink-0 justify-between md:justify-end">
          <span className="flex items-center gap-1.5 px-3 py-1 bg-secondary rounded-full">
            <span className={`size-2 rounded-full ${userLocation.isGPS ? "bg-accent animate-pulse" : "bg-amber-500"}`} />
            <span>Active: <strong>{userLocation.label}</strong></span>
          </span>
        </div>
      </div>

      {isFallbackMode && (
        <div className="px-4 py-2 bg-secondary border border-border rounded-xl flex items-center justify-between text-[11px] text-muted-foreground font-mono">
          <div className="flex items-center gap-2">
            <Info className="size-3.5 text-accent shrink-0" />
            <span>
              <strong>Google Places API Notice:</strong> Running on curated local dataset (fallback mode). Set <code>GOOGLE_PLACES_API_KEY</code> secret for live API data.
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-accent/15 text-accent font-bold uppercase text-[9px]">
            Curated Fallback
          </span>
        </div>
      )}

      {/* Filter & Radius Controls Bar */}
      <div className="bg-surface-elevated p-4 border border-border rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-mono text-xs text-muted-foreground font-semibold flex items-center gap-1">
            <SlidersHorizontal className="size-3.5 text-accent" />
            Category:
          </span>
          {["All", "Footwear", "Cafe", "Pharmacy", "Outdoor Gear", "Home Goods"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                categoryFilter === cat
                  ? "bg-foreground text-background shadow"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}

          {/* Favorites Only Toggle */}
          {userFavorites.size > 0 && (
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                showFavoritesOnly
                  ? "bg-rose-500 text-white shadow-md"
                  : "bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border border-rose-500/30"
              }`}
            >
              <Heart className={`size-3.5 ${showFavoritesOnly ? "fill-white" : "fill-rose-500 text-rose-500"}`} />
              <span>Favorites ({userFavorites.size})</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted-foreground font-semibold">
            Radius: <strong className="text-foreground">{radiusMiles} miles</strong>
          </span>
          <input
            type="range"
            min={1}
            max={25}
            value={radiusMiles}
            onChange={(e) => setRadiusMiles(Number(e.target.value))}
            className="accent-accent w-24 cursor-pointer"
          />

          {/* Mobile View Toggle */}
          <div className="md:hidden flex bg-secondary p-1 rounded-full border border-border">
            <button
              onClick={() => setMobileView("list")}
              className={`px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1 transition-colors ${
                mobileView === "list" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <ListIcon className="size-3.5" />
              List
            </button>
            <button
              onClick={() => setMobileView("map")}
              className={`px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1 transition-colors ${
                mobileView === "map" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <MapIcon className="size-3.5" />
              Map ({activeShops.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[640px]">
        {/* Left Column — Multi-Agent Assistant & Scrollable Results */}
        <div
          className={`md:col-span-7 flex flex-col min-h-[600px] bg-background border border-border rounded-3xl shadow-xl overflow-hidden ${
            mobileView === "map" ? "hidden md:flex" : "flex"
          }`}
        >
          {/* ── Chat Header ── */}
          <div className="bg-surface-elevated px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center text-accent shadow-inner">
                <Sparkles className="size-5" />
              </div>
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  Synthetix AI Assistant
                  <span className="text-[10px] font-mono font-normal uppercase tracking-widest px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/20">
                    Live Places SSE
                  </span>
                </h2>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <MapPin className="size-3 text-accent" />
                  <span>{userLocation.label}</span>
                </p>
              </div>
            </div>

            {messages.length > 0 && (
              <button
                onClick={() => {
                  setMessages([]);
                  setStreamFailed(false);
                }}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-secondary transition-colors"
              >
                <RefreshCw className="size-3.5" />
                Clear chat
              </button>
            )}
          </div>

          {/* ── Chat Messages Body ── */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-secondary/10 min-h-[440px]">
            {/* Welcome Empty State */}
            {messages.length === 0 && (
              <div className="max-w-xl mx-auto py-10 text-center space-y-6 animate-fade-in">
                <div className="size-16 mx-auto rounded-3xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
                  <ShoppingBag className="size-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold tracking-tight">
                    Scan photos or search live nearby shops
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    Take a photo of a shoe, medicine box, cafe interior, or item. Watch our 6-agent chain search real live Google Places data near your location!
                  </p>
                </div>

                {/* Quick Suggestions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
                  {DEFAULT_SUGGESTIONS.map((s) => (
                    <button
                      key={s.text}
                      onClick={() => handleSubmit(s.text)}
                      className="p-4 bg-surface-elevated border border-border hover:border-accent rounded-2xl text-xs font-medium transition-all hover:shadow-md flex items-center gap-3 text-foreground/90 group"
                    >
                      <span className="text-xl group-hover:scale-110 transition-transform">{s.icon}</span>
                      <span className="flex-1">{s.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message Bubbles */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"} animate-slide-up`}
              >
                <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground mb-1 px-1">
                  <span>{msg.sender === "user" ? "You" : "Synthetix AI Assistant"}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div
                  className={`max-w-xl rounded-3xl p-5 shadow-sm space-y-3 ${
                    msg.sender === "user"
                      ? "bg-foreground text-background rounded-tr-none"
                      : "bg-surface-elevated text-foreground border border-border rounded-tl-none"
                  }`}
                >
                  {/* User Attached Image Thumbnail */}
                  {msg.image && (
                    <div className="relative max-w-xs rounded-2xl overflow-hidden border border-white/20 shadow-md">
                      <img src={msg.image} alt="Uploaded scan" className="w-full h-auto object-cover max-h-60" />
                      <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md text-white text-[10px] font-mono px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Camera className="size-3 text-accent" />
                        Photo Scanned
                      </div>
                    </div>
                  )}

                  {/* Message Text with Typewriter Cursor */}
                  {msg.text !== undefined && (
                    <p className="text-sm md:text-base leading-relaxed whitespace-pre-line font-sans">
                      {msg.text}
                      {msg.isStreamingText && (
                        <span className="inline-block w-1.5 h-4 bg-accent ml-1 animate-pulse" />
                      )}
                    </p>
                  )}

                  {/* Recognized Tag & Photo Summary Card */}
                  {msg.detectedImage && (
                    <div className="p-3.5 bg-accent/10 border border-accent/30 rounded-2xl space-y-2 text-xs">
                      <div className="flex items-center gap-2 font-mono text-accent font-bold">
                        <Sparkles className="size-3.5" />
                        <span>Here's what I found in your photo:</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {msg.image && (
                          <img src={msg.image} alt="Scanned item" className="size-12 rounded-xl object-cover border border-accent/30 shrink-0" />
                        )}
                        <div>
                          <p className="font-bold text-foreground text-sm">{msg.detectedImage.detectedLabel}</p>
                          <p className="text-muted-foreground font-mono text-[11px]">
                            Category: <strong>{msg.detectedImage.category}</strong> • Confidence: <strong>{Math.round((msg.detectedImage.confidence || 0.92) * 100)}%</strong>
                          </p>
                          <p className="text-[11px] text-muted-foreground italic mt-0.5">
                            "{msg.detectedImage.description || `I think this is a ${msg.detectedImage.detectedLabel} — here are top nearby shops.`}"
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Agent Status Checklist */}
                  {msg.agentSteps && msg.agentSteps.length > 0 && (
                    <AgentStatusChecklist steps={msg.agentSteps} isScanningImage={!!msg.detectedImage} />
                  )}
                </div>

                {/* Render Nearby Shop Shortlist with Map Sync */}
                {msg.shops && msg.shops.length > 0 && (
                  <div className="w-full max-w-xl mt-4 space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-muted-foreground px-1">
                      <span>Nearby Shop Results ({msg.shops.length})</span>
                      {isFallbackMode ? (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-[10px]">
                          DEMO CATALOG DATA (FALLBACK)
                        </span>
                      ) : (
                        <span className="text-accent font-semibold px-2 py-0.5 rounded bg-accent/10 border border-accent/30 text-[10px]">
                          OPENSTREETMAP / PLACES DATA
                        </span>
                      )}
                    </div>

                    {/* Quick Inline Direction Follow-Up Prompt */}
                    <div className="p-3 bg-secondary/80 border border-border rounded-2xl flex items-center justify-between gap-3 text-xs shadow-sm">
                      <span className="text-muted-foreground font-mono">
                        Want live map directions to <strong>{msg.shops[0].name}</strong>?
                      </span>
                      <button
                        onClick={() => {
                          setDetailModalPlaceId(msg.shops[0].place_id || msg.shops[0].id);
                          setModalInitialTab("route");
                        }}
                        className="px-3 py-1.5 bg-accent text-accent-foreground hover:bg-accent/90 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
                      >
                        <Navigation className="size-3.5" />
                        Show Route Line
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {msg.shops.map((shop) => (
                        <ShopCard
                          key={shop.id}
                          shop={shop}
                          isSelected={selectedShopId === shop.id}
                          isHovered={hoveredShopId === shop.id}
                          isFavorite={userFavorites.has(shop.place_id || shop.id)}
                          onHover={(id) => setHoveredShopId(id)}
                          onSelect={(id) => setSelectedShopId(id)}
                          onViewDetails={(placeId) => {
                            setDetailModalPlaceId(placeId);
                            setModalInitialTab("details");
                          }}
                          onToggleFavorite={handleToggleFavorite}
                        />
                      ))}
                    </div>

                    {/* Online Marketplace Options Agent Section */}
                    <MarketplaceSearchCard
                      query={lastPrompt?.text || categoryFilter || "products"}
                      category={categoryFilter}
                    />
                  </div>
                )}
              </div>
            ))}

            {/* Live Search Loading Skeletons */}
            {isSearchingPlaces && messages.length === 0 && (
              <div className="space-y-4 max-w-xl mx-auto py-6">
                <div className="flex items-center gap-2 text-xs text-accent font-mono">
                  <Loader2 className="size-4 animate-spin" />
                  <span>Searching Google Places Nearby...</span>
                </div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-surface-elevated border border-border rounded-2xl p-5 space-y-3 animate-pulse">
                    <div className="h-36 bg-secondary/80 rounded-xl" />
                    <div className="h-5 bg-secondary/80 rounded w-1/2" />
                    <div className="h-4 bg-secondary/60 rounded w-3/4" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty Places Search Results */}
            {!isSearchingPlaces && activeShops.length === 0 && messages.length === 0 && (
              <div className="p-8 border border-dashed border-border rounded-2xl text-center space-y-2 text-muted-foreground">
                <p className="font-bold text-foreground">No shops found nearby</p>
                <p className="text-xs">
                  {showFavoritesOnly
                    ? "No favorited shops match your current category/radius filter."
                    : "Try choosing a wider radius or selecting \"All\" categories above."}
                </p>
              </div>
            )}

            {/* Default Live Places List when no assistant conversation has started yet */}
            {messages.length === 0 && !isSearchingPlaces && activeShops.length > 0 && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-muted-foreground px-1">
                  <span>{showFavoritesOnly ? "Saved Favorite Shops" : "Nearby Merchants"} ({activeShops.length})</span>
                  <span className="text-accent font-semibold">Live Google Places</span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {activeShops.map((shop) => (
                    <ShopCard
                      key={shop.id}
                      shop={shop}
                      isSelected={selectedShopId === shop.id}
                      isHovered={hoveredShopId === shop.id}
                      isFavorite={userFavorites.has(shop.place_id || shop.id)}
                      onHover={(id) => setHoveredShopId(id)}
                      onSelect={(id) => setSelectedShopId(id)}
                      onViewDetails={(placeId) => setDetailModalPlaceId(placeId)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Real-time Streaming Checklist Active State */}
            {isPending && (
              <div className="flex flex-col items-start max-w-xl animate-fade-in">
                <div className="text-[10px] font-mono text-muted-foreground mb-1 px-1">
                  Synthetix AI Assistant • Streaming active pipeline
                </div>
                <div className="w-full bg-surface-elevated text-foreground border border-border rounded-3xl rounded-tl-none p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="size-2.5 rounded-full bg-accent animate-ping" />
                      <span className="text-sm font-semibold text-accent font-mono">
                        Executing Real-Time Agent Stream...
                      </span>
                    </div>
                  </div>
                  <AgentStatusChecklist
                    steps={activeSteps}
                    isScanningImage={!!selectedImage || activeSteps.some((s) => s.agent === "Image Recognition Agent")}
                    isStreaming={true}
                  />
                </div>
              </div>
            )}

            {/* Stream Interrupted / Failed Retry State */}
            {streamFailed && !isPending && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between gap-4 max-w-xl animate-fade-in">
                <div className="flex items-center gap-3">
                  <AlertCircle className="size-5 text-rose-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-rose-600">Pipeline Stream Interrupted</p>
                    <p className="text-[11px] text-muted-foreground">Click retry to re-run the multi-agent chain.</p>
                  </div>
                </div>
                <button
                  onClick={handleRetry}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <RotateCcw className="size-3.5" />
                  Retry Chain
                </button>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Image Preview Drawer */}
          {selectedImage && (
            <div className="px-6 py-3 bg-surface-elevated border-t border-border flex items-center justify-between animate-slide-up">
              <div className="flex items-center gap-3">
                <div className="relative size-12 rounded-xl overflow-hidden border border-accent/40 shadow-sm shrink-0">
                  <img src={selectedImage} alt="Selected preview" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-xs font-bold flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-accent" />
                    Photo attached for Image Recognition Agent
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Vision agent will stream category & visual feature extraction in real-time
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                title="Remove image"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          {/* Input Bar */}
          <div className="bg-surface-elevated p-4 border-t border-border">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="flex items-center gap-2 bg-background border border-border rounded-full p-2 pl-4 focus-within:border-accent transition-colors shadow-sm"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  selectedImage
                    ? "Add notes or question about this photo (optional)..."
                    : "Ask for local shops or upload a photo..."
                }
                disabled={isPending}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPending}
                title="Upload photo of product or shop"
                className="p-2.5 rounded-full text-muted-foreground hover:text-accent hover:bg-secondary transition-colors disabled:opacity-50"
              >
                <ImageIcon className="size-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageFile(file);
                }}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isPending}
                title="Take photo with camera"
                className="p-2.5 rounded-full text-muted-foreground hover:text-accent hover:bg-secondary transition-colors disabled:opacity-50"
              >
                <Camera className="size-5" />
              </button>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageFile(file);
                }}
                className="hidden"
              />

              <button
                type="submit"
                disabled={isPending || (!inputText.trim() && !selectedImage)}
                className="bg-foreground text-background p-3 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-40 disabled:hover:bg-foreground disabled:hover:text-background shrink-0"
              >
                <Send className="size-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Column — Sticky Real Interactive OpenStreetMap Component */}
        <div
          className={`md:col-span-5 h-[640px] md:h-auto md:max-h-[calc(100vh-140px)] md:sticky md:top-24 rounded-3xl overflow-hidden border border-border shadow-xl ${
            mobileView === "list" ? "hidden md:block" : "block"
          }`}
        >
          <ShopMap
            userLocation={userLocation}
            shops={activeShops}
            selectedShopId={selectedShopId}
            hoveredShopId={hoveredShopId}
            radiusMiles={radiusMiles}
            onSelectShop={handleSelectShopFromMap}
            onRecenter={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    setUserLocation({
                      lat: pos.coords.latitude,
                      lng: pos.coords.longitude,
                      label: "Your Current Location",
                    });
                    toast.success("Recentered on your location!");
                  },
                  () => toast.error("Location unavailable.")
                );
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
