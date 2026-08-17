import { useState, useEffect } from "react";
import {
  MapPin,
  Navigation,
  Search,
  Star,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Clock,
  Compass,
  Package,
  Camera,
} from "lucide-react";
import { fetchNearbyShops, NearbyShop, NearbyShopsResponse } from "@/lib/nearby-shops";
import { ShopMap } from "./ShopMap";
import { ShopGridSkeleton } from "./ShopCardSkeleton";
import { ShopCatalogModal } from "./ShopCatalogModal";
import { StreetCameraModal } from "./StreetCameraModal";
import { toast } from "sonner";

interface NearbyShopsWidgetProps {
  initialKeyword?: string;
}

const CATEGORY_CHIPS = [
  { label: "✨ All Categories", value: "all categories" },
  { label: "🛒 Grocery & Marts", value: "grocery store" },
  { label: "👕 Fashion & Apparel", value: "clothing store" },
  { label: "👟 Footwear & Shoes", value: "footwear" },
  { label: "📱 Electronics & Mobile", value: "electronics shop" },
  { label: "💊 Pharmacy & Medical", value: "pharmacy" },
  { label: "☕ Cafes & Restaurants", value: "coffee shop" },
  { label: "🏠 Home & Hardware", value: "home goods" },
  { label: "💄 Beauty & Cosmetics", value: "beauty salon" },
  { label: "💎 Jewelry & Watches", value: "jewelry store" },
  { label: "🔧 Auto & Spares", value: "auto repair" },
  { label: "⚽ Sports & Fitness", value: "sports store" },
];

