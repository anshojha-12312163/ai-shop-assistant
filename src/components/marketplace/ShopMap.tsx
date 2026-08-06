import { useEffect, useState, useMemo } from "react";
import type { ShopResultItem } from "@/lib/ai.functions";
import { MapPin, Navigation, Star, Phone, ExternalLink, Sparkles, Coffee, Cross, ShoppingBag, Mountain, Home, Pill } from "lucide-react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import { getCategoryPlaceholderSvg } from "@/lib/image-helpers";

interface ShopMapProps {
  userLocation: { lat: number; lng: number; label: string };
  shops: ShopResultItem[];
  selectedShopId?: string | null;
  hoveredShopId?: string | null;
  radiusMiles?: number;
  onSelectShop?: (shopId: string) => void;
  onRecenter?: () => void;
}

// Auto-adjust map bounds when shops update
function MapBoundsUpdater({
  userLocation,
  shops,
}: {
  userLocation: { lat: number; lng: number };
  shops: ShopResultItem[];
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const points: [number, number][] = [];

    // Include all valid shop pins
    shops.forEach((s) => {
      if (typeof s.lat === "number" && typeof s.lng === "number" && !isNaN(s.lat) && !isNaN(s.lng)) {
        points.push([s.lat, s.lng]);
      }
    });

    // Include user / active location point
    if (typeof userLocation.lat === "number" && typeof userLocation.lng === "number") {
      points.push([userLocation.lat, userLocation.lng]);
    }

    if (points.length > 1) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 15, animate: true });
    } else if (points.length === 1) {
      map.setView(points[0], 14, { animate: true });
    }
  }, [map, userLocation.lat, userLocation.lng, shops]);

  return null;
}

