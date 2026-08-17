-- Migration for In-App Shop Reviews, Verified Visits & Merchant Replies

CREATE TABLE IF NOT EXISTS public.shop_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id TEXT NOT NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  visit_confirmed BOOLEAN NOT NULL DEFAULT false,
  merchant_reply TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_shop_customer_review UNIQUE(shop_id, customer_id)
);

GRANT SELECT ON public.shop_reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.shop_reviews TO authenticated;
GRANT ALL ON public.shop_reviews TO service_role;

ALTER TABLE public.shop_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shop reviews are viewable by everyone" ON public.shop_reviews;
CREATE POLICY "Shop reviews are viewable by everyone" ON public.shop_reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert own review" ON public.shop_reviews;
CREATE POLICY "Authenticated users can insert own review" ON public.shop_reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Authors or merchants can update review" ON public.shop_reviews;
CREATE POLICY "Authors or merchants can update review" ON public.shop_reviews
  FOR UPDATE TO authenticated USING (
    auth.uid() = customer_id OR
    EXISTS (
      SELECT 1 FROM public.merchants
      WHERE merchants.id = auth.uid() AND merchants.shop_id::text = shop_reviews.shop_id
    )
  );

DROP POLICY IF EXISTS "Authors can delete own review" ON public.shop_reviews;
CREATE POLICY "Authors can delete own review" ON public.shop_reviews
  FOR DELETE TO authenticated USING (auth.uid() = customer_id);
