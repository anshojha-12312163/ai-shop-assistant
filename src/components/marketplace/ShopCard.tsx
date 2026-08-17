import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Star, MapPin, Phone, ExternalLink, Sparkles, Heart, MessageSquare } from "lucide-react";
import type { ShopResultItem } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { getCategoryPlaceholderSvg } from "@/lib/image-helpers";
import { getShopWhatsAppUrl } from "@/lib/whatsapp";
import { toast } from "sonner";

interface ShopCardProps {
  shop: ShopResultItem;
  featured?: boolean;
  isSelected?: boolean;
  isHovered?: boolean;
  isFavorite?: boolean;
  onHover?: (shopId: string | null) => void;
  onSelect?: (shopId: string) => void;
  onViewDetails?: (placeId: string) => void;
  onToggleFavorite?: (shopId: string, currentFav: boolean) => void;
}

export function ShopCard({
  shop,
  isSelected,
  isHovered,
  isFavorite: externalIsFavorite,
  onHover,
  onSelect,
  onViewDetails,
  onToggleFavorite,
}: ShopCardProps) {
  const [internalFav, setInternalFav] = useState(false);
  const isFav = externalIsFavorite ?? internalFav;

  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${shop.name} ${shop.address}`,
  )}`;

  async function handleFavClick(e: React.MouseEvent) {
    e.stopPropagation();
    const shopId = shop.place_id || shop.id;

    if (onToggleFavorite) {
      onToggleFavorite(shopId, isFav);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) {
      toast.error("Please sign in to save favorite shops.");
      return;
    }

    const nextFav = !isFav;
    setInternalFav(nextFav);

    try {
      if (nextFav) {
        const { error } = await supabase.from("favorites").upsert({
          user_id: user.id,
          shop_id: shopId,
          shop_name: shop.name,
          shop_image: shop.image_url ?? null,
          shop_category: shop.category,
          shop_rating: shop.rating,
        });
        if (error) throw error;
        toast.success(`Saved "${shop.name}" to favorites`);
      } else {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("shop_id", shopId);
        if (error) throw error;
        toast.success(`Removed "${shop.name}" from favorites`);
      }
    } catch (err) {
      setInternalFav(!nextFav);
      toast.error("Could not update favorites.");
    }
  }

  return (
    <div
      id={`shop-card-${shop.id}`}
      onMouseEnter={() => onHover && onHover(shop.id)}
      onMouseLeave={() => onHover && onHover(null)}
      onClick={() => onSelect && onSelect(shop.id)}
      className={`group relative bg-surface-elevated rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer border ${
        isSelected
          ? "border-accent ring-2 ring-accent/50 shadow-xl scale-[1.02]"
          : isHovered
            ? "border-amber-400 ring-2 ring-amber-400/40 shadow-lg scale-[1.01]"
            : "border-border hover:border-accent/40"
      }`}
    >
      <div>
        {/* Shop Image */}
        <div className="relative aspect-[16/9] bg-secondary/50 overflow-hidden">
          <img
            src={
              shop.image_url && !shop.image_url.includes("picsum")
                ? shop.image_url
                : getCategoryPlaceholderSvg(shop.category, shop.name)
            }
            alt={shop.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

          {/* Category Badge, Sponsored Badge & Open Pill */}
          <div className="absolute top-3 left-3 flex items-center gap-2 flex-wrap">
            {((shop as any).is_sponsored || (shop as any).sponsored_until) && (
              <span className="bg-amber-400 text-amber-950 font-mono text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm">
                ★ Sponsored
              </span>
            )}
            <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/20">
              {shop.category}
            </span>
            {shop.open_now ? (
              <span className="bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-white animate-pulse" />
                Open Now
              </span>
            ) : (
              <span className="bg-rose-500/80 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
                Closed
              </span>
            )}
          </div>

          {/* Top Right Controls: Favorite Heart Button & Match Score */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            {shop.match_score && (
              <div className="bg-accent text-accent-foreground text-xs font-bold font-mono px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                <Sparkles className="size-3" />
                {shop.match_score}% Match
              </div>
            )}
            <button
              onClick={handleFavClick}
              title={isFav ? "Remove from favorites" : "Save to favorites"}
              className="size-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all shadow-md"
            >
              <Heart
                className={`size-4 transition-colors ${
                  isFav ? "fill-rose-500 text-rose-500" : "text-white/80 hover:text-white"
                }`}
              />
            </button>
          </div>

          {/* Name & Rating Overlay */}
          <div className="absolute bottom-3 left-3 right-3 text-white">
            <h3 className="text-xl font-bold tracking-tight drop-shadow-sm">{shop.name}</h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-white/90">
              <div className="flex items-center gap-1">
                <Star className="size-3.5 text-amber-400 fill-amber-400" />
                <span className="font-bold">{shop.rating.toFixed(1)}</span>
                <span className="text-white/70">({shop.review_count})</span>
              </div>
              {shop.distance_miles !== undefined && (
                <>
                  <span>•</span>
                  <span className="font-mono text-[11px]">{shop.distance_miles} km away</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content body */}
        <div className="p-5 space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {shop.description}
          </p>

          <div className="space-y-1.5 text-xs text-muted-foreground pt-1">
            <div className="flex items-start gap-2">
              <MapPin className="size-3.5 text-accent shrink-0 mt-0.5" />
              <span className="truncate">{shop.address}</span>
            </div>
            {shop.phone && (
              <div className="flex items-center gap-2">
                <Phone className="size-3.5 text-accent shrink-0" />
                <span>{shop.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div
        className="px-5 pb-5 pt-2 border-t border-border/50 flex flex-wrap gap-2 items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {onViewDetails && (
          <button
            onClick={() => onViewDetails(shop.place_id || shop.id)}
            className="px-3.5 bg-accent text-accent-foreground hover:bg-accent/90 text-xs font-bold py-2 rounded-full transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-[38px]"
          >
            Details
          </button>
        )}
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-w-[100px] bg-foreground text-background hover:bg-accent hover:text-accent-foreground text-xs font-bold py-2 rounded-full flex items-center justify-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-[38px]"
        >
          <ExternalLink className="size-3.5" />
          Directions
        </a>
        {shop.phone && (
          <a
            href={`tel:${shop.phone.replace(/[^0-9]/g, "")}`}
            className="px-3 border border-border text-foreground hover:bg-secondary text-xs font-semibold py-2 rounded-full flex items-center justify-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-[38px]"
          >
            <Phone className="size-3.5 text-sky-500" />
            Call
          </a>
        )}
        {getShopWhatsAppUrl((shop as any).whatsapp_number || shop.phone, shop.name) && (
          <a
            href={getShopWhatsAppUrl((shop as any).whatsapp_number || shop.phone, shop.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 bg-emerald-600/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600/20 text-xs font-bold py-2 rounded-full flex items-center justify-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 min-h-[38px]"
          >
            <MessageSquare className="size-3.5 text-emerald-500" />
            WhatsApp
          </a>
        )}
        <Link
          to="/discover"
          search={{ q: `Tell me about ${shop.name} in ${shop.category}` }}
          className="px-3 border border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 text-xs font-bold py-2 rounded-full flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 min-h-[38px]"
          title="Ask AI Assistant about this shop"
        >
          <Sparkles className="size-3" />
          Ask AI
        </Link>
      </div>
    </div>
  );
}
