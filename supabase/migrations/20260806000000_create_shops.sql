-- Create shops table for local shop assistant search
CREATE TABLE IF NOT EXISTS public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  address TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  rating NUMERIC(3,1) NOT NULL DEFAULT 4.5,
  review_count INTEGER NOT NULL DEFAULT 0,
  open_now BOOLEAN NOT NULL DEFAULT true,
  phone TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS & Grants
GRANT SELECT ON public.shops TO anon, authenticated;
GRANT ALL ON public.shops TO service_role;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shops are viewable by everyone" ON public.shops;
CREATE POLICY "Shops are viewable by everyone" ON public.shops FOR SELECT USING (true);

-- Seed realistic local shops across categories
INSERT INTO public.shops (name, category, description, keywords, address, lat, lng, rating, review_count, open_now, phone, image_url) VALUES
('Sole Craft Athletics', 'Footwear', 'Artisan sneaker & performance running shoe boutiuqe featuring custom fitting and top athletic brands.', ARRAY['shoes','sneakers','running','footwear','boots','kicks'], '412 Pike St, Seattle, WA 98101', 47.6101, -122.3365, 4.9, 128, true, '(206) 555-0192', 'https://picsum.photos/seed/sole-craft/600/400'),
('Urban Step Footwear', 'Footwear', 'Curated leather boots, casual sneakers, and comfortable daily footwear.', ARRAY['shoes','boots','leather','footwear','loafers'], '1501 4th Ave, Seattle, WA 98101', 47.6112, -122.3378, 4.7, 85, true, '(206) 555-0144', 'https://picsum.photos/seed/urban-step/600/400'),
('Cobbler & Leather Workshop', 'Footwear', 'Bespoke hand-cobbled boots, dress shoes, and shoe repair service.', ARRAY['shoes','boots','cobbler','leather','repair','handcrafted'], '88 Yesler Way, Seattle, WA 98104', 47.6018, -122.3340, 4.8, 64, true, '(206) 555-0188', 'https://picsum.photos/seed/cobbler-leather/600/400'),

('Apothecary & Wellness Co.', 'Pharmacy', 'Full-service pharmacy offering natural wellness products, prescription meds, and skincare.', ARRAY['pharmacy','medicine','health','wellness','vitamins','prescriptions','apothecary'], '1215 4th Ave, Seattle, WA 98101', 47.6088, -122.3352, 4.8, 210, true, '(206) 555-0320', 'https://picsum.photos/seed/apothecary-wellness/600/400'),
('Corner Care Pharmacy', 'Pharmacy', 'Neighborhood drugstore with fast prescriptions, personal care supplies, and first-aid items.', ARRAY['pharmacy','medicine','drugstore','first-aid','health','bandages'], '701 5th Ave, Seattle, WA 98104', 47.6044, -122.3312, 4.6, 94, true, '(206) 555-0355', 'https://picsum.photos/seed/corner-pharmacy/600/400'),
('Green Cross Chemist', 'Pharmacy', 'Compounding pharmacy & holistic health store stocking organic supplements and medicines.', ARRAY['pharmacy','medicine','chemist','holistic','supplements','health'], '1904 3rd Ave, Seattle, WA 98101', 47.6129, -122.3402, 4.7, 142, false, '(206) 555-0388', 'https://picsum.photos/seed/green-cross/600/400'),

('Velvet Espresso Bar', 'Cafe', 'Specialty coffee shop serving single-origin pour-overs, espresso, and matcha in a minimalist interior.', ARRAY['cafe','coffee','espresso','latte','pastries','bakery','matcha'], '1400 2nd Ave, Seattle, WA 98101', 47.6090, -122.3385, 4.9, 340, true, '(206) 555-0410', 'https://picsum.photos/seed/velvet-espresso/600/400'),
('Roast & Grind Craft Cafe', 'Cafe', 'Industrial chic cafe with house-roasted beans, sourdough toasts, and artisanal teas.', ARRAY['cafe','coffee','roasters','breakfast','tea','toast'], '1912 1st Ave, Seattle, WA 98101', 47.6115, -122.3430, 4.8, 275, true, '(206) 555-0442', 'https://picsum.photos/seed/roast-grind/600/400'),
('Artisan Bakery & Cafe', 'Cafe', 'Freshly baked croissants, sourdough bread, espresso, and lunch sandwiches.', ARRAY['cafe','bakery','coffee','croissants','bread','sandwiches','breakfast'], '2001 Western Ave, Seattle, WA 98121', 47.6119, -122.3448, 4.7, 195, true, '(206) 555-0477', 'https://picsum.photos/seed/artisan-bakery/600/400'),

('Cascade Mountain Outfitters', 'Outdoor Gear', 'Premium hiking boots, technical rain jackets, tents, and trail accessories for the Pacific Northwest.', ARRAY['outdoor','hiking','jacket','camping','backpack','boots','gear'], '1530 Post Alley, Seattle, WA 98101', 47.6098, -122.3412, 4.9, 180, true, '(206) 555-0511', 'https://picsum.photos/seed/cascade-outfitters/600/400'),
('North Ridge Trail Co.', 'Outdoor Gear', 'Lightweight backpacking equipment, titanium cookware, wool base layers, and outdoor apparel.', ARRAY['outdoor','backpacking','ultralight','cook-kit','merino','hiking'], '2200 4th Ave, Seattle, WA 98121', 47.6152, -122.3435, 4.8, 115, true, '(206) 555-0566', 'https://picsum.photos/seed/north-ridge-trail/600/400'),

('Ember Home & Ceramics', 'Home Goods', 'Hand-thrown ceramics, Belgian linen, beeswax candles, and curated kitchenware for modern living.', ARRAY['home','ceramics','pottery','linen','candles','kitchen','decor'], '1417 1st Ave, Seattle, WA 98101', 47.6085, -122.3392, 4.9, 162, true, '(206) 555-0622', 'https://picsum.photos/seed/ember-home/600/400'),
('Linden Living Goods', 'Home Goods', 'Sustainable home decor, handcrafted walnut cutting boards, woven blankets, and tabletop pieces.', ARRAY['home','decor','walnut','blankets','towels','handcrafted'], '1901 2nd Ave, Seattle, WA 98101', 47.6120, -122.3415, 4.7, 98, true, '(206) 555-0688', 'https://picsum.photos/seed/linden-living/600/400');
