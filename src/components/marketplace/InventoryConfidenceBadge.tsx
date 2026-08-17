import React from "react";
import { Phone, MessageSquare, AlertTriangle, ShieldCheck, Clock, HelpCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface ConfidenceData {
  updated_at?: string | Date | null;
  status?: "in_stock" | "low_stock" | "out_of_stock" | string | null;
  phone?: string | null;
  whatsapp_number?: string | null;
  product_name?: string | null;
  shop_name?: string | null;
}

export type ConfidenceTier = "verified" | "recent" | "likely" | "out_of_stock" | "unconfirmed";

export function getConfidenceTier(data?: ConfidenceData): {
  tier: ConfidenceTier;
  label: string;
  dotColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  timeAgoText: string;
} {
  if (!data || !data.updated_at) {
    return {
      tier: "unconfirmed",
      label: "Not confirmed by shop",
      dotColor: "bg-gray-400 dark:bg-gray-500",
      badgeBg: "bg-secondary/90",
      badgeBorder: "border-border",
      badgeText: "text-muted-foreground",
      timeAgoText: "No merchant update",
    };
  }

  if (data.status === "out_of_stock") {
    return {
      tier: "out_of_stock",
      label: "Out of stock",
      dotColor: "bg-red-500",
      badgeBg: "bg-red-950/80 dark:bg-red-950/90",
      badgeBorder: "border-red-500/30",
      badgeText: "text-red-400",
      timeAgoText: "Marked out of stock",
    };
  }

  const date = new Date(data.updated_at);
  const diffMinutes = (Date.now() - date.getTime()) / (1000 * 60);
  const timeAgoStr = formatDistanceToNow(date, { addSuffix: true });

  if (diffMinutes <= 30) {
    return {
      tier: "verified",
      label: `Verified ${Math.max(1, Math.round(diffMinutes))}m ago`,
      dotColor: "bg-emerald-500 animate-pulse",
      badgeBg: "bg-emerald-950/80 dark:bg-emerald-950/90",
      badgeBorder: "border-emerald-500/40",
      badgeText: "text-emerald-400",
      timeAgoText: `Verified ${timeAgoStr}`,
    };
  } else if (diffMinutes <= 24 * 60) {
    const hours = Math.max(1, Math.round(diffMinutes / 60));
    return {
      tier: "recent",
      label: `Updated ${hours}h ago`,
      dotColor: "bg-amber-400",
      badgeBg: "bg-amber-950/80 dark:bg-amber-950/90",
      badgeBorder: "border-amber-500/30",
      badgeText: "text-amber-300",
      timeAgoText: `Updated ${timeAgoStr}`,
    };
  } else {
    return {
      tier: "likely",
      label: "Likely available",
      dotColor: "bg-orange-500",
      badgeBg: "bg-orange-950/80 dark:bg-orange-950/90",
      badgeBorder: "border-orange-500/30",
      badgeText: "text-orange-300",
      timeAgoText: `Last reported ${timeAgoStr}`,
    };
  }
}

interface InventoryConfidenceBadgeProps {
  data?: ConfidenceData;
  showCallConfirm?: boolean;
  compact?: boolean;
}

export function InventoryConfidenceBadge({
  data,
  showCallConfirm = true,
  compact = false,
}: InventoryConfidenceBadgeProps) {
  const info = getConfidenceTier(data);
  const phone = data?.phone?.replace(/[^0-9+]/g, "");
  const whatsapp = (data?.whatsapp_number || data?.phone)?.replace(/[^0-9]/g, "");

  const templateMsg = encodeURIComponent(
    `Hi! Is "${data?.product_name || "this item"}" currently available in stock at your store?`,
  );
  const waUrl = whatsapp ? `https://wa.me/${whatsapp}?text=${templateMsg}` : undefined;

  return (
    <div className="space-y-2 w-full">
      {/* Visual Badge */}
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border backdrop-blur-md ${info.badgeBg} ${info.badgeBorder} ${info.badgeText} shadow-2xs font-mono text-[10px] font-bold uppercase tracking-wider`}
      >
        <span className={`size-2 rounded-full ${info.dotColor} shrink-0`} />
        <span>{info.label}</span>
      </div>

      {/* Call & Confirm Warning Box (when not verified or when unconfirmed) */}
      {showCallConfirm && info.tier !== "verified" && info.tier !== "out_of_stock" && (
        <div className="bg-secondary/80 border border-border/80 rounded-2xl p-3 space-y-2 text-xs">
          <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400 font-medium">
            <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
            <p className="leading-snug text-[11px]">
              {info.tier === "unconfirmed"
                ? "Availability not yet confirmed by merchant — call or message ahead to confirm stock before visiting."
                : `Availability last ${info.timeAgoText.toLowerCase()} — call or message ahead to confirm stock before visiting.`}
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <a
              href={`tel:${(phone || "919876543210").replace(/[^0-9]/g, "")}`}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 bg-background hover:bg-border border border-border px-2.5 py-1.5 rounded-xl font-bold text-[11px] text-foreground flex items-center justify-center gap-1.5 transition-colors"
            >
              <Phone className="size-3 text-sky-500" />
              Call Shop
            </a>
            <a
              href={waUrl || `https://wa.me/919876543210?text=${templateMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex-1 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl font-bold text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5 transition-colors"
            >
              <MessageSquare className="size-3 text-emerald-500" />
              WhatsApp Shop
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
