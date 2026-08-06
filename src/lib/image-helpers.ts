export function getCategoryPlaceholderSvg(category: string, shopName: string): string {
  const cat = category.toLowerCase();
  let bg = "#0F172A";
  let accent = "#0D9488";
  let iconText = "🛍️";
  let label = category || "Store";

  if (cat.includes("footwear") || cat.includes("shoe")) {
    bg = "#0F172A";
    accent = "#0D9488";
    iconText = "👟";
    label = "Footwear & Shoes";
  } else if (cat.includes("cafe") || cat.includes("coffee")) {
    bg = "#1C1917";
    accent = "#D97706";
    iconText = "☕";
    label = "Cafe & Espresso";
  } else if (cat.includes("pharmacy") || cat.includes("medicine")) {
    bg = "#022C22";
    accent = "#059669";
    iconText = "💊";
    label = "Pharmacy & Wellness";
  } else if (cat.includes("outdoor") || cat.includes("hiking")) {
    bg = "#064E3B";
    accent = "#10B981";
    iconText = "⛺";
    label = "Outdoor Adventure";
  } else if (cat.includes("home") || cat.includes("ceramic")) {
    bg = "#1E1B4B";
    accent = "#6366F1";
    iconText = "🏺";
    label = "Home & Living";
  } else if (cat.includes("fashion") || cat.includes("cloth") || cat.includes("apparel")) {
    bg = "#312E81";
    accent = "#EC4899";
    iconText = "👔";
    label = "Fashion & Apparel";
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="none">
    <rect width="600" height="400" fill="${bg}"/>
    <circle cx="300" cy="170" r="70" fill="${accent}" fill-opacity="0.15" stroke="${accent}" stroke-width="2" stroke-dasharray="6 6"/>
    <text x="300" y="188" font-size="52" text-anchor="middle" dominant-baseline="middle">${iconText}</text>
    <rect x="150" y="270" width="300" height="32" rx="16" fill="${accent}" fill-opacity="0.2" stroke="${accent}" stroke-opacity="0.4"/>
    <text x="300" y="291" font-family="Inter, sans-serif" font-size="13" font-weight="700" fill="#FAFAF9" text-anchor="middle" letter-spacing="1.5">${label.toUpperCase()}</text>
    <text x="300" y="340" font-family="Inter, sans-serif" font-size="16" font-weight="600" fill="#94A3B8" text-anchor="middle">${shopName.replace(/["'<>]/g, "")}</text>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
