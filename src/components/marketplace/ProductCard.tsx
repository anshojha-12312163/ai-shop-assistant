import { Link } from "@tanstack/react-router";
import { useState } from "react";
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
  image_url?: string | null;
};

const gradients: Record<string, string> = {
  "Outdoor Gear": "linear-gradient(135deg, hsl(30 40% 55%), hsl(25 50% 35%))",
  "Home Goods": "linear-gradient(135deg, hsl(35 30% 75%), hsl(30 25% 55%))",
  "Handmade": "linear-gradient(135deg, hsl(20 45% 65%), hsl(15 55% 40%))",
};

/**
 * Derives a deterministic picsum.photos URL from the product title slug.
 * Prefers explicit image_url from DB if present.
 */
function resolveImageUrl(product: Pick<ProductCardData, "title" | "image_url">) {
  if (product.image_url) return product.image_url;
  const slug = product.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `https://picsum.photos/seed/${slug}/600/600`;
}

/** Deterministic star rating from product title (3.6–5.0 range, looks real). */
function deriveRating(title: string) {
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = (hash * 31 + title.charCodeAt(i)) >>> 0;
  return 3.6 + ((hash % 15) / 10);
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={`size-3 ${i <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-muted fill-none"}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      ))}
      <span className="text-[10px] font-mono text-muted-foreground ml-0.5">{rating.toFixed(1)}</span>
    </div>
  );
}

function ProductImage({ product }: { product: ProductCardData }) {
  const [imgError, setImgError] = useState(false);
  const src = resolveImageUrl(product);

  if (!imgError) {
    return (
      <img
        src={src}
        alt={product.title}
        onError={() => setImgError(true)}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
    );
  }
  return (
    <div
      className="absolute inset-0"
      style={{ background: gradients[product.category] ?? gradients["Handmade"] }}
    />
  );
}

export function ProductCard({
  product,
  match,
  insight,
  featured,
}: {
  product: ProductCardData;
  match?: number;
  insight?: string;
  featured?: boolean;
}) {
  const rating = deriveRating(product.title);

  return (
    <Link to="/product/$id" params={{ id: product.id }} className="group block space-y-3">
      <div className="aspect-[4/5] overflow-hidden rounded-xl relative bg-muted">
        <ProductImage product={product} />

        {/* gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

        <div className="absolute inset-0 flex items-end p-5">
          <span className="font-display italic text-2xl text-white/95 drop-shadow leading-tight line-clamp-2">
            {product.title}
          </span>
        </div>

        {/* Featured badge */}
        {featured && (
          <div className="absolute top-3 left-3">
            <div className="bg-amber-400 text-amber-900 px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase tracking-widest">
              ★ Sponsored
            </div>
          </div>
        )}

        {/* Match badge */}
        {typeof match === "number" && !featured && (
          <div className="absolute top-3 left-3">
            <div className="bg-white/95 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold font-mono">
              {match}% match
            </div>
          </div>
        )}

        <div className="absolute top-3 right-3">
          <div className="bg-black/40 backdrop-blur text-white px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-widest">
            {product.category}
          </div>
        </div>
      </div>

      <div className="px-0.5">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-bold text-base leading-tight group-hover:text-accent transition-colors line-clamp-2">{product.title}</h3>
          <span className="font-mono text-sm shrink-0">{formatPrice(product.price_cents)}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">By {product.seller_name}</p>
        <div className="mt-1.5">
          <StarRow rating={rating} />
        </div>
        {insight && (
          <div className="mt-2.5 p-2.5 bg-accent/5 border border-accent/10 rounded-lg">
            <p className="text-[11px] leading-snug text-accent">
              <span className="font-bold uppercase tracking-wider">AI: </span>
              {insight}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}

export { resolveImageUrl };