// Custom HTML DivIcon generator for Leaflet
function createShopIcon(category: string, isHighlighted: boolean, isSelected: boolean) {
  let iconSvg = "🛍️";
  const catLower = category.toLowerCase();

  if (catLower.includes("cafe") || catLower.includes("coffee")) iconSvg = "☕";
  else if (catLower.includes("pharmacy") || catLower.includes("medicine")) iconSvg = "💊";
  else if (catLower.includes("footwear") || catLower.includes("shoe")) iconSvg = "👟";
  else if (catLower.includes("outdoor") || catLower.includes("hiking")) iconSvg = "⛺";
  else if (catLower.includes("home") || catLower.includes("ceramic")) iconSvg = "🏺";

  const sizeClass = isSelected || isHighlighted ? "scale-125 z-[1000]" : "hover:scale-110";
  const bgClass = isSelected
    ? "bg-accent text-accent-foreground ring-4 ring-accent/40 shadow-xl"
    : isHighlighted
    ? "bg-amber-500 text-white ring-4 ring-amber-400/50 shadow-lg"
    : "bg-teal-600 text-white ring-2 ring-white shadow-md";

  const html = `
    <div class="relative flex items-center justify-center cursor-pointer transition-all duration-300 ${sizeClass}">
      <div class="size-9 rounded-2xl ${bgClass} flex items-center justify-center text-sm font-bold shadow-md">
        <span>${iconSvg}</span>
      </div>
      <div class="absolute -bottom-1 size-2 rotate-45 ${isSelected ? "bg-accent" : isHighlighted ? "bg-amber-500" : "bg-teal-600"}"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-leaflet-shop-pin",
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
}

function createUserIcon() {
  const html = `
    <div class="relative size-7 flex items-center justify-center">
      <div class="absolute inset-0 bg-blue-500/40 rounded-full animate-ping"></div>
      <div class="size-4 bg-blue-600 border-2 border-white rounded-full shadow-lg"></div>
    </div>
  `;
  return L.divIcon({
    html,
    className: "custom-leaflet-user-pin",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export function ShopMap({
  userLocation,
  shops,
  selectedShopId,
  hoveredShopId,
  radiusMiles = 5,
  onSelectShop,
  onRecenter,
}: ShopMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userIcon = useMemo(() => createUserIcon(), []);

  if (!mounted) {
    return (
      <div className="w-full h-full min-h-[350px] bg-secondary/40 border border-border rounded-3xl flex items-center justify-center">
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <MapPin className="size-4 text-accent animate-bounce" />
          <span>Loading Interactive Map...</span>
        </div>
      </div>
    );
  }

  const radiusMeters = radiusMiles * 1609.34;

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-3xl overflow-hidden border border-border shadow-inner group">
      {/* Recenter Button */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        {onRecenter && (
          <button
            onClick={onRecenter}
            title="Recenter on current location"
            className="p-2.5 bg-surface-elevated text-foreground hover:bg-accent hover:text-accent-foreground border border-border rounded-2xl shadow-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <Navigation className="size-4" />
            <span className="hidden sm:inline">My Location</span>
          </button>
        )}
      </div>

      <MapContainer
        center={[userLocation.lat, userLocation.lng]}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        style={{ height: "100%", minHeight: "400px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBoundsUpdater userLocation={userLocation} shops={shops} />

        {/* Search Radius Circle Overlay */}
        <Circle
          center={[userLocation.lat, userLocation.lng]}
          radius={radiusMeters}
          pathOptions={{
            color: "hsl(35 70% 45%)",
            fillColor: "hsl(35 70% 45%)",
            fillOpacity: 0.08,
            weight: 1.5,
            dashArray: "6, 6",
          }}
        />

        {/* User Location Marker */}
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          <Popup className="custom-leaflet-popup">
            <div className="p-2 text-xs font-sans">
              <div className="font-bold flex items-center gap-1 text-blue-600">
                <Navigation className="size-3.5" />
                <span>You are here</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{userLocation.label}</p>
            </div>
          </Popup>
        </Marker>

        {/* Shop Result Markers */}
        {shops.map((shop) => {
          if (!shop.lat || !shop.lng) return null;
          const isSelected = selectedShopId === shop.id;
          const isHighlighted = hoveredShopId === shop.id;
          const icon = createShopIcon(shop.category, isHighlighted, isSelected);

          const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${shop.name} ${shop.address}`
          )}`;

          return (
            <Marker
              key={shop.id}
              position={[shop.lat, shop.lng]}
              icon={icon}
              eventHandlers={{
                click: () => {
                  if (onSelectShop) onSelectShop(shop.id);
                },
              }}
            >
              <Popup className="custom-leaflet-popup">
                <div className="w-56 p-1 space-y-2 font-sans text-xs">
                  {/* Image */}
                  <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-secondary">
                    <img
                      src={
                        shop.image_url && !shop.image_url.includes("picsum")
                          ? shop.image_url
                          : getCategoryPlaceholderSvg(shop.category, shop.name)
                      }
                      alt={shop.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1.5 left-1.5">
                      <span className="bg-black/70 backdrop-blur-md text-white text-[9px] font-mono px-2 py-0.5 rounded-full">
                        {shop.category}
                      </span>
                    </div>
                    {shop.match_score && (
                      <div className="absolute top-1.5 right-1.5 bg-accent text-accent-foreground text-[9px] font-bold font-mono px-2 py-0.5 rounded-full">
                        {shop.match_score}% Match
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div>
                    <h4 className="font-bold text-sm text-foreground leading-snug">{shop.name}</h4>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                      {shop.address}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-0.5">
                        <Star className="size-3 text-amber-400 fill-amber-400" />
                        <span className="font-bold text-[11px]">{shop.rating.toFixed(1)}</span>
                      </div>
                      {shop.distance_miles !== undefined && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {shop.distance_miles} mi away
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* View Details Button */}
                  <div className="pt-1 flex gap-1.5">
                    <button
                      onClick={() => onSelectShop && onSelectShop(shop.id)}
                      className="flex-1 bg-foreground text-background hover:bg-accent text-[11px] font-bold py-1.5 rounded-lg text-center transition-colors"
                    >
                      Highlight in List
                    </button>
                    <a
                      href={directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-secondary text-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
                      title="Get Directions"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
