import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { fetchPlaceDetails, type PlaceDetailResult } from "@/lib/ai.functions";
import { X, Star, MapPin, Phone, Globe, ExternalLink, Clock, Loader2, Sparkles, UserCheck, Navigation, Info } from "lucide-react";
import { MapRoutingView } from "./MapRoutingView";

interface ShopDetailModalProps {
  placeId: string | null;
  onClose: () => void;
  userLocation?: { lat: number; lng: number; label?: string };
  initialTab?: "details" | "route";
  matchedItemContext?: string;
}

export function ShopDetailModal({
  placeId,
  onClose,
  userLocation = { lat: 47.6062, lng: -122.3321, label: "Downtown Seattle" },
  initialTab = "details",
  matchedItemContext,
}: ShopDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<PlaceDetailResult | null>(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<"details" | "route">(initialTab);

  const getDetails = useServerFn(fetchPlaceDetails);

  useEffect(() => {
    if (!placeId) return;

    let mounted = true;
    setLoading(true);
    setActivePhotoIdx(0);
    setActiveTab(initialTab);

    getDetails({ data: { place_id: placeId } })
      .then((res) => {
        if (mounted) {
          setDetails(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error fetching place details:", err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [placeId, initialTab]);

  if (!placeId) return null;

  const destinationCoords = {
    lat: details?.lat ?? 47.6090,
    lng: details?.lng ?? -122.3385,
    name: details?.name ?? "Matched Local Shop",
    address: details?.address ?? "Seattle, WA",
  };

  return (
    <div className="fixed inset-0 z-[5000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-surface-elevated border border-border rounded-3xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Close Bar */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-colors shadow-md"
            title="Close modal"
          >
            <X className="size-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-16 text-center flex flex-col items-center justify-center gap-3 min-h-[300px]">
            <Loader2 className="size-8 text-accent animate-spin" />
            <span className="font-mono text-xs text-muted-foreground">
              Fetching Google Places Details...
            </span>
          </div>
        ) : details ? (
          <div className="overflow-y-auto flex-1">
            {/* Photo Gallery Carousel / Preview */}
            <div className="relative aspect-[16/9] bg-secondary overflow-hidden">
              <img
                src={details.photos[activePhotoIdx] ?? details.photos[0]}
                alt={details.name}
                className="w-full h-full object-cover transition-all duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Photos indicator thumbnails */}
              {details.photos.length > 1 && (
                <div className="absolute bottom-3 left-4 right-4 flex gap-2 overflow-x-auto pb-1">
                  {details.photos.map((ph, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePhotoIdx(idx)}
                      className={`relative size-12 rounded-lg overflow-hidden border-2 shrink-0 transition-transform ${
                        activePhotoIdx === idx
                          ? "border-accent scale-105 shadow-md"
                          : "border-white/50 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={ph} alt="Thumb" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Title & Rating Banner */}
              <div className="absolute bottom-16 left-4 right-4 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-accent text-accent-foreground text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full font-bold">
                    Verified Merchant
                  </span>
                  {details.open_now ? (
                    <span className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      Open Now
                    </span>
                  ) : (
                    <span className="bg-rose-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      Closed
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold tracking-tight">{details.name}</h2>
                <div className="flex items-center gap-2 mt-1 text-xs text-white/90">
                  <div className="flex items-center gap-1">
                    <Star className="size-4 text-amber-400 fill-amber-400" />
                    <span className="font-bold text-sm">{details.rating.toFixed(1)}</span>
                    <span className="text-white/70">({details.user_ratings_total} reviews)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* View Mode Sub-Header Tabs */}
            <div className="px-6 pt-4 border-b border-border bg-surface-elevated flex items-center justify-between">
              <div className="flex gap-2 p-1 bg-secondary rounded-full">
                <button
                  onClick={() => setActiveTab("details")}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    activeTab === "details" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  Shop Info & Reviews
                </button>
                <button
                  onClick={() => setActiveTab("route")}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                    activeTab === "route" ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  <Navigation className="size-3.5" />
                  Map Directions & Route
                </button>
              </div>
            </div>

            {/* Modal Body Content */}
            <div className="p-6 space-y-6">
              {matchedItemContext && (
                <div className="p-3.5 bg-accent/10 border border-accent/30 rounded-2xl flex items-center gap-3 text-xs text-accent">
                  <Sparkles className="size-4 shrink-0" />
                  <span>
                    <strong>Query Match:</strong> {matchedItemContext}
                  </span>
                </div>
              )}

              {activeTab === "route" ? (
                <MapRoutingView userLocation={userLocation} destination={destinationCoords} />
              ) : (
                <>
                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-3 pb-4 border-b border-border">
                    <button
                      onClick={() => setActiveTab("route")}
                      className="flex-1 bg-foreground text-background hover:bg-accent hover:text-accent-foreground py-3 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <Navigation className="size-4" />
                      Get Directions & Route Line
                    </button>
                    {details.phone && (
                      <a
                        href={`tel:${details.phone.replace(/[^0-9]/g, "")}`}
                        className="px-5 border border-border hover:bg-secondary text-foreground py-3 rounded-full text-xs font-semibold flex items-center gap-2 transition-colors"
                      >
                        <Phone className="size-4 text-accent" />
                        Call Shop
                      </a>
                    )}
                    {details.website && (
                      <a
                        href={details.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 border border-border hover:bg-secondary text-foreground py-3 rounded-full text-xs font-semibold flex items-center gap-2 transition-colors"
                      >
                        <Globe className="size-4 text-accent" />
                        Website
                      </a>
                    )}
                  </div>

                  {/* Address & Hours Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-mono text-xs uppercase tracking-widest text-accent font-bold flex items-center gap-1.5">
                    <MapPin className="size-3.5" />
                    Address & Contact
                  </h4>
                  <p className="text-sm font-medium leading-relaxed">{details.address}</p>
                  {details.phone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <Phone className="size-3.5 text-accent" />
                      {details.phone}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="font-mono text-xs uppercase tracking-widest text-accent font-bold flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    Operating Hours
                  </h4>
                  <ul className="text-xs space-y-1 text-muted-foreground font-mono">
                    {details.weekday_text.map((day, idx) => (
                      <li key={idx} className="flex justify-between">
                        <span>{day}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Customer Reviews Section */}
              {details.reviews && details.reviews.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <h4 className="font-mono text-xs uppercase tracking-widest text-accent font-bold flex items-center gap-1.5">
                    <UserCheck className="size-3.5" />
                    Google Customer Reviews ({details.reviews.length})
                  </h4>
                  <div className="space-y-3">
                    {details.reviews.map((rev, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-secondary/30 border border-border/60 rounded-2xl space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {rev.profile_photo_url ? (
                              <img
                                src={rev.profile_photo_url}
                                alt={rev.author_name}
                                className="size-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="size-6 rounded-full bg-accent/20 text-accent font-bold flex items-center justify-center text-[10px]">
                                {rev.author_name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <span className="font-bold text-foreground">{rev.author_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="size-3 text-amber-400 fill-amber-400" />
                            <span className="font-bold">{rev.rating}</span>
                            <span className="text-[10px] text-muted-foreground font-mono ml-1">
                              {rev.relative_time}
                            </span>
                          </div>
                        </div>
                        <p className="text-muted-foreground leading-relaxed italic">
                          "{rev.text}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    ) : (
      <div className="p-12 text-center text-muted-foreground">Could not load details.</div>
    )}
      </div>
    </div>
  );
}
