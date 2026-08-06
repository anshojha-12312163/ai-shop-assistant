import { useState, useEffect } from "react";
import { Navigation, Car, Footprints, ExternalLink, ChevronDown, ChevronUp, MapPin, Clock, Compass } from "lucide-react";
import { toast } from "sonner";

interface MapRoutingViewProps {
  userLocation: { lat: number; lng: number; label?: string };
  destination: { lat: number; lng: number; name: string; address?: string };
}

interface RouteStep {
  instruction: string;
  distanceMiles: number;
}

export function MapRoutingView({ userLocation, destination }: MapRoutingViewProps) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<"driving" | "walking">("driving");
  const [loading, setLoading] = useState(true);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [distanceMiles, setDistanceMiles] = useState<number>(0);
  const [durationMins, setDurationMins] = useState<number>(0);
  const [steps, setSteps] = useState<RouteStep[]>([]);
  const [showSteps, setShowSteps] = useState(false);

  // Client-side Leaflet dynamic imports
  const [L, setL] = useState<any>(null);
  const [RL, setRL] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    Promise.all([import("leaflet"), import("react-leaflet")]).then(([leafletModule, reactLeafletModule]) => {
      setL(leafletModule.default || leafletModule);
      setRL(reactLeafletModule);
    });
  }, []);

  // Fetch route geometry and turn-by-turn steps from OSRM
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const profile = mode === "driving" ? "driving" : "foot";
    const url = `https://router.project-osrm.org/route/v1/${profile}/${userLocation.lng},${userLocation.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coords: [number, number][] = route.geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]]
          );

          setRouteCoords(coords);
          setDistanceMiles(Math.round((route.distance / 1609.34) * 10) / 10);
          setDurationMins(Math.max(1, Math.round(route.duration / 60)));

          const parsedSteps: RouteStep[] = [];
          if (route.legs && route.legs[0] && route.legs[0].steps) {
            route.legs[0].steps.forEach((st: any) => {
              if (st.maneuver && st.name !== undefined) {
                const type = st.maneuver.type ?? "";
                const modifier = st.maneuver.modifier ?? "";
                const roadName = st.name ? `onto ${st.name}` : "";
                let inst = `${type} ${modifier} ${roadName}`.trim();

                if (type === "depart") inst = `Head ${modifier || "ahead"} ${roadName}`;
                else if (type === "arrive") inst = `Arrive at ${destination.name}`;

                inst = inst.charAt(0).toUpperCase() + inst.slice(1);
                parsedSteps.push({
                  instruction: inst,
                  distanceMiles: Math.round((st.distance / 1609.34) * 10) / 10,
                });
              }
            });
          }

          setSteps(parsedSteps);
        } else {
          // Direct line fallback if OSRM returns empty
          setRouteCoords([
            [userLocation.lat, userLocation.lng],
            [destination.lat, destination.lng],
          ]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn("OSRM routing error fallback:", err);
        if (!cancelled) {
          setRouteCoords([
            [userLocation.lat, userLocation.lng],
            [destination.lat, destination.lng],
          ]);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userLocation.lat, userLocation.lng, destination.lat, destination.lng, mode]);

  if (!mounted || !L || !RL) {
    return (
      <div className="h-64 bg-secondary/50 rounded-2xl flex items-center justify-center text-xs text-muted-foreground font-mono">
        Loading interactive routing engine...
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } = RL;

  // Custom User Pulsing Icon
  const userIcon = L.divIcon({
    className: "user-location-marker",
    html: `
      <div style="
        width: 20px;
        height: 20px;
        background: #3B82F6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.4);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  // Custom Destination Pin Icon
  const shopIcon = L.divIcon({
    className: "shop-destination-marker",
    html: `
      <div style="
        width: 34px;
        height: 34px;
        background: #0D9488;
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
  });

  // Helper component to auto-fit bounds
  function MapBoundsFitter({ coords }: { coords: [number, number][] }) {
    const map = useMap();
    useEffect(() => {
      if (coords.length > 0) {
        const bounds = L.latLngBounds(coords);
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    }, [coords, map]);
    return null;
  }

  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${destination.lat},${destination.lng}&travelmode=${mode}`;

  return (
    <div className="space-y-4">
      {/* Route Mode & Stats Header Bar */}
      <div className="bg-surface-elevated border border-border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex bg-secondary p-1 rounded-full border border-border">
            <button
              onClick={() => setMode("driving")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                mode === "driving"
                  ? "bg-foreground text-background shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Car className="size-3.5" />
              Driving
            </button>
            <button
              onClick={() => setMode("walking")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                mode === "walking"
                  ? "bg-foreground text-background shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Footprints className="size-3.5" />
              Walking
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1 text-foreground font-bold">
            <Clock className="size-3.5 text-accent" />
            {loading ? "Calculating..." : `${durationMins} mins`}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Compass className="size-3.5 text-accent" />
            {distanceMiles} miles
          </span>
        </div>

        <a
          href={googleMapsDirectionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-1.5 bg-accent text-accent-foreground hover:bg-accent/90 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <ExternalLink className="size-3.5" />
          Native Navigation
        </a>
      </div>

      {/* Interactive Routed Leaflet Map Container */}
      <div className="relative aspect-[16/9] min-h-[300px] rounded-2xl overflow-hidden border border-border shadow-inner">
        <MapContainer
          center={[userLocation.lat, userLocation.lng]}
          zoom={13}
          scrollWheelZoom={false}
          className="w-full h-full z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* User Location Marker */}
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <div className="p-1 text-xs">
                <strong>Your Location</strong>
                <p className="text-[10px] text-muted-foreground">{userLocation.label || "Starting Point"}</p>
              </div>
            </Popup>
          </Marker>

          {/* Shop Destination Marker */}
          <Marker position={[destination.lat, destination.lng]} icon={shopIcon}>
            <Popup>
              <div className="p-1 text-xs">
                <strong>{destination.name}</strong>
                <p className="text-[10px] text-muted-foreground">{destination.address}</p>
              </div>
            </Popup>
          </Marker>

          {/* Polyline Route Line */}
          {routeCoords.length > 0 && (
            <Polyline
              positions={routeCoords}
              color="#0D9488"
              weight={5}
              opacity={0.8}
              dashArray={mode === "walking" ? "8, 8" : undefined}
            />
          )}

          <MapBoundsFitter coords={[[userLocation.lat, userLocation.lng], [destination.lat, destination.lng]]} />
        </MapContainer>
      </div>

      {/* Collapsible Turn-by-Turn Directions List */}
      {steps.length > 0 && (
        <div className="bg-surface-elevated border border-border rounded-2xl overflow-hidden transition-all">
          <button
            onClick={() => setShowSteps(!showSteps)}
            className="w-full p-4 flex items-center justify-between text-xs font-mono uppercase tracking-widest font-bold text-accent hover:bg-secondary/40 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Navigation className="size-4" />
              Turn-by-Turn Directions ({steps.length} steps)
            </span>
            {showSteps ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>

          {showSteps && (
            <div className="p-4 pt-0 border-t border-border/60 space-y-2 max-h-60 overflow-y-auto">
              {steps.map((st, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs p-2 rounded-xl hover:bg-secondary/30 transition-colors">
                  <span className="size-5 rounded-full bg-accent/15 text-accent font-bold font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{st.instruction}</p>
                    {st.distanceMiles > 0 && (
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        for {st.distanceMiles} miles
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
