-- Migration for Merchant App, Inventory Confidence Score, Search Leads & Reservations

-- 1. MERCHANTS TABLE
CREATE TABLE IF NOT EXISTS public.merchants (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL,
  business_name TEXT NOT NULL,
  phone TEXT,
  whatsapp_number TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
  subscription_status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.merchants TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.merchants TO authenticated;
GRANT ALL ON public.merchants TO service_role;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Merchants can read/write own record" ON public.merchants;
CREATE POLICY "Merchants can read/write own record" ON public.merchants
  FOR ALL USING (auth.uid() = id);

-- 2. INVENTORY ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  status TEXT NOT NULL DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'low_stock', 'out_of_stock')),
  image_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
GRANT SELECT ON public.inventory_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.inventory_items TO authenticated;
GRANT ALL ON public.inventory_items TO service_role;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Inventory viewable by everyone" ON public.inventory_items;
CREATE POLICY "Inventory viewable by everyone" ON public.inventory_items
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Merchants manage own shop inventory" ON public.inventory_items;
CREATE POLICY "Merchants manage own shop inventory" ON public.inventory_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.merchants
      WHERE merchants.id = auth.uid() AND merchants.shop_id = inventory_items.shop_id
    )
  );

-- 3. RESERVATIONS TABLE
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'expired', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '45 minutes'),
  confirmed_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE ON public.reservations TO authenticated;
GRANT ALL ON public.reservations TO service_role;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view/manage own reservations" ON public.reservations;
CREATE POLICY "Customers can view/manage own reservations" ON public.reservations
  FOR ALL USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Merchants can view/manage shop reservations" ON public.reservations;
CREATE POLICY "Merchants can view/manage shop reservations" ON public.reservations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.merchants
      WHERE merchants.id = auth.uid() AND merchants.shop_id = reservations.shop_id
    )
  );

-- 4. SEARCH LEADS TABLE
CREATE TABLE IF NOT EXISTS public.search_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  query_text TEXT NOT NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.search_leads TO anon, authenticated;
GRANT ALL ON public.search_leads TO service_role;
ALTER TABLE public.search_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leads insertable by anyone" ON public.search_leads;
CREATE POLICY "Leads insertable by anyone" ON public.search_leads FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Merchants can view own shop search leads" ON public.search_leads;
CREATE POLICY "Merchants can view own shop search leads" ON public.search_leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.merchants
      WHERE merchants.id = auth.uid() AND merchants.shop_id = search_leads.shop_id
    )
  );

-- 5. SPONSORED SHOPS COLUMN
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS sponsored_until TIMESTAMPTZ;

-- 6. SEED SAMPLE INVENTORY & SEARCH LEADS FOR DEMO
DO $$
DECLARE
  sole_craft_id UUID;
  zudio_shop_id UUID;
BEGIN
  SELECT id INTO sole_craft_id FROM public.shops WHERE name LIKE '%Sole Craft%' LIMIT 1;
  SELECT id INTO zudio_shop_id FROM public.shops WHERE name LIKE '%Zudio%' OR name LIKE '%Urban Step%' LIMIT 1;

  IF sole_craft_id IS NOT NULL THEN
    INSERT INTO public.inventory_items (shop_id, product_name, category, price, status, image_url, updated_at) VALUES
    (sole_craft_id, 'Sole Craft Pro Trail Runners', 'Footwear', 1499.00, 'in_stock', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80', now() - INTERVAL '10 minutes'),
    (sole_craft_id, 'Cobbler Leather Waterproof Boots', 'Footwear', 3499.00, 'low_stock', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80', now() - INTERVAL '4 hours'),
    (sole_craft_id, 'Urban Minimal Canvas Low-Tops', 'Footwear', 1299.00, 'out_of_stock', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=80', now() - INTERVAL '2 days');

    INSERT INTO public.search_leads (shop_id, query_text, created_at) VALUES
    (sole_craft_id, 'running shoes near Jalandhar', now() - INTERVAL '1 hour'),
    (sole_craft_id, 'trail hiking sneakers', now() - INTERVAL '3 hours'),
    (sole_craft_id, 'leather boots size 9', now() - INTERVAL '1 day');
  END IF;

  IF zudio_shop_id IS NOT NULL THEN
    -- Mark shop as sponsored for 30 days
    UPDATE public.shops SET sponsored_until = now() + INTERVAL '30 days' WHERE id = zudio_shop_id;

    INSERT INTO public.inventory_items (shop_id, product_name, category, price, status, image_url, updated_at) VALUES
    (zudio_shop_id, 'Zudio Casual Streetwear Sneakers', 'Footwear', 1499.00, 'in_stock', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80', now() - INTERVAL '15 minutes'),
    (zudio_shop_id, 'Lightweight Breathable Canvas Kicks', 'Footwear', 999.00, 'in_stock', 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&auto=format&fit=crop&q=80', now() - INTERVAL '50 minutes');
  END IF;
END $$;
