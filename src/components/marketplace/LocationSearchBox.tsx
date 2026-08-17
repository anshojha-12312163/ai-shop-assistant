import { useState, useEffect, useRef } from "react";
import { MapPin, Navigation, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface LocationState {
  lat: number;
  lng: number;
  label: string;
  isGPS: boolean;
}

interface LocationSearchBoxProps {
  currentLocation: LocationState;
  onLocationChange: (loc: LocationState) => void;
  className?: string;
}

interface Suggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export function LocationSearchBox({
  currentLocation,
  onLocationChange,
  className = "",
}: LocationSearchBoxProps) {
  const [query, setQuery] = useState(currentLocation.label);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync query label with currentLocation prop changes
  useEffect(() => {
    setQuery(currentLocation.label);
  }, [currentLocation.label]);

  // Debounced autocomplete search using Nominatim
  useEffect(() => {
    if (!query || query.trim().length < 2 || !isOpen) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query,
        )}&format=json&limit=5&addressdetails=1`;
        const res = await fetch(url, {
          headers: { "User-Agent": "SynthetixAIShopAssistant/1.0" },
        });
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data || []);
        }
      } catch (err) {
        console.warn("Location autocomplete error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelectSuggestion(s: Suggestion) {
    const shortLabel = s.display_name.split(",").slice(0, 2).join(", ");
    const newLoc: LocationState = {
      lat: parseFloat(s.lat),
      lng: parseFloat(s.lon),
      label: shortLabel,
      isGPS: false,
    };
    setQuery(shortLabel);
    setIsOpen(false);
    onLocationChange(newLoc);
    toast.success(`Location set to ${shortLabel}`);
  }

  function handleUseGPS() {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocatingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingGPS(false);
        const newLoc: LocationState = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "Your Current Location",
          isGPS: true,
        };
        setQuery("Your Current Location");
        setIsOpen(false);
        onLocationChange(newLoc);
        toast.success("Location updated via GPS!");
      },
      (err) => {
        setIsLocatingGPS(false);
        toast.error("Could not fetch GPS permission: " + err.message);
      },
      { timeout: 8000, enableHighAccuracy: true },
    );
  }

  return (
    <div ref={containerRef} className={`relative flex items-center gap-2 ${className}`}>
      {/* Input Field with Icon */}
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          {currentLocation.isGPS ? (
            <Navigation className="size-4 text-accent fill-accent/20 animate-pulse" />
          ) : (
            <MapPin className="size-4 text-accent" />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search city, area, or address..."
          className="w-full pl-10 pr-9 py-2 bg-background border border-border rounded-full text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all shadow-sm"
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Loader2 className="size-3.5 text-muted-foreground animate-spin" />
          </div>
        )}
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-popover text-popover-foreground border border-border rounded-2xl shadow-xl z-[2000] overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground border-b border-border/50">
            Suggested Locations
          </div>
          {suggestions.map((s) => (
            <button
              key={s.place_id}
              onClick={() => handleSelectSuggestion(s)}
              className="w-full px-3.5 py-2.5 text-left text-xs hover:bg-accent/10 flex items-start gap-2.5 transition-colors"
            >
              <MapPin className="size-3.5 text-accent mt-0.5 shrink-0" />
              <span className="line-clamp-2 leading-relaxed">{s.display_name}</span>
            </button>
          ))}
        </div>
      )}

      {/* GPS Trigger Button */}
      <button
        onClick={handleUseGPS}
        disabled={isLocatingGPS}
        title="Use my current device GPS location"
        className={`px-3.5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shrink-0 border ${
          currentLocation.isGPS
            ? "bg-accent text-accent-foreground border-accent"
            : "bg-surface-elevated text-foreground border-border hover:bg-secondary"
        }`}
      >
        {isLocatingGPS ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Navigation className="size-3.5" />
        )}
        <span className="hidden sm:inline">Use GPS</span>
      </button>
    </div>
  );
}
