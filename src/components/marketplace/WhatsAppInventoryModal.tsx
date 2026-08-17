import React, { useState } from "react";
import {
  X,
  MessageSquare,
  Share2,
  PackagePlus,
  Boxes,
  CheckCircle2,
  Copy,
  ExternalLink,
  Sparkles,
  Smartphone,
  PhoneCall,
  Search,
  RefreshCw,
  Plus,
  AlertTriangle,
  Check,
  Edit2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";

export interface WhatsAppInventoryItem {
  id?: string;
  title: string;
  price_cents: number;
  category: string;
  in_stock: number;
  phone?: string;
  ai_summary?: string;
  updated_at?: string;
}

export interface PendingInventoryItem {
  id: string;
  title: string;
  price_cents: number;
  category: string;
  in_stock: number;
  confidence: "high" | "medium" | "low";
  reason?: string;
}

const DEMO_INVENTORY: WhatsAppInventoryItem[] = [
  {
    id: "wa-1",
    title: "Zudio Casual Streetwear Sneakers",
    price_cents: 149900,
    category: "Footwear",
    in_stock: 18,
    phone: "+919876543210",
    ai_summary: "Lightweight canvas sneakers with rubber sole",
    updated_at: new Date().toISOString(),
  },
  {
    id: "wa-2",
    title: "Handcrafted Heritage Leather Backpack",
    price_cents: 349900,
    category: "Outdoor Gear",
    in_stock: 7,
    phone: "+919876543210",
    ai_summary: "Full-grain vegetable-tanned leather backpack",
    updated_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
  {
    id: "wa-3",
    title: "Organic French Linen Duvet Set",
    price_cents: 499900,
    category: "Home Goods",
    in_stock: 12,
    phone: "+919876543210",
    ai_summary: "100% French flax linen bedding set",
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
];

interface WhatsAppInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialItems?: WhatsAppInventoryItem[];
}

export function WhatsAppInventoryModal({
  isOpen,
  onClose,
  initialItems = DEMO_INVENTORY,
}: WhatsAppInventoryModalProps) {
  const [activeTab, setActiveTab] = useState<"broadcast" | "parser" | "manage">("broadcast");
  const [inventory, setInventory] = useState<WhatsAppInventoryItem[]>(initialItems);
  const [pendingItems, setPendingItems] = useState<PendingInventoryItem[]>([]);
  const [storePhone, setStorePhone] = useState("+919876543210");
  const [storeName, setStoreName] = useState("Synthetix Local Shop");
  const [rawText, setRawText] = useState(
    `Zudio Streetwear Sneakers - ₹1499 - 15 in stock - Footwear\nLeather Duffle Bag - ₹2999 - 8 in stock - Bags\nHandmade Wooden Mug - Ambiguous price - 12 in stock - Craft\nUnlabeled Silk Scarf - ₹899 - Quantity unclear`,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [editableBroadcast, setEditableBroadcast] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter inventory
  const filteredInventory = inventory.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Generate WhatsApp Broadcast Catalog Message
  const getBroadcastText = () => {
    if (editableBroadcast !== null) return editableBroadcast;

    let msg = `🛍️ *${storeName.toUpperCase()} — LATEST INVENTORY CATALOG* 🛍️\n`;
    msg += `📍 Order directly via WhatsApp or visit our local shop!\n\n`;

    inventory.forEach((item, index) => {
      const stockBadge =
        item.in_stock > 10 ? "✅ In Stock" : item.in_stock > 0 ? "⚠️ Low Stock" : "❌ Out of Stock";
      msg += `*${index + 1}. ${item.title}*\n`;
      msg += `💰 Price: ${formatPrice(item.price_cents)}\n`;
      msg += `📦 Availability: ${stockBadge} (${item.in_stock} left)\n`;
      if (item.ai_summary) msg += `✨ Details: ${item.ai_summary}\n`;
      msg += `\n`;
    });

    msg += `📲 *To Order:* Reply with product number and your delivery address!\n`;
    msg += `📞 Contact Store: ${storePhone}\n`;
    msg += `✨ Powered by Synthetix AI Local Shop Platform`;
    return msg;
  };

  const handleCopyBroadcast = () => {
    navigator.clipboard.writeText(getBroadcastText());
    toast.success("WhatsApp inventory broadcast copied to clipboard!");
  };

  const handleOpenWhatsAppShare = () => {
    const text = encodeURIComponent(getBroadcastText());
    const cleanPhone = storePhone.replace(/[^0-9]/g, "");
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(url, "_blank");
  };

  // Smart WhatsApp Text Parser into Pending Queue
  const handleParseWhatsAppText = () => {
    if (!rawText.trim()) return;

    const lines = rawText.split("\n").filter((l) => l.trim().length > 0);
    const newPending: PendingInventoryItem[] = [];

    lines.forEach((line, idx) => {
      const parts = line.split(/[-|–,]/).map((p) => p.trim());
      const title = parts[0] || `WhatsApp Product #${idx + 1}`;

      // Extract price
      const priceMatch = line.match(/(?:₹|Rs\.?|\$)\s*([\d,]+)|([\d,]+)\s*(?:INR|rupees|cents)?/i);
      let priceCents = 149900;
      let confidence: "high" | "medium" | "low" = "high";
      let reason: string | undefined;

      if (priceMatch) {
        const val = parseInt((priceMatch[1] || priceMatch[2]).replace(/,/g, ""), 10);
        if (!isNaN(val)) priceCents = val < 1000 ? val * 100 : val;
      } else {
        confidence = "medium";
        reason = "Unclear price formatting — estimated at ₹1,499";
      }

      // Extract stock
      const stockMatch = line.match(/(\d+)\s*(?:in stock|left|units|pcs|quantity|avail)/i);
      let inStock = 10;
      if (stockMatch) {
        inStock = parseInt(stockMatch[1], 10);
      } else {
        if (confidence === "high") confidence = "medium";
        else confidence = "low";
        reason = reason ? `${reason}; Defaulted quantity to 10` : "Unclear stock quantity";
      }

      const category = parts.length > 3 ? parts[3] : "Local Craft";

      newPending.push({
        id: `pending-${Date.now()}-${idx}`,
        title,
        price_cents: priceCents,
        category,
        in_stock: inStock,
        confidence,
        reason,
      });
    });

    setPendingItems(newPending);
    toast.info(`Extracted ${newPending.length} items. Please review before publishing.`);
  };

  // Approval Actions
  const handleApproveItem = async (id: string) => {
    const target = pendingItems.find((p) => p.id === id);
    if (!target) return;

    const nowIso = new Date().toISOString();
    const approvedItem: WhatsAppInventoryItem = {
      id: `approved-${Date.now()}`,
      title: target.title,
      price_cents: target.price_cents,
      category: target.category,
      in_stock: target.in_stock,
      phone: storePhone,
      ai_summary: `Verified local stock item.`,
      updated_at: nowIso,
    };

    setInventory((prev) => [approvedItem, ...prev]);
    setPendingItems((prev) => prev.filter((p) => p.id !== id));

    // Live Database Sync
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        await (supabase as any).from("inventory_items").insert({
          product_name: target.title,
          category: target.category,
          price: target.price_cents / 100,
          status: target.in_stock > 0 ? "in_stock" : "out_of_stock",
          updated_at: nowIso,
          updated_by: auth.user.id,
        });
      }
    } catch (e) {
      console.error("Supabase sync warning:", e);
    }

    toast.success(`Published "${target.title}" to live inventory! (🟢 Verified Now)`);
  };

  const handleApproveAllHighConfidence = async () => {
    const highConf = pendingItems.filter((p) => p.confidence === "high");
    if (highConf.length === 0) {
      toast.info("No high-confidence items to approve.");
      return;
    }

    const nowIso = new Date().toISOString();
    const approvedList: WhatsAppInventoryItem[] = highConf.map((target, idx) => ({
      id: `approved-bulk-${Date.now()}-${idx}`,
      title: target.title,
      price_cents: target.price_cents,
      category: target.category,
      in_stock: target.in_stock,
      phone: storePhone,
      ai_summary: `Verified local stock item.`,
      updated_at: nowIso,
    }));

    setInventory((prev) => [...approvedList, ...prev]);
    setPendingItems((prev) => prev.filter((p) => p.confidence !== "high"));

    // Live Database Sync
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        const payload = highConf.map((target) => ({
          product_name: target.title,
          category: target.category,
          price: target.price_cents / 100,
          status: target.in_stock > 0 ? "in_stock" : "out_of_stock",
          updated_at: nowIso,
          updated_by: auth.user.id,
        }));
        await (supabase as any).from("inventory_items").insert(payload);
      }
    } catch (e) {
      console.error("Supabase sync warning:", e);
    }

    toast.success(`${highConf.length} high-confidence items published to live inventory!`);
  };

  const handleDiscardItem = (id: string) => {
    setPendingItems((prev) => prev.filter((p) => p.id !== id));
    toast.info("Discarded item.");
  };

  const handleUpdateStock = (id?: string, newStock: number = 0) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, in_stock: Math.max(0, newStock), updated_at: new Date().toISOString() }
          : item,
      ),
    );
    toast.success("Stock level updated!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-background border border-border rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-border bg-emerald-950/20 dark:bg-emerald-950/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <MessageSquare className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-foreground tracking-tight">
                  WhatsApp Inventory & Broadcast Tool
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/20 uppercase">
                  Approval Protected
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Import supplier notes, review AI extractions, and broadcast to WhatsApp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border bg-secondary/40 p-1.5 gap-1 shrink-0">
          <button
            onClick={() => setActiveTab("broadcast")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "broadcast"
                ? "bg-background text-foreground shadow-xs border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Share2 className="size-3.5 text-emerald-600" />
            WhatsApp Broadcast
          </button>
          <button
            onClick={() => setActiveTab("parser")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer relative ${
              activeTab === "parser"
                ? "bg-background text-foreground shadow-xs border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <PackagePlus className="size-3.5 text-amber-500" />
            Text-to-Inventory AI
            {pendingItems.length > 0 && (
              <span className="size-2 rounded-full bg-amber-500 animate-ping absolute top-2 right-2" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("manage")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "manage"
                ? "bg-background text-foreground shadow-xs border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Boxes className="size-3.5 text-sky-500" />
            Stock Manager ({inventory.length})
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: WhatsApp Broadcast */}
          {activeTab === "broadcast" && (
            <div className="space-y-5 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1.5">
                    Store Name
                  </label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => {
                      setStoreName(e.target.value);
                      setEditableBroadcast(null);
                    }}
                    className="w-full bg-secondary/50 border border-border rounded-xl px-3.5 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1.5">
                    WhatsApp Business Phone
                  </label>
                  <input
                    type="text"
                    value={storePhone}
                    onChange={(e) => {
                      setStorePhone(e.target.value);
                      setEditableBroadcast(null);
                    }}
                    className="w-full bg-secondary/50 border border-border rounded-xl px-3.5 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="size-3 text-emerald-500" />
                    Editable Catalog Message Preview (Review before sending)
                  </label>
                  <button
                    onClick={handleCopyBroadcast}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="size-3" />
                    Copy Text
                  </button>
                </div>
                <textarea
                  rows={10}
                  value={getBroadcastText()}
                  onChange={(e) => setEditableBroadcast(e.target.value)}
                  className="w-full bg-emerald-950/10 dark:bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-4 font-mono text-xs text-foreground outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleOpenWhatsAppShare}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-3 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <Smartphone className="size-4" />
                  Send Directly to WhatsApp Broadcast
                </button>
                <button
                  onClick={handleCopyBroadcast}
                  className="border border-border bg-secondary hover:bg-secondary/80 text-foreground font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Copy className="size-4" />
                  Copy Catalog Message
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Text-to-Inventory AI with MANDATORY APPROVAL STEP */}
          {activeTab === "parser" && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-secondary/60 border border-border rounded-2xl p-4 space-y-3">
                <label className="text-xs font-bold text-foreground block">
                  Paste Raw Supplier / WhatsApp Message
                </label>
                <textarea
                  rows={4}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Format: Product Name - ₹Price - Quantity in stock - Category"
                  className="w-full bg-background border border-border rounded-xl p-3 font-mono text-xs text-foreground outline-none focus:ring-2 focus:ring-amber-500/50"
                />
                <button
                  onClick={handleParseWhatsAppText}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <PackagePlus className="size-4" />
                  Extract Items for Review
                </button>
              </div>

              {/* REVIEW SCREEN BEFORE PUBLISHING */}
              {pendingItems.length > 0 && (
                <div className="space-y-5 border-t border-border pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                        <AlertTriangle className="size-4 text-amber-500" />
                        Review Before Publishing ({pendingItems.length} items)
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Extracted items must be approved before reaching live customer search.
                      </p>
                    </div>
                    {pendingItems.some((p) => p.confidence === "high") && (
                      <button
                        onClick={handleApproveAllHighConfidence}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Check className="size-3.5" />
                        Approve High-Confidence ({pendingItems.filter((p) => p.confidence === "high").length})
                      </button>
                    )}
                  </div>

                  {/* Section A: Low & Medium Confidence Items (Must be reviewed) */}
                  {pendingItems.some((p) => p.confidence !== "high") && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-xs">
                        <AlertTriangle className="size-4" />
                        <span>Please review these extractions (Unclear price or quantity)</span>
                      </div>
                      <div className="space-y-2">
                        {pendingItems
                          .filter((p) => p.confidence !== "high")
                          .map((item) => (
                            <div
                              key={item.id}
                              className="bg-background border border-amber-500/30 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
                            >
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-xs text-foreground">{item.title}</h4>
                                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono text-[9px] font-bold">
                                    {item.confidence.toUpperCase()} CONFIDENCE
                                  </span>
                                </div>
                                <p className="text-[11px] font-mono text-accent">
                                  {formatPrice(item.price_cents)} · {item.in_stock} in stock · {item.category}
                                </p>
                                {item.reason && (
                                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                                    ⚠️ {item.reason}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleApproveItem(item.id)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="size-3" /> Approve
                                </button>
                                <button
                                  onClick={() => handleDiscardItem(item.id)}
                                  className="px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-border text-muted-foreground hover:text-foreground text-xs cursor-pointer"
                                >
                                  <Trash2 className="size-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Section B: High Confidence Items */}
                  {pendingItems.some((p) => p.confidence === "high") && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        High Confidence Extractions
                      </h4>
                      {pendingItems
                        .filter((p) => p.confidence === "high")
                        .map((item) => (
                          <div
                            key={item.id}
                            className="bg-surface-elevated border border-border/80 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
                          >
                            <div className="space-y-1">
                              <h4 className="font-bold text-xs text-foreground">{item.title}</h4>
                              <p className="text-[11px] font-mono text-accent">
                                {formatPrice(item.price_cents)} · {item.in_stock} in stock · {item.category}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleApproveItem(item.id)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="size-3" /> Approve
                              </button>
                              <button
                                onClick={() => handleDiscardItem(item.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground text-xs cursor-pointer"
                              >
                                <Trash2 className="size-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Stock Manager */}
          {activeTab === "manage" && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search WhatsApp inventory items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-sky-500/50"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {filteredInventory.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground text-xs">
                    No matching live inventory items found.
                  </div>
                ) : (
                  filteredInventory.map((item) => (
                    <div
                      key={item.id || item.title}
                      className="bg-surface-elevated border border-border/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-emerald-500/40 transition-colors shadow-2xs"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-foreground">{item.title}</h4>
                          <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-mono text-[9px]">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-xs font-mono font-bold text-accent">
                          {formatPrice(item.price_cents)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-secondary rounded-xl p-1 border border-border">
                          <span className="text-[10px] font-mono font-bold px-2 text-muted-foreground">
                            Stock: {item.in_stock}
                          </span>
                          <button
                            onClick={() => handleUpdateStock(item.id, item.in_stock - 1)}
                            className="size-6 rounded-lg bg-background hover:bg-border text-foreground font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                          >
                            -
                          </button>
                          <button
                            onClick={() => handleUpdateStock(item.id, item.in_stock + 1)}
                            className="size-6 rounded-lg bg-background hover:bg-border text-foreground font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-secondary/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="size-4 text-emerald-500" />
            Mandatory Approval Step Active
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-secondary hover:bg-border text-foreground font-bold text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
