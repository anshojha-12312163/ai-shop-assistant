import { useEffect, useState, useMemo } from "react";
import type { ShopResultItem } from "@/lib/ai.functions";
import { MapPin, Navigation, Star, ExternalLink, MessageSquare, Plus, Minus } from "lucide-react";
import { getCategoryPlaceholderSvg } from "@/lib/image-helpers";
import { getShopWhatsAppUrl } from "@/lib/whatsapp";

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
  L,
  useMap,
  userLocation,
  shops,
}: {
  L: any;
  useMap: any;
  userLocation: { lat: number; lng: number };
  shops: ShopResultItem[];
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !L) return;

    const points: [number, number][] = [];

    // Include all valid shop pins
    shops.forEach((s) => {
      if (
        typeof s.lat === "number" &&
        typeof s.lng === "number" &&
        !isNaN(s.lat) &&
        !isNaN(s.lng)
      ) {
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
  }, [map, L, userLocation.lat, userLocation.lng, shops]);

  return null;
}

// Custom HTML DivIcon generator for Leaflet with category-specific colors and icons
function createShopIcon(L: any, category: string, isHighlighted: boolean, isSelected: boolean) {
  let iconSvg = "🛍️";
  let pinBg = "bg-indigo-600";
  const catLower = (category || "").toLowerCase();

  if (catLower.includes("grocery") || catLower.includes("supermarket") || catLower.includes("mart") || catLower.includes("departmental")) {
    iconSvg = "🛒";
    pinBg = "bg-emerald-600";
  } else if (catLower.includes("fashion") || catLower.includes("cloth") || catLower.includes("apparel") || catLower.includes("zudio")) {
    iconSvg = "👕";
    pinBg = "bg-purple-600";
  } else if (catLower.includes("footwear") || catLower.includes("shoe") || catLower.includes("sneaker")) {
    iconSvg = "👟";
    pinBg = "bg-orange-600";
  } else if (catLower.includes("electronic") || catLower.includes("mobile") || catLower.includes("croma") || catLower.includes("gadget")) {
    iconSvg = "📱";
    pinBg = "bg-blue-600";
  } else if (catLower.includes("pharmacy") || catLower.includes("medicine") || catLower.includes("chemist") || catLower.includes("drugstore")) {
    iconSvg = "💊";
    pinBg = "bg-rose-600";
  } else if (catLower.includes("cafe") || catLower.includes("coffee") || catLower.includes("bakery") || catLower.includes("restaurant")) {
    iconSvg = "☕";
    pinBg = "bg-amber-600";
  } else if (catLower.includes("home") || catLower.includes("ceramic") || catLower.includes("hardware") || catLower.includes("decor")) {
    iconSvg = "🏠";
    pinBg = "bg-teal-600";
  } else if (catLower.includes("beauty") || catLower.includes("salon") || catLower.includes("cosmetic") || catLower.includes("spa")) {
    iconSvg = "💄";
    pinBg = "bg-pink-600";
  } else if (catLower.includes("jewel") || catLower.includes("gold") || catLower.includes("watch")) {
    iconSvg = "💎";
    pinBg = "bg-yellow-600";
  } else if (catLower.includes("auto") || catLower.includes("car") || catLower.includes("repair") || catLower.includes("spare")) {
    iconSvg = "🔧";
    pinBg = "bg-slate-700";
  } else if (catLower.includes("sport") || catLower.includes("outdoor") || catLower.includes("hiking") || catLower.includes("gym")) {
    iconSvg = "⚽";
    pinBg = "bg-sky-600";
  }

  const sizeClass = isSelected || isHighlighted ? "scale-125 z-[1000]" : "hover:scale-110";
  const bgClass = isSelected
    ? "bg-accent text-accent-foreground ring-4 ring-accent/40 shadow-xl"
    : isHighlighted
      ? "bg-amber-500 text-white ring-4 ring-amber-400/50 shadow-lg"
      : `${pinBg} text-white ring-2 ring-white shadow-md`;

  const html = `
    <div class="relative flex items-center justify-center cursor-pointer transition-all duration-300 ${sizeClass}">
      <div class="size-9 rounded-2xl ${bgClass} flex items-center justify-center text-sm font-bold shadow-md">
        <span>${iconSvg}</span>
      </div>
      <div class="absolute -bottom-1 size-2 rotate-45 ${isSelected ? "bg-accent" : isHighlighted ? "bg-amber-500" : pinBg}"></div>
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

function createUserIcon(L: any) {
  const html = `
    <div class="relative size-8 flex items-center justify-center">
      <div class="absolute inset-0 bg-blue-500/40 rounded-full animate-ping"></div>
      <div class="size-5 bg-blue-600 border-2 border-white rounded-full shadow-lg flex items-center justify-center text-[10px] text-white font-bold">🎯</div>
    </div>
  `;
  return L.divIcon({
    html,
    className: "custom-leaflet-user-pin",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

import { StreetCameraModal } from "./StreetCameraModal";
import { Camera } from "lucide-react";

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
  const [L, setL] = useState<any>(null);
  const [RL, setRL] = useState<any>(null);
  const [mapStyle, setMapStyle] = useState<"standard" | "satellite" | "hybrid">("standard");
  const [cameraModalShop, setCameraModalShop] = useState<{
    name: string;
    address: string;
    lat: number;
    lng: number;
    photoUrl?: string;
    category?: string;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
    Promise.all([import("leaflet"), import("react-leaflet")]).then(
      ([leafletModule, reactLeafletModule]) => {
        setL(leafletModule.default || leafletModule);
        setRL(reactLeafletModule);
      },
    );
  }, []);

  const userIcon = useMemo(() => {
    if (!L) return null;
    return createUserIcon(L);
  }, [L]);

  if (!mounted || !L || !RL) {
    return (
      <div className="w-full h-full min-h-[350px] bg-secondary/40 border border-border rounded-3xl flex items-center justify-center">
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <MapPin className="size-4 text-accent animate-bounce" />
          <span>Loading Interactive Map...</span>
        </div>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, Circle, useMap } = RL;
  const radiusMeters = radiusMiles * 1609.34;

  // Custom Zoom Control Buttons Component
  function MapZoomControls() {
    const map = useMap();
    return (
      <div className="absolute bottom-6 right-4 z-[1000] flex flex-col bg-surface-elevated/90 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl overflow-hidden">
        <button
          type="button"
          onClick={() => map.zoomIn()}
          title="Zoom In (+)"
          className="p-2.5 hover:bg-accent hover:text-accent-foreground text-foreground transition-colors flex items-center justify-center cursor-pointer"
        >
          <Plus className="size-4" />
        </button>
        <div className="h-px bg-border/60" />
        <button
          type="button"
          onClick={() => map.zoomOut()}
          title="Zoom Out (-)"
          className="p-2.5 hover:bg-accent hover:text-accent-foreground text-foreground transition-colors flex items-center justify-center cursor-pointer"
        >
          <Minus className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-3xl overflow-hidden border border-border shadow-inner group">
      {/* Shifted Top Left Control Bar: Satellite / Street / Hybrid Switcher */}
      <div className="absolute top-4 left-4 z-[1000] flex items-center bg-surface-elevated/95 backdrop-blur-md border border-border/90 p-1 rounded-2xl shadow-xl">
        <button
          onClick={() => setMapStyle("standard")}
          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            mapStyle === "standard"
              ? "bg-accent text-accent-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          🗺️ Street
        </button>
        <button
          onClick={() => setMapStyle("satellite")}
          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            mapStyle === "satellite"
              ? "bg-accent text-accent-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          🛰️ Satellite View
        </button>
        <button
          onClick={() => setMapStyle("hybrid")}
          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            mapStyle === "hybrid"
              ? "bg-accent text-accent-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          🏙️ Hybrid
        </button>
      </div>

      {/* Top Right Control Bar: Recenter Button */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        {onRecenter && (
          <button
            onClick={onRecenter}
            title="Recenter on current location"
            className="p-2.5 bg-surface-elevated/95 text-foreground hover:bg-accent hover:text-accent-foreground border border-border rounded-2xl shadow-xl transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <Navigation className="size-4" />
            <span className="hidden sm:inline">My Location</span>
          </button>
        )}
      </div>

      <MapContainer
        center={[userLocation.lat, userLocation.lng]}
        zoom={13}
        zoomControl={false}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        style={{ height: "100%", minHeight: "400px" }}
      >
        <MapZoomControls />
        {mapStyle === "standard" && (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}

        {(mapStyle === "satellite" || mapStyle === "hybrid") && (
          <TileLayer
            attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        )}

        {mapStyle === "hybrid" && (
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
          />
        )}

        <MapBoundsUpdater L={L} useMap={useMap} userLocation={userLocation} shops={shops} />

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
        {userIcon && (
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
        )}

        {/* Shop Result Markers */}
        {shops.map((shop) => {
          if (!shop.lat || !shop.lng) return null;
          const isSelected = selectedShopId === shop.id;
          const isHighlighted = hoveredShopId === shop.id;
          const icon = createShopIcon(L, shop.category, isHighlighted, isSelected);

          const directionsUrl =
            (shop as any).googleMapsDirectionsUrl ||
            `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
              `${shop.name}, ${shop.address}`,
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
                          <span className="font-mono text-[10px] text-accent font-bold">
                            {shop.distance_miles} km away
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* View Details, Directions, Street Camera & WhatsApp Buttons */}
                  <div className="pt-1 flex gap-1 items-center flex-wrap">
                    <button
                      onClick={() => onSelectShop && onSelectShop(shop.id)}
                      className="flex-1 bg-foreground text-background hover:bg-accent text-[10px] font-bold py-1 px-2 rounded-lg text-center transition-colors"
                    >
                      Highlight
                    </button>

                    <button
                      onClick={() =>
                        setCameraModalShop({
                          name: shop.name,
                          address: shop.address,
                          lat: shop.lat!,
                          lng: shop.lng!,
                          photoUrl: shop.image_url || undefined,
                          category: shop.category,
                        })
                      }
                      className="p-1.5 bg-accent/15 text-accent hover:bg-accent hover:text-accent-foreground border border-accent/30 rounded-lg transition-colors flex items-center gap-1 font-bold text-[10px]"
                      title="View 360° Street Camera View"
                    >
                      <Camera className="size-3 text-accent" />
                      <span>Camera</span>
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

                    {getShopWhatsAppUrl((shop as any).whatsapp_number || shop.phone, shop.name) && (
                      <a
                        href={getShopWhatsAppUrl((shop as any).whatsapp_number || shop.phone, shop.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-emerald-600/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600/20 rounded-lg transition-colors"
                        title="Chat on WhatsApp"
                      >
                        <MessageSquare className="size-3.5 text-emerald-500" />
                      </a>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Street Camera 360 View Modal */}
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
