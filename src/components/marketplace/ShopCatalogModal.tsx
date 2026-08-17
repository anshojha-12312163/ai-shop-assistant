import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { fetchShopCatalogAndStock, CatalogItem } from "@/lib/nearby-shops";
import { getShopWhatsAppUrl } from "@/lib/whatsapp";
import {
  X,
  Package,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MessageSquare,
  Search,
  Loader2,
  Clock,
  Sparkles,
  ShoppingBag,
  Check,
} from "lucide-react";
import { toast } from "sonner";

interface ShopCatalogModalProps {
  shopId: string;
  shopName: string;
  shopCategory?: string;
  phone?: string;
  onClose: () => void;
}

import { ReservationModal, ReservationItem } from "./ReservationModal";

export function ShopCatalogModal({
  shopId,
  shopName,
  shopCategory = "Retail Store",
  phone,
  onClose,
}: ShopCatalogModalProps) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "in_stock" | "out_of_stock">("all");
  const [reservationModalItem, setReservationModalItem] = useState<ReservationItem | null>(null);

  const getCatalog = useServerFn(fetchShopCatalogAndStock);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    getCatalog({ data: { shopId, shopName, category: shopCategory } })
      .then((res) => {
        if (mounted) {
          setItems(res.items);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load catalog:", err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [shopId, shopName, shopCategory]);

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === "in_stock") {
      return matchesSearch && (item.status === "in_stock" || item.status === "low_stock");
    }
    if (statusFilter === "out_of_stock") {
      return matchesSearch && item.status === "out_of_stock";
    }
    return matchesSearch;
  });

  function handleOpenReservationModal(item: CatalogItem) {
    setReservationModalItem({
      id: item.id,
      shop_id: shopId,
      product_name: item.productName,
      price: item.price,
      shop_name: shopName,
    });
  }

  const whatsappUrl = getShopWhatsAppUrl(phone || "+919876543210", shopName);

  return (
    <>
      <div className="fixed inset-0 z-[5000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
        <div
          className="relative w-full max-w-3xl bg-surface-elevated border border-border rounded-3xl shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-border bg-gradient-to-r from-accent/15 via-accent/5 to-transparent flex items-start justify-between gap-4 shrink-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-accent font-extrabold">
                <Package className="size-4" />
                <span>Extracted Store Catalog & Live Stock</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">{shopName}</h2>
              <div className="flex items-center gap-2 pt-1 flex-wrap text-xs">
                <span className="px-2.5 py-0.5 rounded-full bg-secondary text-accent font-mono font-bold">
                  {shopCategory}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono font-bold flex items-center gap-1">
                  <CheckCircle2 className="size-3" /> 🟢 Verified Live Stock
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-secondary hover:bg-border text-foreground transition-colors shrink-0"
              title="Close catalog"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Filter & Search Controls */}
          <div className="p-4 bg-background border-b border-border flex flex-col sm:flex-row gap-3 items-center justify-between shrink-0">
            {/* Search bar */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search product catalog..."
                className="w-full pl-9 pr-4 py-2 bg-surface-elevated border border-border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>

            {/* Status filter tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-surface-elevated border border-border rounded-xl w-full sm:w-auto">
              <button
                onClick={() => setStatusFilter("all")}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === "all" ? "bg-accent text-accent-foreground shadow-xs" : "text-muted-foreground"
                }`}
              >
                All ({items.length})
              </button>
              <button
                onClick={() => setStatusFilter("in_stock")}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === "in_stock" ? "bg-emerald-600 text-white shadow-xs" : "text-muted-foreground"
                }`}
              >
                In Stock
              </button>
              <button
                onClick={() => setStatusFilter("out_of_stock")}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === "out_of_stock" ? "bg-rose-600 text-white shadow-xs" : "text-muted-foreground"
                }`}
              >
                Out of Stock
              </button>
            </div>
          </div>

          {/* Catalog List */}
          <div className="p-6 overflow-y-auto flex-1 space-y-3">
            {loading ? (
              <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
                <Loader2 className="size-8 text-accent animate-spin" />
                <span className="font-mono text-xs text-muted-foreground">
                  Extracting live inventory & stock availability...
                </span>
              </div>
            ) : filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredItems.map((item) => {
                  const isInStock = item.status === "in_stock";
                  const isLowStock = item.status === "low_stock";
                  const isOutOfStock = item.status === "out_of_stock";

                  return (
                    <div
                      key={item.id}
                      className="p-4 bg-surface-elevated border border-border rounded-2xl flex flex-col justify-between gap-3 shadow-2xs hover:border-accent/40 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          {/* Stock Availability Badge */}
                          <div className="flex items-center gap-2">
                            {isInStock && (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold flex items-center gap-1">
                                <CheckCircle2 className="size-3" />
                                IN STOCK
                              </span>
                            )}
                            {isLowStock && (
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-mono text-[10px] font-bold flex items-center gap-1">
                                <AlertCircle className="size-3" />
                                LOW STOCK (Only 2 Left)
                              </span>
                            )}
                            {isOutOfStock && (
                              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-mono text-[10px] font-bold flex items-center gap-1">
                                <XCircle className="size-3" />
                                OUT OF STOCK
                              </span>
                            )}
                          </div>

                          <h4 className="font-bold text-sm text-foreground leading-snug pt-1">
                            {item.productName}
                          </h4>
                          <p className="text-[11px] text-muted-foreground font-mono">
                            Category: {item.category}
                          </p>
                        </div>

                        {/* Price Badge */}
                        <div className="px-3 py-1 bg-accent/15 border border-accent/30 rounded-xl text-accent font-mono text-sm font-extrabold shrink-0">
                          ₹{item.price.toFixed(0)}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2 text-xs">
                        <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                          <Clock className="size-3 text-emerald-500" />
                          {item.confidenceScoreText}
                        </span>

                        <div className="flex items-center gap-2">
                          {!isOutOfStock && (
                            <button
                              onClick={() => handleOpenReservationModal(item)}
                              className="px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 bg-foreground text-background hover:bg-accent hover:text-accent-foreground transition-all shadow-2xs cursor-pointer"
                            >
                              <ShoppingBag className="size-3.5" />
                              <span>Reserve 45m</span>
                            </button>
                          )}

                          {whatsappUrl && (
                            <a
                              href={`${whatsappUrl}&text=${encodeURIComponent(`Hi ${shopName}, is "${item.productName}" (₹${item.price}) available right now?`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-emerald-600/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600/20 rounded-xl transition-colors"
                              title="Inquire on WhatsApp"
                            >
                              <MessageSquare className="size-4 text-emerald-500" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-muted-foreground">
                No product catalog items matching "{searchQuery}".
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reservation Hold Modal */}
      <ReservationModal
        isOpen={!!reservationModalItem}
        onClose={() => setReservationModalItem(null)}
        item={reservationModalItem}
      />
    </>
  );
}
