import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Nav } from "@/components/marketplace/Nav";
import { Footer } from "@/components/marketplace/Footer";
import { ShopCard } from "@/components/marketplace/ShopCard";
import { ShopDetailModal } from "@/components/marketplace/ShopDetailModal";
import type { ShopResultItem } from "@/lib/ai.functions";
import {
  User,
  Mail,
  Save,
  LogOut,
  Loader2,
  Heart,
  History,
  Trash2,
  Search,
  MapPin,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "User Profile — Synthetix" }] }),
  component: ProfilePage,
});

interface FavoriteRow {
  id: string;
  shop_id: string;
  shop_name: string;
  shop_image: string | null;
  shop_category: string;
  shop_rating: number;
  created_at: string;
}

interface SearchHistoryRow {
  id: string;
  query_text: string;
  location_label: string | null;
  result_count: number;
  created_at: string;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mins ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
  if (diffSec < 172800) return "Yesterday";
  return `${Math.floor(diffSec / 86400)} days ago`;
}

function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [roles, setRoles] = useState<string[]>([]);

  // Favorites & Search History State
  const [favorites, setFavorites] = useState<FavoriteRow[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryRow[]>([]);
  const [activeTab, setActiveTab] = useState<"profile" | "favorites" | "history">("favorites");
  const [detailModalPlaceId, setDetailModalPlaceId] = useState<string | null>(null);
  const [isClearingHistory, setIsClearingHistory] = useState(false);

  const navigate = useNavigate();

  async function loadAllData() {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) {
      navigate({ to: "/auth" });
      return;
    }

    setUserEmail(user.email ?? "");
    setUserId(user.id);

    const [profileRes, rolesRes, favsRes, historyRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", user.id),
      supabase.from("favorites").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("search_history").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);

    if (profileRes.data) {
      setDisplayName(profileRes.data.display_name ?? user.email?.split("@")[0] ?? "");
      setBio(profileRes.data.bio ?? "");
      setAvatarUrl(profileRes.data.avatar_url ?? "");
    } else {
      setDisplayName(user.email?.split("@")[0] ?? "");
    }

    if (rolesRes.data) {
      setRoles(rolesRes.data.map((r) => r.role));
    }

    if (favsRes.data) {
      setFavorites(favsRes.data as FavoriteRow[]);
    }

    if (historyRes.data) {
      setSearchHistory(historyRes.data as SearchHistoryRow[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadAllData();
  }, [navigate]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").upsert({
        id: userId,
        display_name: displayName,
        bio,
        avatar_url: avatarUrl,
      });

      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveFavorite(shopId: string) {
    if (!userId) return;
    setFavorites((prev) => prev.filter((f) => f.shop_id !== shopId));

    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("shop_id", shopId);

      if (error) throw error;
      toast.success("Removed from favorites");
    } catch (err) {
      loadAllData();
      toast.error("Could not remove favorite");
    }
  }

  async function handleClearHistory() {
    if (!userId) return;
    if (!confirm("Are you sure you want to clear your search history? This cannot be undone.")) return;

    setIsClearingHistory(true);
    try {
      const { error } = await supabase.from("search_history").delete().eq("user_id", userId);
      if (error) throw error;

      setSearchHistory([]);
      toast.success("Search history cleared!");
    } catch (err) {
      toast.error("Failed to clear search history");
    } finally {
      setIsClearingHistory(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <Nav />

      {/* Shop Detail Modal */}
      <ShopDetailModal
        placeId={detailModalPlaceId}
        onClose={() => setDetailModalPlaceId(null)}
      />

      <main className="max-w-4xl mx-auto px-6 pt-10 pb-24 w-full">
        {loading ? (
          <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="size-8 text-accent animate-spin" />
            <span className="font-mono text-xs text-muted-foreground">Loading Account & Saved Data...</span>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            {/* Header Profile Banner */}
            <div className="bg-surface-elevated border border-border rounded-3xl p-6 md:p-8 shadow-xl flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="size-20 rounded-full bg-accent/20 border-2 border-accent/40 flex items-center justify-center text-accent font-bold text-2xl shadow-inner shrink-0 overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    displayName.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{displayName}</h1>
                  <p className="text-xs text-muted-foreground font-mono flex items-center gap-1.5 mt-1">
                    <Mail className="size-3.5 text-accent" />
                    {userEmail}
                  </p>
                  {bio && <p className="text-xs text-muted-foreground mt-2 italic max-w-md">"{bio}"</p>}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {roles.map((r) => (
                  <span
                    key={r}
                    className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-accent/15 text-accent border border-accent/30"
                  >
                    {r}
                  </span>
                ))}
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 border border-border hover:bg-rose-500/10 hover:text-rose-600 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <LogOut className="size-3.5" />
                  Sign out
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 p-1 bg-secondary rounded-full max-w-md border border-border">
              <button
                onClick={() => setActiveTab("favorites")}
                className={`flex-1 py-2.5 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === "favorites"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Heart className={`size-3.5 ${activeTab === "favorites" ? "fill-rose-500 text-rose-500" : ""}`} />
                Saved Shops ({favorites.length})
              </button>

              <button
                onClick={() => setActiveTab("history")}
                className={`flex-1 py-2.5 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === "history"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <History className="size-3.5 text-accent" />
                Search History ({searchHistory.length})
              </button>

              <button
                onClick={() => setActiveTab("profile")}
                className={`flex-1 py-2.5 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === "profile"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <User className="size-3.5" />
                Settings
              </button>
            </div>

            {/* ── TAB 1: FAVORITES ── */}
            {activeTab === "favorites" && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                    <Heart className="size-5 text-rose-500 fill-rose-500" />
                    Your Saved Favorite Shops
                  </h2>
                  <span className="font-mono text-xs text-muted-foreground">
                    {favorites.length} {favorites.length === 1 ? "shop" : "shops"} saved
                  </span>
                </div>

                {favorites.length === 0 ? (
                  <div className="p-12 border-2 border-dashed border-border rounded-3xl text-center space-y-3 bg-surface-elevated">
                    <div className="size-14 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                      <Heart className="size-7" />
                    </div>
                    <h3 className="text-lg font-bold">No favorites saved yet</h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                      Tap the heart icon on any shop card in the AI Assistant or Discover page to save it here for quick access!
                    </p>
                    <button
                      onClick={() => navigate({ to: "/discover" })}
                      className="px-6 py-2.5 bg-foreground text-background hover:bg-accent hover:text-accent-foreground text-xs font-bold rounded-full transition-colors inline-flex items-center gap-2 mt-2"
                    >
                      <Sparkles className="size-4" />
                      Explore Shops & AI Assistant
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {favorites.map((fav) => {
                      const shopItem: ShopResultItem = {
                        id: fav.shop_id,
                        place_id: fav.shop_id,
                        name: fav.shop_name,
                        category: fav.shop_category,
                        description: `Saved favorite merchant (${fav.shop_category})`,
                        address: "Saved in your profile favorites",
                        lat: 47.6062,
                        lng: -122.3321,
                        rating: fav.shop_rating,
                        review_count: 50,
                        open_now: true,
                        image_url: fav.shop_image,
                      };

                      return (
                        <ShopCard
                          key={fav.id}
                          shop={shopItem}
                          isFavorite={true}
                          onToggleFavorite={() => handleRemoveFavorite(fav.shop_id)}
                          onViewDetails={(placeId) => setDetailModalPlaceId(placeId)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 2: SEARCH HISTORY ── */}
            {activeTab === "history" && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                    <History className="size-5 text-accent" />
                    Recent Search History
                  </h2>
                  {searchHistory.length > 0 && (
                    <button
                      onClick={handleClearHistory}
                      disabled={isClearingHistory}
                      className="px-3.5 py-1.5 text-xs text-rose-600 border border-rose-500/30 hover:bg-rose-500/10 rounded-full font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="size-3.5" />
                      Clear History
                    </button>
                  )}
                </div>

                {searchHistory.length === 0 ? (
                  <div className="p-12 border-2 border-dashed border-border rounded-3xl text-center space-y-3 bg-surface-elevated">
                    <div className="size-14 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto">
                      <Search className="size-7" />
                    </div>
                    <h3 className="text-lg font-bold">No search history recorded</h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                      Your searches in the AI Assistant and marketplace search bar will automatically appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {searchHistory.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => navigate({ to: "/discover", search: { q: item.query_text } })}
                        className="group bg-surface-elevated p-4 border border-border hover:border-accent rounded-2xl transition-all shadow-sm hover:shadow-md cursor-pointer flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-secondary group-hover:bg-accent/15 group-hover:text-accent flex items-center justify-center text-muted-foreground transition-colors shrink-0">
                            <Search className="size-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-foreground group-hover:text-accent transition-colors flex items-center gap-2">
                              "{item.query_text}"
                              <ExternalLink className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 font-mono">
                              {item.location_label && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="size-3 text-accent" />
                                  {item.location_label}
                                </span>
                              )}
                              <span>•</span>
                              <span>{item.result_count} results</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                            <Clock className="size-3" />
                            {formatRelativeTime(item.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 3: ACCOUNT SETTINGS ── */}
            {activeTab === "profile" && (
              <div className="bg-surface-elevated border border-border rounded-3xl p-8 shadow-xl animate-fade-in">
                <h2 className="text-xl font-bold tracking-tight mb-6">Edit Profile Details</h2>
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs uppercase font-mono tracking-widest text-muted-foreground block mb-1.5">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your name"
                        className="w-full px-4 py-2.5 border border-border rounded-xl bg-background text-sm outline-none focus:border-accent transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs uppercase font-mono tracking-widest text-muted-foreground block mb-1.5">
                        Bio / Short Description
                      </label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="A short note about yourself or your artisan interests..."
                        rows={3}
                        className="w-full px-4 py-2.5 border border-border rounded-xl bg-background text-sm outline-none focus:border-accent transition-colors resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs uppercase font-mono tracking-widest text-muted-foreground block mb-1.5">
                        Avatar Image URL
                      </label>
                      <input
                        type="url"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://example.com/avatar.jpg"
                        className="w-full px-4 py-2.5 border border-border rounded-xl bg-background text-sm outline-none focus:border-accent transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-border">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-7 py-2.5 bg-foreground text-background hover:bg-accent hover:text-accent-foreground rounded-full text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                      Save Profile
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
