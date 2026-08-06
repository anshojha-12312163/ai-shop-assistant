import { ShoppingCart, ExternalLink, Sparkles, Tag } from "lucide-react";

export interface PlatformItem {
  name: string;
  categoryRelevance: string[];
  searchUrl: (q: string) => string;
  color: string;
  badge?: string;
  priceEstimate?: string;
  rating?: number;
  apiConnected?: boolean;
}

const PLATFORMS: PlatformItem[] = [
  {
    name: "Amazon",
    categoryRelevance: ["electronics", "home", "books", "fashion", "footwear", "general"],
    searchUrl: (q) => `https://www.amazon.in/s?k=${encodeURIComponent(q)}`,
    color: "from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-600 dark:text-amber-400",
    badge: "Prime Shipping",
    priceEstimate: "$24.99 - $120",
    rating: 4.6,
  },
  {
    name: "Flipkart",
    categoryRelevance: ["electronics", "mobile", "fashion", "home", "appliances"],
    searchUrl: (q) => `https://www.flipkart.com/search?q=${encodeURIComponent(q)}`,
    color: "from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-600 dark:text-blue-400",
    badge: "Assured Quality",
    priceEstimate: "$19.99 - $99",
    rating: 4.5,
  },
  {
    name: "Myntra",
    categoryRelevance: ["fashion", "footwear", "apparel", "clothing", "shoes", "beauty"],
    searchUrl: (q) => `https://www.myntra.com/search?q=${encodeURIComponent(q)}`,
    color: "from-pink-500/20 to-rose-500/20 border-pink-500/30 text-pink-600 dark:text-pink-400",
    badge: "Top Fashion Pick",
    priceEstimate: "$15.99 - $85",
    rating: 4.7,
  },
  {
    name: "Nykaa",
    categoryRelevance: ["beauty", "cosmetics", "skincare", "pharmacy", "wellness"],
    searchUrl: (q) => `https://www.nykaa.com/search/result/?q=${encodeURIComponent(q)}`,
    color: "from-purple-500/20 to-fuchsia-500/20 border-purple-500/30 text-purple-600 dark:text-purple-400",
    badge: "Beauty & Wellness",
    priceEstimate: "$12.99 - $45",
    rating: 4.8,
  },
  {
    name: "Ajio",
    categoryRelevance: ["fashion", "footwear", "apparel", "clothing", "streetwear"],
    searchUrl: (q) => `https://www.ajio.com/search/?text=${encodeURIComponent(q)}`,
    color: "from-teal-500/20 to-emerald-500/20 border-teal-500/30 text-teal-600 dark:text-teal-400",
    badge: "Indie Trends",
    priceEstimate: "$18.00 - $79",
    rating: 4.5,
  },
  {
    name: "Meesho",
    categoryRelevance: ["fashion", "budget", "home", "crafts", "jewelry"],
    searchUrl: (q) => `https://www.meesho.com/search?q=${encodeURIComponent(q)}`,
    color: "from-rose-500/20 to-pink-500/20 border-rose-500/30 text-rose-600 dark:text-rose-400",
    badge: "Budget Direct",
    priceEstimate: "$8.99 - $35",
    rating: 4.3,
  },
  {
    name: "JioMart",
    categoryRelevance: ["grocery", "pharmacy", "home", "daily", "electronics"],
    searchUrl: (q) => `https://www.jiomart.com/search/${encodeURIComponent(q)}`,
    color: "from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-600 dark:text-cyan-400",
    badge: "Express Delivery",
    priceEstimate: "$5.99 - $60",
    rating: 4.4,
  },
  {
    name: "Snapdeal",
    categoryRelevance: ["general", "value", "home", "footwear", "accessories"],
    searchUrl: (q) => `https://www.snapdeal.com/search?keyword=${encodeURIComponent(q)}`,
    color: "from-red-500/20 to-amber-500/20 border-red-500/30 text-red-600 dark:text-red-400",
    badge: "Value Deals",
    priceEstimate: "$10.00 - $50",
    rating: 4.2,
  },
];

export function MarketplaceSearchCard({
  query,
  category = "general",
}: {
  query: string;
  category?: string;
}) {
  const catLower = category.toLowerCase();

  // Category-aware sorting: prioritize platforms matching category
  const sortedPlatforms = [...PLATFORMS].sort((a, b) => {
    const aMatch = a.categoryRelevance.some((c) => catLower.includes(c));
    const bMatch = b.categoryRelevance.some((c) => catLower.includes(c));
    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return 0;
  });

  return (
    <div className="w-full space-y-3 p-4 bg-surface-elevated border border-border rounded-3xl shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-accent font-bold">
          <ShoppingCart className="size-4" />
          <span>Online Marketplace Options ({sortedPlatforms.length})</span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">Category-Aware Sorted</span>
      </div>

      <p className="text-xs text-muted-foreground">
        Comparing online availability for <strong>"{query}"</strong> across major e-commerce platforms:
      </p>

      {/* Grid of Platform Outbound Search Link Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        {sortedPlatforms.map((plat) => (
          <a
            key={plat.name}
            href={plat.searchUrl(query)}
            target="_blank"
            rel="noopener noreferrer"
            className={`p-3 rounded-2xl bg-gradient-to-br ${plat.color} border transition-all duration-200 hover:scale-[1.02] hover:shadow-md flex flex-col justify-between group`}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-foreground group-hover:text-accent transition-colors">
                  {plat.name}
                </span>
                <ExternalLink className="size-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>

              {plat.badge && (
                <span className="inline-block px-2 py-0.5 rounded-full bg-background/60 border border-border text-[9px] font-mono font-semibold">
                  {plat.badge}
                </span>
              )}
            </div>

            <div className="pt-3 flex items-center justify-between text-[11px] font-mono">
              <span className="text-muted-foreground">{plat.priceEstimate}</span>
              <span className="font-bold text-foreground flex items-center gap-1 group-hover:underline">
                Search on {plat.name} →
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