export function NearbyShopsWidget({ initialKeyword = "all categories" }: NearbyShopsWidgetProps) {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [radiusKm, setRadiusKm] = useState(5);
  const [locationInput, setLocationInput] = useState("");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState("Detecting location...");
  const [isGPS, setIsGPS] = useState(false);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);

  const [shopsData, setShopsData] = useState<NearbyShopsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [hoveredShopId, setHoveredShopId] = useState<string | null>(null);
  const [activeCatalogShop, setActiveCatalogShop] = useState<{
    id: string;
    name: string;
    category?: string;
    phone?: string;
  } | null>(null);
  const [cameraModalShop, setCameraModalShop] = useState<{
    name: string;
    address: string;
    lat: number;
    lng: number;
    photoUrl?: string;
    category?: string;
  } | null>(null);

  // On initial mount, detect user GPS location automatically if available
  useEffect(() => {
    handleUseGPS();
  }, []);

  // 300ms debounced keyword search & radius search
  useEffect(() => {
    if (!userCoords && !locationInput) return;
    const timer = setTimeout(() => {
      searchShops(userCoords ?? undefined, locationInput || undefined, keyword, radiusKm);
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword, radiusKm]);

  // Fetch shops when user coords, keyword or radius change
  async function searchShops(
    coords?: { lat: number; lng: number },
    locQuery?: string,
    kw?: string,
    rKm?: number,
  ) {
    setIsLoading(true);
    const activeKw = kw ?? keyword;
    const activeQuery = locQuery ?? (locationInput.trim() ? locationInput.trim() : undefined);
    const activeRadius = rKm ?? radiusKm;

    const activeCoords = coords ?? (activeQuery ? undefined : (userCoords ?? undefined));

    try {
      const res = await fetchNearbyShops({
        data: {
          lat: activeCoords?.lat,
          lng: activeCoords?.lng,
          locationQuery: activeQuery,
          keyword: activeKw,
          radiusMeters: activeRadius * 1000,
        },
      });

      setShopsData(res);
      setLocationLabel(res.userLocation.label);
      if (res.userLocation.lat && res.userLocation.lng) {
        setUserCoords({ lat: res.userLocation.lat, lng: res.userLocation.lng });
      }

      if (res.shops.length > 0) {
        const catText = activeKw.toLowerCase().includes("all") ? "all categories" : `"${activeKw}"`;
        toast.success(`Found ${res.shops.length} nearby stores in ${catText} within ${activeRadius} km!`);
      } else {
        toast.info("No shops found nearby. Try broadening your keyword, radius, or location.");
      }
    } catch (err) {
      console.error("Failed to search nearby shops:", err);
      toast.error("Could not load nearby shops. Please check connection.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleUseGPS() {
    const fallback = { lat: 28.6139, lng: 77.209 };

    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      setUserCoords(fallback);
      setLocationLabel("New Delhi, India");
      searchShops(fallback, "New Delhi, India", keyword, radiusKm);
      return;
    }

    setIsLocatingGPS(true);

    if (!userCoords) {
      setUserCoords(fallback);
      setLocationLabel("New Delhi, India");
      searchShops(fallback, "New Delhi, India", keyword, radiusKm);
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingGPS(false);
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        setIsGPS(true);
        setLocationLabel("Your Current Location (GPS)");
        setLocationInput("");
        searchShops(coords, undefined, keyword, radiusKm);
      },
      (err) => {
        setIsLocatingGPS(false);
        console.warn("GPS error:", err.message);
        toast.info("GPS access unavailable. Using default city location.");
        setUserCoords(fallback);
        setLocationLabel("New Delhi, India");
        searchShops(fallback, "New Delhi, India", keyword, radiusKm);
      },
      { timeout: 5000, enableHighAccuracy: true },
    );
  }

  function handleLocationFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!locationInput.trim()) return;
    setIsGPS(false);
    searchShops(undefined, locationInput.trim(), keyword, radiusKm);
  }

  function handleChipClick(val: string) {
    setKeyword(val);
    searchShops(userCoords ?? undefined, locationInput || undefined, val, radiusKm);
  }

  // Transform NearbyShop to ShopResultItem format for ShopMap compatibility
  const mapShops = (shopsData?.shops || []).map((s) => ({
    id: s.id,
    place_id: s.id,
    name: s.name,
    category: s.category || keyword,
    description: s.address,
    address: s.address,
    lat: s.lat,
    lng: s.lng,
    rating: s.rating,
    review_count: s.reviewCount,
    open_now: s.isOpenNow ?? true,
    distance_miles: s.distanceKm ? s.distanceKm : undefined,
    phone: (s as any).phone,
    image_url: (s as any).image_url,
  }));

  const activeLocation = userCoords || { lat: 28.6139, lng: 77.209 };

  return (
    <div className="w-full space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-accent/15 via-accent/5 to-transparent border border-accent/20 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-accent font-bold">
              <Compass className="size-4 animate-spin-slow" />
              <span>GPS Geolocation & Nearest Store Search</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Find Nearest Shops & Stores</h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              Automatic live GPS geolocation & distance calculation in kilometers — discovering verified stores across all categories directly around your current location.
            </p>
          </div>

          {/* GPS Verification Status Indicator */}
          {shopsData && (
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono shrink-0">
              <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                {isGPS ? "Live GPS Location Verified" : "Location Active"}
              </span>
              <span className="px-3 py-1.5 rounded-full bg-accent/15 border border-accent/30 text-accent font-bold">
                Radius: {radiusKm} km
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Control Bar: Location Input + GPS Button + Search + Radius Selector */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-surface-elevated border border-border rounded-2xl p-4 shadow-sm">
        {/* Location / Pincode Search */}
        <form onSubmit={handleLocationFormSubmit} className="md:col-span-5 flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-accent">
              {isGPS ? (
                <Navigation className="size-4 animate-pulse" />
              ) : (
                <MapPin className="size-4" />
              )}
            </div>
            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder={
                isGPS
                  ? "Current GPS location active (or type city/pincode)"
                  : "Enter city, pincode, or area..."
              }
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
            />
          </div>

          <button
            type="button"
            onClick={handleUseGPS}
            disabled={isLocatingGPS}
            title="Use Device GPS Location"
            className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 border transition-all ${
              isGPS
                ? "bg-accent text-accent-foreground border-accent shadow-sm"
                : "bg-background text-foreground border-border hover:bg-secondary"
            }`}
          >
            {isLocatingGPS ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Navigation className="size-3.5" />
            )}
            <span>{isGPS ? "GPS Active" : "Use GPS"}</span>
          </button>
        </form>

        {/* Radius Selector */}
        <div className="md:col-span-2 flex items-center gap-1.5 bg-background border border-border rounded-xl px-3 py-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground shrink-0">Radius:</span>
          <select
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="w-full bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
          >
            <option value={1}>1 km</option>
            <option value={3}>3 km</option>
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={25}>25 km</option>
          </select>
        </div>

        {/* Keyword Search Field */}
        <div className="md:col-span-5 flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
              <Search className="size-4" />
            </div>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  searchShops(userCoords ?? undefined, locationInput || undefined, keyword, radiusKm);
                }
              }}
              placeholder="Store keyword (e.g. all categories, zudio, croma)..."
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              searchShops(userCoords ?? undefined, locationInput || undefined, keyword, radiusKm)
            }
            disabled={isLoading}
            className="px-4 py-2.5 bg-foreground text-background hover:bg-accent hover:text-accent-foreground font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
          >
            {isLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Search className="size-3.5" />
            )}
            <span>Search</span>
          </button>
        </div>
      </div>

      {/* Category Quick Chips Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider font-semibold">
            Categories ({CATEGORY_CHIPS.length}):
          </span>
          {keyword.toLowerCase() !== "all categories" && (
            <button
              onClick={() => handleChipClick("all categories")}
              className="text-xs text-accent font-bold hover:underline"
            >
              Reset to All Categories
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORY_CHIPS.map((chip) => {
            const isActive =
              keyword.toLowerCase() === chip.value.toLowerCase() ||
              (chip.value === "all categories" && keyword.toLowerCase() === "all");

            return (
              <button
                key={chip.value}
                onClick={() => handleChipClick(chip.value)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border shadow-2xs ${
                  isActive
                    ? "bg-accent text-accent-foreground border-accent font-extrabold ring-2 ring-accent/30 shadow-sm"
                    : "bg-surface-elevated border-border text-foreground hover:border-accent/40 hover:bg-secondary"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results View Container (Side-by-side or Stacked Map & Ranked List) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Ranked List sorted by distance (6 columns) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground font-bold">
              <MapPin className="size-4 text-accent" />
              <span>
                Nearest Stores near <strong className="text-foreground">{locationLabel}</strong>
              </span>
            </div>
            {shopsData && (
              <span className="text-[11px] font-mono text-accent font-semibold">
                {shopsData.shops.length} Stores found (Nearest first)
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <ShopGridSkeleton count={3} />
            </div>
          ) : shopsData?.shops && shopsData.shops.length > 0 ? (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {shopsData.shops.map((shop, index) => {
                const isSelected = selectedShopId === shop.id;
                const isHovered = hoveredShopId === shop.id;

                return (
                  <div
                    key={shop.id}
                    onMouseEnter={() => setHoveredShopId(shop.id)}
                    onMouseLeave={() => setHoveredShopId(null)}
                    onClick={() => setSelectedShopId(shop.id)}
                    className={`p-4 bg-surface-elevated border rounded-2xl transition-all duration-200 cursor-pointer shadow-sm flex flex-col justify-between gap-3 ${
                      isSelected
                        ? "border-accent ring-2 ring-accent/40 bg-accent/5 shadow-md"
                        : isHovered
                          ? "border-amber-400 ring-2 ring-amber-400/30"
                          : "border-border hover:border-accent/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="size-5 rounded-full bg-accent/20 border border-accent/40 text-accent font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                            #{index + 1}
                          </span>
                          <h3 className="font-bold text-base text-foreground leading-snug">
                            {shop.name}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2 pl-7 flex-wrap">
                          {shop.category && (
                            <span className="px-2 py-0.5 rounded-md bg-secondary text-[10px] font-mono font-semibold text-accent">
                              {shop.category}
                            </span>
                          )}
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {shop.address}
                          </p>
                        </div>
                      </div>

                      {/* Distance Badge in KM */}
                      <div className="px-3 py-1 bg-accent/15 border border-accent/30 rounded-xl text-accent font-mono text-xs font-extrabold shrink-0 shadow-2xs">
                        📍 {shop.distanceText}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                      {/* Rating & Review Count */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 font-bold text-amber-500">
                          <Star className="size-3.5 fill-amber-400 text-amber-400" />
                          <span>{shop.rating.toFixed(1)}</span>
                          <span className="text-muted-foreground font-normal text-[11px]">
                            ({shop.reviewCount})
                          </span>
                        </div>

                        {shop.isOpenNow !== undefined && (
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              shop.isOpenNow
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            {shop.isOpenNow ? "Open Now" : "Closed"}
                          </span>
                        )}

                        {shop.durationText && (
                          <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                            <Clock className="size-3" />
                            {shop.durationText} drive
                          </span>
                        )}
                      </div>

                      {/* Catalog, Street Camera & Directions Buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveCatalogShop({
                              id: shop.id,
                              name: shop.name,
                              category: shop.category,
                              phone: (shop as any).phone,
                            });
                          }}
                          className="px-3 py-1.5 bg-accent/15 border border-accent/30 text-accent hover:bg-accent hover:text-accent-foreground rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <Package className="size-3.5 text-accent" />
                          <span>Catalog & Stock</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCameraModalShop({
                              name: shop.name,
                              address: shop.address,
                              lat: shop.lat!,
                              lng: shop.lng!,
                              photoUrl: (shop as any).image_url,
                              category: shop.category,
                            });
                          }}
                          className="px-3 py-1.5 bg-secondary border border-border text-foreground hover:bg-accent hover:text-accent-foreground rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                          title="View 360° Real Street Camera & Storefront"
                        >
                          <Camera className="size-3.5 text-accent" />
                          <span>360° Camera</span>
                        </button>

                        <a
                          href={shop.googleMapsDirectionsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-3.5 py-1.5 bg-foreground text-background hover:bg-accent hover:text-accent-foreground rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                        >
                          <ExternalLink className="size-3.5" />
                          <span>Directions</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 bg-surface-elevated border border-border rounded-2xl text-center text-xs text-muted-foreground space-y-2">
              <p>No stores matching "{keyword}" found within {radiusKm} km.</p>
              <button
                onClick={() => handleChipClick("all categories")}
                className="px-4 py-2 bg-accent text-accent-foreground rounded-xl text-xs font-bold hover:opacity-90"
              >
                Show All Categories Near Me
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Leaflet Map with Pins (6 columns) */}
        <div className="lg:col-span-6 h-[580px] sticky top-6">
          <ShopMap
            userLocation={{
              lat: activeLocation.lat,
              lng: activeLocation.lng,
              label: locationLabel,
            }}
            shops={mapShops}
            selectedShopId={selectedShopId}
            hoveredShopId={hoveredShopId}
            radiusMiles={radiusKm / 1.609}
            onSelectShop={(id) => setSelectedShopId(id)}
            onRecenter={() => handleUseGPS()}
          />
        </div>
      </div>

      {/* Live Store Catalog & Stock Modal */}
      {activeCatalogShop && (
        <ShopCatalogModal
          shopId={activeCatalogShop.id}
          shopName={activeCatalogShop.name}
          shopCategory={activeCatalogShop.category}
          phone={activeCatalogShop.phone}
          onClose={() => setActiveCatalogShop(null)}
        />
      )}

      {/* Real 360° Street Camera View Modal */}
      {cameraModalShop && (
        <StreetCameraModal
          shopName={cameraModalShop.name}
          address={cameraModalShop.address}
          lat={cameraModalShop.lat}
          lng={cameraModalShop.lng}
          photoUrl={cameraModalShop.photoUrl}
          category={cameraModalShop.category}
          onClose={() => setCameraModalShop(null)}
        />
      )}
    </div>
  );
}
