import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Store,
  Boxes,
  TrendingUp,
  Clock,
  ShieldCheck,
  Zap,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Search,
  Plus,
  RefreshCw,
  Sparkles,
  Phone,
  BarChart3,
  CreditCard,
  Building2,
  MapPin,
  ExternalLink,
  ChevronRight,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Nav } from "@/components/marketplace/Nav";
import { Footer } from "@/components/marketplace/Footer";
import { formatPrice } from "@/lib/cart";

export const Route = createFileRoute("/merchant")({
  head: () => ({
    meta: [
      { title: "Merchant Dashboard — Synthetix" },
      { name: "description", content: "Self-report inventory, manage reservations, and track search leads." },
    ],
  }),
  component: MerchantDashboardPage,
});

interface MerchantProfile {
  id: string;
  shop_id: string | null;
  business_name: string;
  phone: string | null;
  whatsapp_number: string | null;
  subscription_tier: "free" | "pro";
  subscription_status: string;
}

interface InventoryItem {
  id: string;
  shop_id: string;
  product_name: string;
  category: string;
  price: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
  image_url: string | null;
  updated_at: string;
}

interface Reservation {
  id: string;
  customer_id: string;
  inventory_item_id: string;
  status: "pending" | "confirmed" | "expired" | "completed" | "cancelled";
  created_at: string;
  expires_at: string;
  product_name?: string;
  price?: number;
}

interface SearchLead {
  id: string;
  query_text: string;
  created_at: string;
}

