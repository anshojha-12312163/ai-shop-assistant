import React from "react";

export function ShopCardSkeleton() {
  return (
    <div className="bg-surface-elevated rounded-2xl overflow-hidden border border-border shadow-sm flex flex-col justify-between h-full animate-pulse">
      <div>
        {/* Aspect-ratio image placeholder */}
        <div className="relative aspect-[16/9] bg-secondary/80 overflow-hidden">
          <div className="absolute top-3 left-3 flex gap-2">
            <div className="w-16 h-5 bg-background/60 rounded-full" />
            <div className="w-14 h-5 bg-background/60 rounded-full" />
          </div>
        </div>

        {/* Content body */}
        <div className="p-5 space-y-3">
          <div className="h-5 bg-secondary rounded-lg w-3/4" />
          <div className="space-y-1.5 pt-1">
            <div className="h-3.5 bg-secondary/70 rounded w-full" />
            <div className="h-3.5 bg-secondary/50 rounded w-5/6" />
          </div>
          <div className="space-y-1 pt-2">
            <div className="h-3 bg-secondary/60 rounded w-1/2" />
            <div className="h-3 bg-secondary/40 rounded w-1/3" />
          </div>
        </div>
      </div>

      {/* Footer controls skeleton */}
      <div className="px-5 pb-5 pt-2 border-t border-border/50 flex gap-2 items-center min-h-[52px]">
        <div className="w-16 h-8 bg-secondary rounded-full" />
        <div className="flex-1 h-8 bg-secondary rounded-full" />
        <div className="w-14 h-8 bg-secondary rounded-full" />
      </div>
    </div>
  );
}

export function ShopGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ShopCardSkeleton key={i} />
      ))}
    </div>
  );
}
