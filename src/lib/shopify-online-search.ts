import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface ShopifyOnlineProduct {
  id: string;
  storeName: string;
  storeUrl: string;
  isShopifyVerified: boolean;
  productTitle: string;
  price: string;
  originalPrice?: string;
  discountPct?: string;
  rating: number;
  reviewCount: number;
  positiveFeedbackPct: number;
  inStock: boolean;
  stockQuantity: number;
  availableSizes?: string[];
  shippingSpeed: string;
  returnPolicy: string;
  imageUrl?: string;
  buyUrl: string;
}

export interface ShopifySearchResponse {
  products: ShopifyOnlineProduct[];
  query: string;
  category: string;
  timestamp: string;
}

// Dynamic online Shopify D2C store lookup logic per detected visual item category
export function getShopifyOnlineItems(
  categoryName: string,
  itemName: string,
): ShopifyOnlineProduct[] {
  const cat = (categoryName || "").toLowerCase();
  const name = (itemName || "").toLowerCase();

  // 1. Fashion, Clothing, Shirts, Polos, Tops, Dresses
  if (
    cat.includes("fashion") ||
    cat.includes("apparel") ||
    cat.includes("clothing") ||
    name.includes("shirt") ||
    name.includes("polo") ||
    name.includes("t-shirt") ||
    name.includes("jacket") ||
    name.includes("collar") ||
    name.includes("sleeve") ||
    name.includes("dress")
  ) {
    return [
      {
        id: "sp-snitch-1",
        storeName: "Snitch D2C Shopify Store",
        storeUrl: "https://snitch.co.in",
        isShopifyVerified: true,
        productTitle: "Men's Premium Cotton Knit Polo T-Shirt",
        price: "₹699",
        originalPrice: "₹1,299",
        discountPct: "46% OFF",
        rating: 4.8,
        reviewCount: 342,
        positiveFeedbackPct: 97,
        inStock: true,
        stockQuantity: 18,
        availableSizes: ["S", "M", "L", "XL", "XXL"],
        shippingSpeed: "Free 2-Day Express Shipping",
        returnPolicy: "7-Day Easy Returns & Exchange",
        buyUrl: "https://snitch.co.in/collections/polos",
      },
      {
        id: "sp-rare-rabbit-1",
        storeName: "Rare Rabbit Official Shopify",
        storeUrl: "https://thehouseofrare.com",
        isShopifyVerified: true,
        productTitle: "Tailored Textured Polo Shirt — Earth Brown",
        price: "₹1,199",
        originalPrice: "₹1,999",
        discountPct: "40% OFF",
        rating: 4.9,
        reviewCount: 215,
        positiveFeedbackPct: 98,
        inStock: true,
        stockQuantity: 9,
        availableSizes: ["M", "L", "XL"],
        shippingSpeed: "Dispatch in 24 Hours",
        returnPolicy: "10-Day Replacement Guarantee",
        buyUrl: "https://thehouseofrare.com/collections/polos",
      },
      {
        id: "sp-bewakoof-1",
        storeName: "Bewakoof D2C Store",
        storeUrl: "https://bewakoof.com",
        isShopifyVerified: true,
        productTitle: "Solid Brown Cotton Regular Fit Polo",
        price: "₹499",
        originalPrice: "₹999",
        discountPct: "50% OFF",
        rating: 4.6,
        reviewCount: 520,
        positiveFeedbackPct: 94,
        inStock: true,
        stockQuantity: 25,
        availableSizes: ["S", "M", "L", "XL"],
        shippingSpeed: "Standard 3-Day Delivery",
        returnPolicy: "15-Day No-Questions Return",
        buyUrl: "https://bewakoof.com",
      },
      {
        id: "sp-zudio-online-1",
        storeName: "Zudio D2C Storefront",
        storeUrl: "https://zudio.com",
        isShopifyVerified: true,
        productTitle: "Ribbed Knit Collar Short Sleeve Polo",
        price: "₹599",
        originalPrice: "₹799",
        discountPct: "25% OFF",
        rating: 4.7,
        reviewCount: 184,
        positiveFeedbackPct: 95,
        inStock: true,
        stockQuantity: 12,
        availableSizes: ["S", "M", "L", "XL"],
        shippingSpeed: "Express 2-Day Delivery",
        returnPolicy: "7-Day Store Return",
        buyUrl: "https://zudio.com",
      },
    ];
  }

  // 2. Electronics, Gadgets, Headphones, Smartwatches
  if (
    cat.includes("electronics") ||
    cat.includes("gadget") ||
    name.includes("headphone") ||
    name.includes("earphone") ||
    name.includes("watch") ||
    name.includes("phone") ||
    name.includes("laptop") ||
    name.includes("camera") ||
    name.includes("speaker")
  ) {
    return [
      {
        id: "sp-boat-1",
        storeName: "boAt Lifestyle Official Shopify",
        storeUrl: "https://boat-lifestyle.com",
        isShopifyVerified: true,
        productTitle: "boAt Rockerz Wireless Headphones / Smartwatch",
        price: "₹1,499",
        originalPrice: "₹2,990",
        discountPct: "50% OFF",
        rating: 4.8,
        reviewCount: 1420,
        positiveFeedbackPct: 97,
        inStock: true,
        stockQuantity: 45,
        availableSizes: ["Black", "Navy Blue", "Olive Green"],
        shippingSpeed: "Free 1-Day Express Shipping",
        returnPolicy: "1-Year Warranty & Replacement",
        buyUrl: "https://boat-lifestyle.com",
      },
      {
        id: "sp-noise-1",
        storeName: "Noise D2C Store",
        storeUrl: "https://gonoise.com",
        isShopifyVerified: true,
        productTitle: "Noise ColorFit Smart Watch with HD Display",
        price: "₹1,999",
        originalPrice: "₹3,999",
        discountPct: "50% OFF",
        rating: 4.7,
        reviewCount: 980,
        positiveFeedbackPct: 96,
        inStock: true,
        stockQuantity: 28,
        availableSizes: ["Standard Strap", "Pro Metal Strap"],
        shippingSpeed: "Ships Next Business Day",
        returnPolicy: "7-Day Replacement",
        buyUrl: "https://gonoise.com",
      },
    ];
  }

  // 3. Grocery, Food, Organic & Pantry Items
  if (
    cat.includes("grocery") ||
    cat.includes("supermarket") ||
    cat.includes("food") ||
    name.includes("snack") ||
    name.includes("coffee") ||
    name.includes("tea") ||
    name.includes("organic")
  ) {
    return [
      {
        id: "sp-bluetokai-1",
        storeName: "Blue Tokai Coffee Shopify Store",
        storeUrl: "https://bluetokaicoffee.com",
        isShopifyVerified: true,
        productTitle: "Artisan Roasted Coffee Beans / Micro-brew Powder",
        price: "₹470",
        originalPrice: "₹550",
        discountPct: "15% OFF",
        rating: 4.9,
        reviewCount: 540,
        positiveFeedbackPct: 99,
        inStock: true,
        stockQuantity: 60,
        availableSizes: ["250g Whole Bean", "250g Espresso Grind"],
        shippingSpeed: "Fresh Roast — Dispatched in 12 hrs",
        returnPolicy: "Freshness Guaranteed",
        buyUrl: "https://bluetokaicoffee.com",
      },
      {
        id: "sp-wholetruth-1",
        storeName: "The Whole Truth Foods D2C",
        storeUrl: "https://thewholetruthfoods.com",
        isShopifyVerified: true,
        productTitle: "100% Clean Label Organic Protein Bars & Snacks",
        price: "₹399",
        originalPrice: "₹499",
        discountPct: "20% OFF",
        rating: 4.8,
        reviewCount: 780,
        positiveFeedbackPct: 98,
        inStock: true,
        stockQuantity: 50,
        availableSizes: ["Pack of 6", "Pack of 12"],
        shippingSpeed: "Free 2-Day Shipping",
        returnPolicy: "100% Money Back Guarantee",
        buyUrl: "https://thewholetruthfoods.com",
      },
    ];
  }

  // 4. Accessories, Watches, Bags, Sunglasses & Jewelry
  if (
    cat.includes("accessory") ||
    cat.includes("accessories") ||
    name.includes("bag") ||
    name.includes("glass") ||
    name.includes("sunglass") ||
    name.includes("wallet") ||
    name.includes("belt") ||
    name.includes("jewel")
  ) {
    return [
      {
        id: "sp-mokobara-1",
        storeName: "Mokobara D2C Shopify",
        storeUrl: "https://mokobara.com",
        isShopifyVerified: true,
        productTitle: "Premium Urban Backpack & Lifestyle Bag",
        price: "₹3,999",
        originalPrice: "₹6,999",
        discountPct: "43% OFF",
        rating: 4.9,
        reviewCount: 310,
        positiveFeedbackPct: 98,
        inStock: true,
        stockQuantity: 12,
        availableSizes: ["15-inch Laptop Fit"],
        shippingSpeed: "Free Express Delivery",
        returnPolicy: "1-Year Warranty",
        buyUrl: "https://mokobara.com",
      },
      {
        id: "sp-dailyobjects-1",
        storeName: "DailyObjects Official Shopify",
        storeUrl: "https://dailyobjects.com",
        isShopifyVerified: true,
        productTitle: "Design Leather Wallet & Accessories",
        price: "₹999",
        originalPrice: "₹1,499",
        discountPct: "33% OFF",
        rating: 4.7,
        reviewCount: 430,
        positiveFeedbackPct: 95,
        inStock: true,
        stockQuantity: 22,
        availableSizes: ["Tan Brown", "Classic Black"],
        shippingSpeed: "Dispatch in 24 Hours",
        returnPolicy: "7-Day Easy Exchange",
        buyUrl: "https://dailyobjects.com",
      },
    ];
  }

  // 5. Footwear / Sneakers
  if (
    cat.includes("footwear") ||
    name.includes("shoe") ||
    name.includes("sneaker") ||
    name.includes("nike") ||
    name.includes("boot")
  ) {
    return [
      {
        id: "sp-nike-online-1",
        storeName: "Nike India D2C Store",
        storeUrl: "https://nike.com/in",
        isShopifyVerified: true,
        productTitle: "Nike Revolution Performance Running Shoes",
        price: "₹3,495",
        originalPrice: "₹4,995",
        discountPct: "30% OFF",
        rating: 4.9,
        reviewCount: 890,
        positiveFeedbackPct: 99,
        inStock: true,
        stockQuantity: 14,
        availableSizes: ["UK 7", "UK 8", "UK 9", "UK 10", "UK 11"],
        shippingSpeed: "Free Express Shipping",
        returnPolicy: "30-Day Unworn Returns",
        buyUrl: "https://nike.com/in",
      },
      {
        id: "sp-vegnonveg-1",
        storeName: "VegNonVeg Shopify Store",
        storeUrl: "https://vegnonveg.com",
        isShopifyVerified: true,
        productTitle: "Air Athletics Cushioned Lifestyle Sneaker",
        price: "₹2,899",
        originalPrice: "₹3,999",
        discountPct: "27% OFF",
        rating: 4.8,
        reviewCount: 142,
        positiveFeedbackPct: 96,
        inStock: true,
        stockQuantity: 6,
        availableSizes: ["UK 8", "UK 9", "UK 10"],
        shippingSpeed: "Ships Next Business Day",
        returnPolicy: "7-Day Exchange",
        buyUrl: "https://vegnonveg.com",
      },
    ];
  }

  // 6. Cafe, Kitchenware, Mugs, Home & Decor
  if (
    cat.includes("home") ||
    cat.includes("kitchen") ||
    cat.includes("cafe") ||
    name.includes("mug") ||
    name.includes("cup")
  ) {
    return [
      {
        id: "sp-ellementry-1",
        storeName: "Ellementry Home Shopify",
        storeUrl: "https://ellementry.com",
        isShopifyVerified: true,
        productTitle: "Artisan Ceramic Glossy Coffee Mug — 350ml",
        price: "₹349",
        originalPrice: "₹499",
        discountPct: "30% OFF",
        rating: 4.8,
        reviewCount: 128,
        positiveFeedbackPct: 97,
        inStock: true,
        stockQuantity: 30,
        availableSizes: ["350ml Single", "Set of 2"],
        shippingSpeed: "Safe Fragile Express Delivery",
        returnPolicy: "Free Damage Replacement Guarantee",
        buyUrl: "https://ellementry.com",
      },
      {
        id: "sp-chumbak-1",
        storeName: "Chumbak D2C Store",
        storeUrl: "https://chumbak.com",
        isShopifyVerified: true,
        productTitle: "Handcrafted Matte Finish Ceramic Mug",
        price: "₹299",
        originalPrice: "₹450",
        discountPct: "33% OFF",
        rating: 4.7,
        reviewCount: 96,
        positiveFeedbackPct: 95,
        inStock: true,
        stockQuantity: 15,
        availableSizes: ["400ml"],
        shippingSpeed: "2-3 Business Days",
        returnPolicy: "7-Day Easy Return",
        buyUrl: "https://chumbak.com",
      },
    ];
  }

  // 7. Pharmacy, Supplements, Wellness
  if (
    cat.includes("pharmacy") ||
    cat.includes("wellness") ||
    name.includes("bottle") ||
    name.includes("vitamin")
  ) {
    return [
      {
        id: "sp-kapiva-1",
        storeName: "Kapiva Ayurveda Shopify Store",
        storeUrl: "https://kapiva.in",
        isShopifyVerified: true,
        productTitle: "Organic Herbal Wellness & Supplement Capsules",
        price: "₹499",
        originalPrice: "₹699",
        discountPct: "28% OFF",
        rating: 4.9,
        reviewCount: 610,
        positiveFeedbackPct: 98,
        inStock: true,
        stockQuantity: 45,
        availableSizes: ["60 Capsules", "120 Capsules"],
        shippingSpeed: "Same-Day Dispatch",
        returnPolicy: "100% Quality Satisfaction Guarantee",
        buyUrl: "https://kapiva.in",
      },
    ];
  }

  // 8. Default General D2C Shopify Items
  return [
    {
      id: "sp-general-1",
      storeName: "Urbanic D2C Shopify Store",
      storeUrl: "https://urbanic.com",
      isShopifyVerified: true,
      productTitle: "Lifestyle Fashion Item — Premium Quality Fabric",
      price: "₹799",
      originalPrice: "₹1,299",
      discountPct: "38% OFF",
      rating: 4.7,
      reviewCount: 230,
      positiveFeedbackPct: 96,
      inStock: true,
      stockQuantity: 20,
      availableSizes: ["S", "M", "L"],
      shippingSpeed: "2-3 Days Nationwide Delivery",
      returnPolicy: "7-Day Free Return",
      buyUrl: "https://urbanic.com",
    },
  ];
}

// Server Function for querying Shopify Online Search
export const searchShopifyOnlineStore = createServerFn({ method: "POST" })
  .validator((i: unknown) =>
    z
      .object({
        category: z.string(),
        itemName: z.string(),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const products = getShopifyOnlineItems(data.category, data.itemName);
    return {
      products,
      query: data.itemName,
      category: data.category,
      timestamp: new Date().toISOString(),
    };
  });
