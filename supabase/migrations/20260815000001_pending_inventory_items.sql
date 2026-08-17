-- Migration for Pending Inventory Items (Merchant Approval Review Step)

CREATE TABLE IF NOT EXISTS public.pending_inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  raw_text_source TEXT,
  extracted_name TEXT NOT NULL,
  extracted_category TEXT NOT NULL,
  extracted_price NUMERIC(10,2) NOT NULL CHECK (extracted_price >= 0),
  extracted_quantity INTEGER NOT NULL DEFAULT 10,
  extraction_confidence TEXT NOT NULL DEFAULT 'high' CHECK (extraction_confidence IN ('high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected', 'edited_and_approved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pending_inventory_items TO authenticated;
GRANT ALL ON public.pending_inventory_items TO service_role;
ALTER TABLE public.pending_inventory_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Merchants manage own shop pending inventory" ON public.pending_inventory_items;
CREATE POLICY "Merchants manage own shop pending inventory" ON public.pending_inventory_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.merchants
      WHERE merchants.id = auth.uid() AND merchants.shop_id = pending_inventory_items.shop_id
    )
  );