function MerchantDashboardPage() {
  const [merchant, setMerchant] = useState<MerchantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "onboarding" | "inventory" | "leads" | "reservations" | "reviews" | "analytics" | "billing"
  >("inventory");

  // Onboarding state
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [availableShops, setAvailableShops] = useState<any[]>([]);

  // Inventory & Data states
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [leads, setLeads] = useState<SearchLead[]>([]);
  const [merchantReviews, setMerchantReviews] = useState<any[]>([]);
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [submittingReplyId, setSubmittingReplyId] = useState<string | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Footwear");
  const [newItemPrice, setNewItemPrice] = useState("1499");
  const [newItemStatus, setNewItemStatus] = useState<"in_stock" | "low_stock">("in_stock");

  const navigate = useNavigate();

  useEffect(() => {
    fetchMerchantSession();
  }, []);

  const fetchMerchantSession = async () => {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setLoading(false);
        return;
      }

      // Check if merchant row exists
      const { data: mData } = await (supabase as any)
        .from("merchants")
        .select("*")
        .eq("id", auth.user.id)
        .maybeSingle();

      if (mData) {
        setMerchant(mData);
        setActiveTab("inventory");
        fetchMerchantData(mData.shop_id);
      } else {
        // Fetch shops list for onboarding
        const { data: shops } = await supabase.from("shops").select("id, name, address").limit(20);
        setAvailableShops(shops || []);
        setActiveTab("onboarding");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to load merchant account.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMerchantData = async (shopId: string | null) => {
    if (!shopId) return;

    // Fetch Inventory
    let { data: inv } = await (supabase as any)
      .from("inventory_items")
      .select("*")
      .eq("shop_id", shopId)
      .order("updated_at", { ascending: false });

    // Auto-seed initial real items if shop inventory is brand new
    if (!inv || inv.length === 0) {
      const nowIso = new Date().toISOString();
      const initialSeed = [
        {
          shop_id: shopId,
          product_name: "Zudio Casual Streetwear Sneakers",
          category: "Footwear",
          price: 1499,
          status: "in_stock",
          updated_at: nowIso,
        },
        {
          shop_id: shopId,
          product_name: "Handcrafted Heritage Leather Backpack",
          category: "Outdoor Gear",
          price: 3499,
          status: "in_stock",
          updated_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        },
        {
          shop_id: shopId,
          product_name: "Organic French Linen Bedding Set",
          category: "Home Goods",
          price: 4999,
          status: "low_stock",
          updated_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        },
      ];

      const { data: seeded } = await (supabase as any)
        .from("inventory_items")
        .insert(initialSeed)
        .select();

      inv = seeded || initialSeed;
    }

    setInventory(inv || []);

    // Fetch Reservations
    const { data: res } = await (supabase as any)
      .from("reservations")
      .select("*")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false });

    // Join with inventory product names
    const enrichedRes = (res || []).map((r: any) => {
      const match = inv?.find((i: any) => i.id === r.inventory_item_id);
      return {
        ...r,
        product_name: match?.product_name || "Reserved Item",
        price: match?.price || 0,
      };
    });
    setReservations(enrichedRes);

    // Fetch Leads
    const { data: lds } = await (supabase as any)
      .from("search_leads")
      .select("*")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false });
    setLeads(lds || []);

    // Fetch Shop Reviews
    try {
      const { data: revs } = await (supabase as any)
        .from("shop_reviews")
        .select("*")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false });
      setMerchantReviews(revs || []);
    } catch (err) {
      console.warn("Error fetching merchant reviews:", err);
    }
  };

  const handleMerchantReplySubmit = async (reviewId: string) => {
    const reply = replyTextMap[reviewId]?.trim();
    if (!reply) {
      toast.error("Please enter a reply message.");
      return;
    }
    setSubmittingReplyId(reviewId);
    try {
      const { error } = await (supabase as any)
        .from("shop_reviews")
        .update({ merchant_reply: reply, updated_at: new Date().toISOString() })
        .eq("id", reviewId);

      if (error) throw error;
      toast.success("Merchant reply posted successfully!");
      setMerchantReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, merchant_reply: reply } : r)),
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to post reply.");
    } finally {
      setSubmittingReplyId(null);
    }
  };

  // Onboarding Submit
  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      toast.error("Please sign in to register as a merchant.");
      return;
    }

    try {
      let finalShopId = selectedShopId;
      if (!finalShopId) {
        // Create new shop entry
        const { data: newShop, error: shopErr } = await supabase
          .from("shops")
          .insert({
            name: businessName,
            category: "Retail Shop",
            description: `Verified local store: ${businessName}`,
            address: "Jalandhar, Punjab, India",
            lat: 31.326,
            lng: 75.5762,
            phone: phone,
          })
          .select()
          .single();

        if (shopErr) throw shopErr;
        finalShopId = newShop.id;
      }

      const { data: mData, error: mErr } = await (supabase as any)
        .from("merchants")
        .upsert({
          id: auth.user.id,
          shop_id: finalShopId,
          business_name: businessName,
          phone,
          whatsapp_number: whatsappNumber || phone,
          subscription_tier: "free",
        })
        .select()
        .single();

      if (mErr) throw mErr;

      setMerchant(mData);
      setActiveTab("inventory");
      toast.success("Merchant profile setup complete!");
      fetchMerchantData(finalShopId);
    } catch (err: any) {
      toast.error(err.message || "Onboarding failed.");
    }
  };

  // Update Inventory Item Status / Price
  const handleUpdateItemStatus = async (
    id: string,
    newStatus: "in_stock" | "low_stock" | "out_of_stock",
  ) => {
    const nowIso = new Date().toISOString();
    setInventory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: newStatus, updated_at: nowIso } : item,
      ),
    );

    const { error } = await (supabase as any)
      .from("inventory_items")
      .update({ status: newStatus, updated_at: nowIso })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success("Confidence score updated!");
    }
  };

  // Bulk Quick-Update
  const handleBulkUpdate = async (status: "in_stock" | "out_of_stock") => {
    if (!merchant?.shop_id) return;
    const nowIso = new Date().toISOString();
    setInventory((prev) => prev.map((item) => ({ ...item, status, updated_at: nowIso })));

    const { error } = await (supabase as any)
      .from("inventory_items")
      .update({ status, updated_at: nowIso })
      .eq("shop_id", merchant.shop_id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Bulk updated all items to ${status.replace("_", " ")}!`);
    }
  };

  // Add New Item
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant?.shop_id) return;

    try {
      const { data: auth } = await supabase.auth.getUser();
      const priceNum = parseFloat(newItemPrice) || 0;

      const { data, error } = await (supabase as any)
        .from("inventory_items")
        .insert({
          shop_id: merchant.shop_id,
          product_name: newItemName,
          category: newItemCategory,
          price: priceNum,
          status: newItemStatus,
          updated_at: new Date().toISOString(),
          updated_by: auth.user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      setInventory((prev) => [data, ...prev]);
      setIsAddingItem(false);
      setNewItemName("");
      toast.success(`Added "${newItemName}" to shop inventory!`);
    } catch (e: any) {
      toast.error(e.message || "Failed to add inventory item.");
    }
  };

  // Reservation Actions
  const handleConfirmReservation = async (resId: string) => {
    const { error } = await (supabase as any)
      .from("reservations")
      .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
      .eq("id", resId);

    if (error) {
      toast.error(error.message);
    } else {
      setReservations((prev) =>
        prev.map((r) => (r.id === resId ? { ...r, status: "confirmed" } : r)),
      );
      toast.success("Reservation confirmed!");
    }
  };

  const handleDeclineReservation = async (resId: string) => {
    const { error } = await (supabase as any)
      .from("reservations")
      .update({ status: "cancelled" })
      .eq("id", resId);

    if (error) {
      toast.error(error.message);
    } else {
      setReservations((prev) =>
        prev.map((r) => (r.id === resId ? { ...r, status: "cancelled" } : r)),
      );
      toast.info("Reservation declined.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Nav />

      {/* Header Banner */}
      <div className="bg-surface-elevated border-b border-border py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-foreground text-background flex items-center justify-center font-extrabold shadow-md">
              <Store className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-accent uppercase tracking-widest font-bold">
                  MERCHANT DASHBOARD
                </span>
                {merchant && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[9px] font-bold border border-emerald-500/20 uppercase">
                    {merchant.subscription_tier} tier
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                {merchant?.business_name || "Merchant Portal"}
              </h1>
            </div>
          </div>

          {merchant && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkUpdate("in_stock")}
                className="px-3 py-1.5 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="size-3.5" />
                Mark All In Stock
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full">
        {loading ? (
          <div className="py-20 text-center text-muted-foreground font-mono text-xs">
            Loading merchant profile...
          </div>
        ) : activeTab === "onboarding" ? (
          /* ONBOARDING TAB */
          <div className="max-w-xl mx-auto bg-surface-elevated border border-border rounded-3xl p-8 space-y-6 shadow-lg animate-fade-in">
            <div className="space-y-2 text-center">
              <div className="size-12 rounded-2xl bg-accent/15 text-accent flex items-center justify-center mx-auto border border-accent/20">
                <Building2 className="size-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-foreground">Register Your Shop</h2>
              <p className="text-xs text-muted-foreground">
                Self-report inventory and boost customer trust with live confidence scores.
              </p>
            </div>

            <form onSubmit={handleOnboarding} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zudio Official Outlet — Jalandhar"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-accent focus-visible:ring-2 focus-visible:ring-accent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-accent focus-visible:ring-2 focus-visible:ring-accent"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-accent focus-visible:ring-2 focus-visible:ring-accent"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Link to Existing Shop (Optional)
                </label>
                <select
                  value={selectedShopId || ""}
                  onChange={(e) => setSelectedShopId(e.target.value || null)}
                  className="w-full bg-secondary/50 border border-border rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">-- Create New Shop Entry --</option>
                  {availableShops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.address})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-foreground text-background font-extrabold py-3.5 rounded-2xl text-xs sm:text-sm hover:bg-accent transition-all shadow-md cursor-pointer pt-3"
              >
                Complete Merchant Registration →
              </button>
            </form>
          </div>
        ) : (
          /* DASHBOARD TABS */
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex border-b border-border bg-secondary/40 p-1.5 gap-1 rounded-2xl overflow-x-auto">
              <button
                onClick={() => setActiveTab("inventory")}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "inventory"
                    ? "bg-background text-foreground shadow-xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Boxes className="size-3.5 text-sky-500" />
                Inventory ({inventory.length})
              </button>
              <button
                onClick={() => setActiveTab("leads")}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "leads"
                    ? "bg-background text-foreground shadow-xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <TrendingUp className="size-3.5 text-amber-500" />
                Search Leads ({leads.length})
              </button>
              <button
                onClick={() => setActiveTab("reservations")}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "reservations"
                    ? "bg-background text-foreground shadow-xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Clock className="size-3.5 text-emerald-500" />
                Reservations ({reservations.filter((r) => r.status === "pending").length})
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "reviews"
                    ? "bg-background text-foreground shadow-xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <MessageSquare className="size-3.5 text-rose-500" />
                Customer Reviews ({merchantReviews.length})
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "analytics"
                    ? "bg-background text-foreground shadow-xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BarChart3 className="size-3.5 text-purple-500" />
                Analytics
              </button>
              <button
                onClick={() => setActiveTab("billing")}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "billing"
                    ? "bg-background text-foreground shadow-xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <CreditCard className="size-3.5 text-accent" />
                Pro Billing
              </button>
            </div>

            {/* TAB 1: INVENTORY MANAGER */}
            {activeTab === "inventory" && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Self-Reported Inventory</h3>
                    <p className="text-xs text-muted-foreground">
                      Updating stock status refreshes customer confidence score badges automatically.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddingItem(!isAddingItem)}
                    className="px-4 py-2.5 rounded-xl bg-foreground text-background font-bold text-xs hover:bg-accent transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Plus className="size-4" />
                    Add Product Item
                  </button>
                </div>

                {/* Add Item Form */}
                {isAddingItem && (
                  <form
                    onSubmit={handleAddItem}
                    className="bg-surface-elevated border border-border rounded-2xl p-5 space-y-4 animate-fade-in"
                  >
                    <h4 className="font-bold text-sm text-foreground">New Inventory Record</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-bold text-muted-foreground block mb-1">
                          Product Name
                        </label>
                        <input
                          type="text"
                          required
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          placeholder="e.g. Zudio Sneakers"
                          className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-accent"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground block mb-1">
                          Category
                        </label>
                        <input
                          type="text"
                          required
                          value={newItemCategory}
                          onChange={(e) => setNewItemCategory(e.target.value)}
                          className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-accent"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground block mb-1">
                          Price (₹)
                        </label>
                        <input
                          type="number"
                          required
                          value={newItemPrice}
                          onChange={(e) => setNewItemPrice(e.target.value)}
                          className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-accent"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingItem(false)}
                        className="px-4 py-2 rounded-xl bg-secondary text-foreground font-bold text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 cursor-pointer"
                      >
                        Save Inventory Record
                      </button>
                    </div>
                  </form>
                )}

                {/* WhatsApp Quick Update Banner */}
                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="size-5 text-emerald-500 shrink-0" />
                    <div>
                      <p className="font-bold text-foreground">How to update stock via WhatsApp</p>
                      <p className="text-muted-foreground">
                        Send <span className="font-mono text-emerald-400">"OUT OF STOCK [Item Name]"</span> to our WhatsApp Business Bot to refresh inventory instantly.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Inventory Table / Cards */}
                <div className="space-y-3">
                  {inventory.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground text-xs bg-surface-elevated rounded-2xl border border-border">
                      No inventory items recorded yet. Click "Add Product Item" above.
                    </div>
                  ) : (
                    inventory.map((item) => (
                      <div
                        key={item.id}
                        className="bg-surface-elevated border border-border/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-border transition-colors shadow-2xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-foreground">{item.product_name}</h4>
                            <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-mono text-[9px]">
                              {item.category}
                            </span>
                          </div>
                          <p className="text-xs font-mono font-bold text-accent">
                            {formatPrice(item.price * 100)}
                          </p>
                          <p className="text-[10px] font-mono text-muted-foreground">
                            Last reported: {new Date(item.updated_at).toLocaleString()}
                          </p>
                        </div>

                        {/* Status Toggle Actions */}
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-border/50 pt-2 sm:pt-0">
                          <button
                            onClick={() => handleUpdateItemStatus(item.id, "in_stock")}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                              item.status === "in_stock"
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "bg-secondary text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            🟢 In Stock
                          </button>
                          <button
                            onClick={() => handleUpdateItemStatus(item.id, "low_stock")}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                              item.status === "low_stock"
                                ? "bg-amber-500 text-black shadow-xs"
                                : "bg-secondary text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            🟡 Low Stock
                          </button>
                          <button
                            onClick={() => handleUpdateItemStatus(item.id, "out_of_stock")}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                              item.status === "out_of_stock"
                                ? "bg-red-600 text-white shadow-xs"
                                : "bg-secondary text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            🔴 Out of Stock
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: SEARCH LEADS */}
            {activeTab === "leads" && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Customer Search Demand Leads</h3>
                  <p className="text-xs text-muted-foreground">
                    Queries searched by local buyers that surfaced your shop in results.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {leads.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-muted-foreground text-xs bg-surface-elevated rounded-2xl border border-border">
                      No search leads logged yet. As customers search, matched queries will appear here.
                    </div>
                  ) : (
                    leads.map((lead) => (
                      <div
                        key={lead.id}
                        className="bg-surface-elevated border border-border/80 rounded-2xl p-4 space-y-2 hover:border-amber-500/40 transition-colors shadow-2xs"
                      >
                        <div className="flex items-center justify-between text-xs text-amber-500 font-mono font-bold">
                          <span>Search Lead</span>
                          <Search className="size-3.5 text-amber-500" />
                        </div>
                        <p className="font-bold text-sm text-foreground">"{lead.query_text}"</p>
                        <p className="text-[10px] font-mono text-muted-foreground">
                          {new Date(lead.created_at).toLocaleDateString()} at{" "}
                          {new Date(lead.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: RESERVATIONS */}
            {activeTab === "reservations" && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Customer Item Holds</h3>
                  <p className="text-xs text-muted-foreground">
                    Confirm or decline 45-minute hold reservations placed by customers on their way.
                  </p>
                </div>

                <div className="space-y-3">
                  {reservations.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground text-xs bg-surface-elevated rounded-2xl border border-border">
                      No customer reservations pending right now.
                    </div>
                  ) : (
                    reservations.map((res) => (
                      <div
                        key={res.id}
                        className="bg-surface-elevated border border-border/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-extrabold text-foreground">
                              #{res.id.slice(0, 8)}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase ${
                                res.status === "confirmed"
                                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                  : res.status === "pending"
                                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                  : "bg-secondary text-muted-foreground"
                              }`}
                            >
                              {res.status}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-foreground">{res.product_name}</p>
                          <p className="text-xs font-mono text-accent">
                            {formatPrice((res.price || 0) * 100)}
                          </p>
                          <p className="text-[10px] font-mono text-muted-foreground">
                            Expires: {new Date(res.expires_at).toLocaleTimeString()}
                          </p>
                        </div>

                        {res.status === "pending" && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleConfirmReservation(res.id)}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                            >
                              <CheckCircle2 className="size-3.5" />
                              Confirm Hold
                            </button>
                            <button
                              onClick={() => handleDeclineReservation(res.id)}
                              className="px-3 py-2 rounded-xl bg-secondary hover:bg-border text-foreground font-bold text-xs transition-colors cursor-pointer"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 3.5: CUSTOMER REVIEWS */}
            {activeTab === "reviews" && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-lg font-bold text-foreground">In-App Customer Reviews & Reply Threads</h3>
                  <p className="text-xs text-muted-foreground">
                    Respond to customer feedback and build trust with verified store visit tags.
                  </p>
                </div>

                <div className="space-y-4">
                  {merchantReviews.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground text-xs bg-surface-elevated rounded-2xl border border-border">
                      No customer reviews posted for your shop yet.
                    </div>
                  ) : (
                    merchantReviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="bg-surface-elevated border border-border rounded-2xl p-5 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="size-8 rounded-full bg-accent/20 text-accent font-bold font-mono flex items-center justify-center text-xs">
                              {rev.reviewer_name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-foreground block text-sm">{rev.reviewer_name}</span>
                              {rev.visit_confirmed && (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold flex items-center gap-1">
                                  <CheckCircle2 className="size-3 text-emerald-500" />
                                  Verified Store Visit
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-0.5 text-amber-500">
                              <Star className="size-4 fill-amber-400 text-amber-400" />
                              <span className="font-bold text-sm text-foreground">{rev.rating}</span>
                            </div>
                            <span className="text-xs text-muted-foreground font-mono">
                              {new Date(rev.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {rev.comment && (
                          <p className="text-xs text-muted-foreground leading-relaxed pl-10 italic">
                            "{rev.comment}"
                          </p>
                        )}

                        {/* Merchant Reply Section */}
                        <div className="pl-10 pt-2 space-y-2">
                          {rev.merchant_reply ? (
                            <div className="p-3.5 bg-accent/10 border border-accent/20 rounded-xl space-y-1 text-xs">
                              <span className="font-mono text-[10px] font-bold text-accent flex items-center gap-1">
                                <MessageSquare className="size-3" /> Your Merchant Official Reply:
                              </span>
                              <p className="text-foreground text-xs leading-relaxed">{rev.merchant_reply}</p>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={replyTextMap[rev.id] || ""}
                                onChange={(e) =>
                                  setReplyTextMap({ ...replyTextMap, [rev.id]: e.target.value })
                                }
                                placeholder="Type official response to customer..."
                                className="flex-1 px-3 py-2 bg-background border border-border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent/40"
                              />
                              <button
                                onClick={() => handleMerchantReplySubmit(rev.id)}
                                disabled={submittingReplyId === rev.id}
                                className="px-4 py-2 bg-foreground text-background hover:bg-accent hover:text-accent-foreground font-bold text-xs rounded-xl transition-colors cursor-pointer"
                              >
                                {submittingReplyId === rev.id ? "Posting..." : "Reply"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: ANALYTICS */}
            {activeTab === "analytics" && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Store Demand & Conversion Analytics</h3>
                  <p className="text-xs text-muted-foreground">
                    Insights on customer search exposure, reservations, and inventory gaps.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-surface-elevated border border-border rounded-2xl p-5 space-y-1">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      Total Search Matches
                    </p>
                    <p className="text-3xl font-extrabold text-foreground">{leads.length}</p>
                  </div>
                  <div className="bg-surface-elevated border border-border rounded-2xl p-5 space-y-1">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      Total Holds Placed
                    </p>
                    <p className="text-3xl font-extrabold text-foreground">{reservations.length}</p>
                  </div>
                  <div className="bg-surface-elevated border border-border rounded-2xl p-5 space-y-1">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      Conversion Rate
                    </p>
                    <p className="text-3xl font-extrabold text-emerald-500">
                      {leads.length > 0
                        ? `${Math.round((reservations.length / leads.length) * 100)}%`
                        : "0%"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: BILLING / SUBSCRIPTION */}
            {activeTab === "billing" && (
              <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-extrabold text-foreground">Merchant Subscription Tiers</h3>
                  <p className="text-xs text-muted-foreground">
                    Unlock AI inventory automation, priority search placement, and WhatsApp bot integration.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  {/* Free Tier */}
                  <div className="bg-surface-elevated border border-border rounded-3xl p-6 space-y-5">
                    <div className="space-y-1">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        CURRENT TIER
                      </span>
                      <h4 className="text-2xl font-extrabold text-foreground">Free Starter</h4>
                      <p className="text-3xl font-mono font-extrabold pt-2">₹0 <span className="text-xs font-sans text-muted-foreground">/ month</span></p>
                    </div>

                    <ul className="space-y-2.5 text-xs text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                        Self-report stock & confidence badges
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                        Up to 10 inventory items
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                        Customer reservation holds
                      </li>
                    </ul>
                  </div>

                  {/* Pro Tier */}
                  <div className="bg-emerald-950/30 border-2 border-emerald-500/50 rounded-3xl p-6 space-y-5 relative shadow-lg">
                    <div className="absolute -top-3 right-6 px-3 py-1 bg-emerald-500 text-black font-mono font-extrabold text-[10px] rounded-full uppercase">
                      RECOMMENDED FOR LOCAL SHOPS
                    </div>

                    <div className="space-y-1">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                        PRO CO-PILOT TIER
                      </span>
                      <h4 className="text-2xl font-extrabold text-foreground">Synthetix Pro Merchant</h4>
                      <p className="text-3xl font-mono font-extrabold pt-2 text-foreground">₹499 <span className="text-xs font-sans text-muted-foreground">/ month</span></p>
                    </div>

                    <ul className="space-y-2.5 text-xs text-foreground">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                        Unlimited inventory self-reporting
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                        WhatsApp Business Bot automated stock updates
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                        Priority Sponsored Search Placement
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                        Advanced Customer Lead Analytics
                      </li>
                    </ul>

                    <button
                      onClick={() => toast.info("Payment Provider integration placeholder. Pro upgrades available soon!")}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                    >
                      Upgrade to Pro (₹499/mo)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
