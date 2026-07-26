import { Link } from "@tanstack/react-router";
import { formatPrice } from "@/lib/cart";

export type ProductCardData = {
  id: string;
  title: string;
  seller_name: string;
  price_cents: number;
  category: string;
  ai_summary?: string | null;
  material?: string | null;
  tags?: string[] | null;
};

const gradients: Record<string, string> = {
  "Outdoor Gear": "linear-gradient(135deg, hsl(30 40% 55%), hsl(25 50% 35%))",
  "Home Goods": "linear-gradient(135deg, hsl(35 30% 75%), hsl(30 25% 55%))",
  "Handmade": "linear-gradient(135deg, hsl(20 45% 65%), hsl(15 55% 40%))",
};

export function ProductCard({
  product,
  match,
  insight,
}: {
  product: ProductCardData;
  match?: number;
  insight?: string;
}) {
  return (
    <Link to="/product/$id" params={{ id: product.id }} className="group block space-y-4">
      <div
        className="aspect-[4/5] overflow-hidden rounded-xl relative"
        style={{ background: gradients[product.category] ?? gradients["Handmade"] }}
      >
        <div className="absolute inset-0 flex items-end p-6">
          <span className="font-display italic text-3xl text-white/95 drop-shadow leading-tight">
            {product.title}
          </span>
        </div>
        {typeof match === "number" && (
          <div className="absolute top-4 left-4">
            <div className="bg-white/95 backdrop-blur px-2 py-1 rounded text-[10px] font-bold font-mono">
              {match}% MATCH
            </div>
          </div>
        )}
        <div className="absolute top-4 right-4">
          <div className="bg-black/40 backdrop-blur text-white px-2 py-1 rounded text-[9px] font-mono uppercase tracking-widest">
            {product.category}
          </div>
        </div>
      </div>
      <div>
        <div className="flex justify-between items-start gap-3">
          <h3 className="font-bold text-lg leading-tight group-hover:text-accent transition-colors">{product.title}</h3>
          <span className="font-mono text-sm shrink-0">{formatPrice(product.price_cents)}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">By {product.seller_name}</p>
        {insight && (
          <div className="mt-3 p-3 bg-accent/5 border border-accent/10 rounded-lg">
            <p className="text-[11px] leading-snug text-accent">
              <span className="font-bold uppercase tracking-wider">AI Insight: </span>
              {insight}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
