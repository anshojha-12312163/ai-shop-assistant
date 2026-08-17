import React, { useState, useEffect } from "react";
import { X, Clock, CheckCircle2, AlertCircle, ShoppingBag, MapPin, Phone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/cart";

export interface ReservationItem {
  id: string;
  shop_id: string;
  product_name: string;
  price: number;
  shop_name?: string;
  shop_address?: string;
  status?: string;
  expires_at?: string;
}

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: ReservationItem | null;
}

export function ReservationModal({ isOpen, onClose, item }: ReservationModalProps) {
  const [activeReservationsCount, setActiveReservationsCount] = useState<number>(0);
  const [currentReservation, setCurrentReservation] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!isOpen) return;

    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;

      // Count active reservations for user
      const { data: resList } = await (supabase as any)
        .from("reservations")
        .select("id, status, expires_at, inventory_item_id")
        .eq("customer_id", auth.user.id)
        .in("status", ["pending", "confirmed"])
        .gt("expires_at", new Date().toISOString());

      const activeCount = resList?.length || 0;
      setActiveReservationsCount(activeCount);

      // Check if current item already reserved
      if (item?.id) {
        const existing = resList?.find((r: any) => r.inventory_item_id === item.id);
        if (existing) setCurrentReservation(existing);
      }
    })();
  }, [isOpen, item]);

  // Countdown Timer
  useEffect(() => {
    if (!currentReservation?.expires_at) return;

    const interval = setInterval(() => {
      const expires = new Date(currentReservation.expires_at).getTime();
      const now = Date.now();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft("Expired");
        clearInterval(interval);
      } else {
        const mins = Math.floor(diff / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${mins}:${secs < 10 ? "0" : ""}${secs}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentReservation]);

  if (!isOpen || !item) return null;

  const handleCreateReservation = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      toast.error("Please sign in to reserve items before visiting.");
      return;
    }

    if (activeReservationsCount >= 3) {
      toast.error("You have 3 active reservations — visit or cancel one to reserve another.");
      return;
    }

    setIsLoading(true);
    try {
      const expiresAt = new Date(Date.now() + 45 * 60 * 1000).toISOString();
      const { data, error } = await (supabase as any)
        .from("reservations")
        .insert({
          customer_id: auth.user.id,
          shop_id: item.shop_id,
          inventory_item_id: item.id,
          status: "pending",
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentReservation(data);
      setActiveReservationsCount((prev) => prev + 1);
      toast.success(`Reserved "${item.product_name}" for 45 minutes!`);
    } catch (e: any) {
      toast.error(e.message || "Failed to create reservation.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelReservation = async () => {
    if (!currentReservation?.id) return;
    setIsLoading(true);
    try {
      const { error } = await (supabase as any)
        .from("reservations")
        .update({ status: "cancelled" })
        .eq("id", currentReservation.id);

      if (error) throw error;

      setCurrentReservation(null);
      setActiveReservationsCount((prev) => Math.max(0, prev - 1));
      toast.info("Reservation cancelled.");
    } catch (e: any) {
      toast.error(e.message || "Failed to cancel reservation.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-background border border-border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-accent/15 text-accent flex items-center justify-center border border-accent/20">
            <ShoppingBag className="size-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-foreground">Reserve Before Visiting</h3>
            <p className="text-xs text-muted-foreground">Hold stock for 45 mins while on your way</p>
          </div>
        </div>

        {/* Item Preview Card */}
        <div className="bg-surface-elevated border border-border rounded-2xl p-4 space-y-2">
          <div className="flex justify-between items-start gap-2">
            <h4 className="font-bold text-sm text-foreground">{item.product_name}</h4>
            <span className="font-mono text-sm font-bold text-accent">
              {formatPrice(item.price * 100)}
            </span>
          </div>
          {item.shop_name && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="size-3 text-accent" />
              {item.shop_name}
            </p>
          )}
        </div>

        {/* Limit Warning */}
        {activeReservationsCount >= 3 && !currentReservation && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <p>
              You have 3 active reservations — visit or cancel one to reserve another item.
            </p>
          </div>
        )}

        {/* Existing Active Reservation View */}
        {currentReservation ? (
          <div className="space-y-4 pt-1">
            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold rounded-full border border-emerald-500/20">
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                {currentReservation.status === "confirmed" ? "Reserved ✅ (Merchant Confirmed)" : "Reservation Pending Hold"}
              </div>
              <div className="text-2xl font-mono font-extrabold text-foreground tracking-tight pt-1">
                Expires in {timeLeft || "45:00"}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Head over to the shop! Show your reservation ID <span className="font-mono font-bold text-foreground">#{currentReservation.id.slice(0, 8)}</span> at checkout.
              </p>
            </div>

            <button
              onClick={handleCancelReservation}
              disabled={isLoading}
              className="w-full border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Trash2 className="size-3.5" />
              Cancel Reservation
            </button>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            <button
              onClick={handleCreateReservation}
              disabled={isLoading || activeReservationsCount >= 3}
              className="w-full bg-foreground text-background hover:bg-accent font-extrabold py-3.5 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <Clock className="size-4" />
              {isLoading ? "Reserving..." : "Confirm 45-Minute Hold"}
            </button>
            <p className="text-[10px] text-center text-muted-foreground">
              Free hold service. No credit card required. Max 3 active holds at a time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
