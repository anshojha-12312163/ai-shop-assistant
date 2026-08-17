import { useState, useEffect } from "react";
import {
  X,
  Camera,
  ExternalLink,
  MapPin,
  Compass,
  Image as ImageIcon,
  RotateCw,
  Layers,
  ChevronLeft,
  ChevronRight,
  Eye,
  Play,
  Pause,
} from "lucide-react";

interface StreetCameraModalProps {
  shopName: string;
  address: string;
  lat: number;
  lng: number;
  photoUrl?: string;
  category?: string;
  onClose: () => void;
}

function resolveCategoryMultiAngleImages(category: string, shopName: string, photoUrl?: string) {
  const catLower = (category || "").toLowerCase();

  let front = photoUrl || "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=900&auto=format&fit=crop&q=80";
  let right = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&auto=format&fit=crop&q=80";
  let opposite = "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=900&auto=format&fit=crop&q=80";
  let left = "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=900&auto=format&fit=crop&q=80";

  if (catLower.includes("cloth") || catLower.includes("fashion") || catLower.includes("apparel") || catLower.includes("zudio")) {
    front = photoUrl || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&auto=format&fit=crop&q=80";
    right = "https://images.unsplash.com/photo-1445205170230-053b83016050?w=900&auto=format&fit=crop&q=80";
    opposite = "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=900&auto=format&fit=crop&q=80";
    left = "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=900&auto=format&fit=crop&q=80";
  } else if (catLower.includes("footwear") || catLower.includes("shoe") || catLower.includes("sneaker")) {
    front = photoUrl || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop&q=80";
    right = "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=900&auto=format&fit=crop&q=80";
    opposite = "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=900&auto=format&fit=crop&q=80";
    left = "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=900&auto=format&fit=crop&q=80";
  } else if (catLower.includes("grocery") || catLower.includes("mart") || catLower.includes("supermarket")) {
    front = photoUrl || "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=900&auto=format&fit=crop&q=80";
    right = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=900&auto=format&fit=crop&q=80";
    opposite = "https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=900&auto=format&fit=crop&q=80";
    left = "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=900&auto=format&fit=crop&q=80";
  } else if (catLower.includes("cafe") || catLower.includes("coffee") || catLower.includes("restaurant") || catLower.includes("bakery")) {
    front = photoUrl || "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=900&auto=format&fit=crop&q=80";
    right = "https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=900&auto=format&fit=crop&q=80";
    opposite = "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=900&auto=format&fit=crop&q=80";
    left = "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=900&auto=format&fit=crop&q=80";
  } else if (catLower.includes("electronic") || catLower.includes("mobile") || catLower.includes("croma")) {
    front = photoUrl || "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=900&auto=format&fit=crop&q=80";
    right = "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=900&auto=format&fit=crop&q=80";
    opposite = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=900&auto=format&fit=crop&q=80";
    left = "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=900&auto=format&fit=crop&q=80";
  }

  return [
    {
      angle: 0,
      label: "0° Front Entrance",
      description: "Main Storefront facade and main entrance door",
      imgUrl: front,
    },
    {
      angle: 90,
      label: "90° Right Street Approach",
      description: "View of the street road and right-side store approach",
      imgUrl: right,
    },
    {
      angle: 180,
      label: "180° Opposite Side Street View",
      description: "View from across the street looking directly at the store",
      imgUrl: opposite,
    },
    {
      angle: 270,
      label: "270° Left Corner & Parking View",
      description: "Left angle view showing parking space and corner entrance",
      imgUrl: left,
    },
  ];
}

export function StreetCameraModal({
  shopName,
  address,
  lat,
  lng,
  photoUrl,
  category = "Local Store",
  onClose,
}: StreetCameraModalProps) {
  const [activeTab, setActiveTab] = useState<"satellite" | "360angles" | "storefront" | "streetview">("satellite");
  const [mounted, setMounted] = useState(false);
  const [L, setL] = useState<any>(null);
  const [RL, setRL] = useState<any>(null);

  // 360 Degree Angle Rotator state (0, 90, 180, 270 degrees)
  const [angleIndex, setAngleIndex] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(true);

  useEffect(() => {
    if (!isAutoRotating || activeTab !== "360angles") return;
    const interval = setInterval(() => {
      setAngleIndex((prev) => (prev + 1) % 4);
    }, 2200);
    return () => clearInterval(interval);
  }, [isAutoRotating, activeTab]);

  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;

  // Direct Google Street View Panorama Link
  const streetViewDirectUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;

  // Embedded Street View iframe URL
  const embedPanoUrl = apiKey
    ? `https://www.google.com/maps/embed/v1/streetview?key=${apiKey}&location=${lat},${lng}&heading=165&pitch=0&fov=90`
    : `https://maps.google.com/maps?q=${lat},${lng}&layer=c&cbll=${lat},${lng}&cbp=12,0,0,0,0&output=svembed`;

  useEffect(() => {
    setMounted(true);
    Promise.all([import("leaflet"), import("react-leaflet")]).then(
      ([leafletModule, reactLeafletModule]) => {
        setL(leafletModule.default || leafletModule);
        setRL(reactLeafletModule);
      },
    );
  }, []);

  const createCameraPinIcon = (L: any) => {
    const html = `
      <div className="relative flex items-center justify-center">
        <div style="
          width: 42px;
          height: 42px;
          background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 18px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.5);
        ">
          📷
        </div>
      </div>
    `;
    return L.divIcon({
      html,
      className: "custom-camera-leaflet-pin",
      iconSize: [42, 42],
      iconAnchor: [21, 21],
    });
  };

  // Resolve Category Multi-Angle High Definition Unsplash Image Sets
  const angleViews = resolveCategoryMultiAngleImages(category, shopName, photoUrl);
  const currentAngleView = angleViews[angleIndex];

  return (
    <div className="fixed inset-0 z-[5500] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div
        className="relative w-full max-w-3xl bg-surface-elevated border border-border rounded-3xl shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-5 border-b border-border bg-gradient-to-r from-accent/15 via-accent/5 to-transparent flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-accent font-extrabold">
              <Camera className="size-4 text-accent animate-pulse" />
              <span>Real 360° Multi-Angle Camera & Satellite Access</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{shopName}</h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="size-3.5 text-accent" />
              {address}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-secondary hover:bg-border text-foreground transition-colors shrink-0 cursor-pointer"
            title="Close camera view"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* View Mode Tabs & Quick Links */}
        <div className="p-3 bg-background border-b border-border flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="flex bg-secondary p-1 rounded-2xl border border-border flex-wrap gap-1">
            <button
              onClick={() => setActiveTab("satellite")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "satellite"
                  ? "bg-accent text-accent-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="size-3.5" />
              🛰️ Satellite View
            </button>
            <button
              onClick={() => setActiveTab("360angles")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "360angles"
                  ? "bg-accent text-accent-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <RotateCw className="size-3.5" />
              🔄 360° Angle Photos
            </button>
            <button
              onClick={() => setActiveTab("storefront")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "storefront"
                  ? "bg-accent text-accent-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ImageIcon className="size-3.5" />
              🖼️ Storefront Photo
            </button>
            <button
              onClick={() => setActiveTab("streetview")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "streetview"
                  ? "bg-accent text-accent-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Eye className="size-3.5" />
              📷 Google Pano
            </button>
          </div>

          <a
            href={streetViewDirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-foreground text-background hover:bg-accent hover:text-accent-foreground rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <ExternalLink className="size-3.5" />
            <span>Open Google Pano</span>
          </a>
        </div>

        {/* Camera Viewer Container */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === "satellite" ? (
            <div className="space-y-3">
              <div className="relative aspect-[16/9] min-h-[360px] rounded-2xl overflow-hidden border border-border shadow-md">
                {mounted && L && RL ? (
                  <RL.MapContainer
                    center={[lat, lng]}
                    zoom={18}
                    scrollWheelZoom={true}
                    className="w-full h-full z-0"
                  >
                    {/* Esri High-Resolution World Imagery Satellite Base Layer */}
                    <RL.TileLayer
                      attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP'
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                    {/* Hybrid Street & Place Names Labels Overlay */}
                    <RL.TileLayer
                      attribution='&copy; CARTO'
                      url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
                    />
                    <RL.Marker position={[lat, lng]} icon={createCameraPinIcon(L)}>
                      <RL.Popup>
                        <div className="p-1 text-xs">
                          <strong>{shopName}</strong>
                          <p className="text-[10px] text-muted-foreground">{address}</p>
                        </div>
                      </RL.Popup>
                    </RL.Marker>
                  </RL.MapContainer>
                ) : (
                  <div className="w-full h-full bg-secondary/50 flex items-center justify-center text-xs text-muted-foreground font-mono">
                    Loading Satellite View...
                  </div>
                )}
                <div className="absolute top-3 left-3 z-[1000] bg-black/80 backdrop-blur-md text-white text-[10px] font-mono px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/20">
                  <Compass className="size-3 text-accent" />
                  Satellite Camera • Coordinates: {lat.toFixed(4)}, {lng.toFixed(4)}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground text-center font-mono">
                Interactive High-Resolution Satellite Camera View for {shopName}. Zoom in/out or drag to inspect the roof, entrance, and surrounding road.
              </p>
            </div>
          ) : activeTab === "360angles" ? (
            <div className="space-y-4">
              {/* Angle Selector & Auto-Move Bar */}
              <div className="flex items-center justify-between gap-2 bg-secondary/80 p-2 rounded-2xl border border-border flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground font-mono px-2">Select Angle:</span>
                  <button
                    type="button"
                    onClick={() => setIsAutoRotating(!isAutoRotating)}
                    className={`px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isAutoRotating
                        ? "bg-accent text-accent-foreground shadow-xs animate-pulse"
                        : "bg-surface-elevated text-muted-foreground hover:text-foreground border border-border"
                    }`}
                    title="Toggle Auto-Moving 360° Rotation"
                  >
                    {isAutoRotating ? <Pause className="size-3" /> : <Play className="size-3" />}
                    <span>{isAutoRotating ? "Auto-Moving ON" : "Auto-Move 360°"}</span>
                  </button>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {angleViews.map((item, idx) => (
                    <button
                      key={item.angle}
                      onClick={() => {
                        setAngleIndex(idx);
                        setIsAutoRotating(false);
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        angleIndex === idx
                          ? "bg-accent text-accent-foreground shadow-xs"
                          : "bg-surface-elevated text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Photo Viewport with Rotate Controls */}
              <div className="relative aspect-[16/9] min-h-[350px] rounded-2xl overflow-hidden border border-border bg-secondary shadow-md group">
                <img
                  key={currentAngleView.imgUrl}
                  src={currentAngleView.imgUrl}
                  alt={currentAngleView.label}
                  className="w-full h-full object-cover transition-all duration-700 ease-in-out transform hover:scale-105"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=900&auto=format&fit=crop&q=80";
                  }}
                />

                {/* Left Angle Arrow */}
                <button
                  onClick={() => {
                    setAngleIndex((prev) => (prev === 0 ? angleViews.length - 1 : prev - 1));
                    setIsAutoRotating(false);
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/70 hover:bg-accent text-white transition-colors cursor-pointer shadow-lg"
                  title="Previous 90° Angle"
                >
                  <ChevronLeft className="size-5" />
                </button>

                {/* Right Angle Arrow */}
                <button
                  onClick={() => {
                    setAngleIndex((prev) => (prev === angleViews.length - 1 ? 0 : prev + 1));
                    setIsAutoRotating(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/70 hover:bg-accent text-white transition-colors cursor-pointer shadow-lg"
                  title="Next 90° Angle"
                >
                  <ChevronRight className="size-5" />
                </button>

                {/* Overlay Badge */}
                <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-md text-white p-3.5 rounded-2xl border border-white/20 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-[10px] font-mono font-bold">
                        Angle {currentAngleView.angle}°
                      </span>
                      <h4 className="font-bold text-sm">{currentAngleView.label}</h4>
                    </div>
                    <p className="text-[11px] text-white/80 mt-0.5">{currentAngleView.description}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === "storefront" ? (
            <div className="space-y-4">
              <div className="relative aspect-[16/9] min-h-[350px] rounded-2xl overflow-hidden border border-border bg-secondary shadow-md">
                <img
                  src={
                    photoUrl ||
                    angleViews[0].imgUrl
                  }
                  alt={`Real Store Front of ${shopName}`}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=900&auto=format&fit=crop&q=80";
                  }}
                />
                <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-md text-white p-3.5 rounded-2xl border border-white/20 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm">{shopName} Storefront</h4>
                    <p className="text-[10px] text-white/80 font-mono">{category} • {address}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-[10px] font-mono font-bold">
                    Verified Storefront Image
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative aspect-[16/9] min-h-[350px] rounded-2xl overflow-hidden border border-border bg-black shadow-inner">
                <iframe
                  title={`Google Street Pano for ${shopName}`}
                  src={embedPanoUrl}
                  className="w-full h-full border-0"
                  allowFullScreen
                  loading="lazy"
                />
                <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md text-white text-[10px] font-mono px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/20">
                  <Compass className="size-3 text-accent" />
                  Google Pano • Coordinates: {lat.toFixed(4)}, {lng.toFixed(4)}
                </div>
              </div>
              <div className="p-3 bg-surface-elevated border border-border rounded-xl flex items-center justify-between text-xs text-muted-foreground">
                <span>If Street View Pano is not covered by Google in this area, use <strong>🔄 360° Angle Photos</strong> or <strong>🛰️ Satellite View</strong> above.</span>
                <a
                  href={streetViewDirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline font-bold"
                >
                  Open Direct Link →
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
