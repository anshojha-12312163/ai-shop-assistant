
-- ROLES
CREATE TYPE public.app_role AS ENUM ('buyer', 'seller', 'admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile + default buyer role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'buyer');
  IF (NEW.raw_user_meta_data->>'is_seller')::boolean IS TRUE THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'seller');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PRODUCTS
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  seller_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  category TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT,
  ai_summary TEXT,
  material TEXT,
  in_stock INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Sellers can insert own products" ON public.products FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update own products" ON public.products FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can delete own products" ON public.products FOR DELETE USING (auth.uid() = seller_id);

-- REVIEWS
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT NOT NULL,
  verified_purchase BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can add reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (true);

-- ORDERS
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buyers see own orders" ON public.orders FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Buyers create own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- QUESTIONS (buyer Q&A on listings)
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  buyer_name TEXT NOT NULL,
  question TEXT NOT NULL,
  ai_draft_answer TEXT,
  seller_answer TEXT,
  ai_confidence NUMERIC(3,2),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.questions TO authenticated;
GRANT SELECT ON public.questions TO anon;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Questions viewable by everyone" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Authenticated can ask" ON public.questions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Seller can answer own product questions" ON public.questions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = questions.product_id AND p.seller_id = auth.uid())
);

-- SEED 30 PRODUCTS
INSERT INTO public.products (seller_name, title, description, price_cents, category, tags, material, ai_summary) VALUES
-- Outdoor Gear (10)
('Iron & Oak Forge', 'The Heritage Scout Pack', 'An 18oz waxed canvas rucksack with solid brass hardware and full-grain leather straps. Fits a 16" laptop in a dedicated padded sleeve. Ages beautifully with a patina that gets better with every mile.', 28500, 'Outdoor Gear', ARRAY['backpack','canvas','heritage','laptop'], 'Waxed canvas + brass', 'Vintage-look daypack that hides serious tech-ready protection.'),
('Studio Monochrome', 'Archaic Field Bag', 'Charcoal recycled ocean plastic canvas with a minimalist roll-top. Water-resistant to IPX4 and reinforced at every stress point.', 21000, 'Outdoor Gear', ARRAY['roll-top','recycled','minimalist','waterproof'], 'Recycled ocean canvas', 'Sustainable urban commuter with roll-top versatility.'),
('Cascade Supply Co.', 'Alpine Shell Jacket', 'Three-layer waterproof shell rated for 20,000mm hydrostatic head. Pit zips, storm hood, and taped seams. Under 12oz packed.', 32000, 'Outdoor Gear', ARRAY['jacket','waterproof','hiking','lightweight'], 'Recycled ripstop nylon', 'Serious wet-weather protection without the weight.'),
('Cascade Supply Co.', 'Base Camp Merino Crew', '260gsm merino wool crewneck. Thermoregulating, naturally odor-resistant, and machine washable on cold.', 12800, 'Outdoor Gear', ARRAY['merino','base-layer','warm'], 'ZQ-certified merino wool', 'Cold-weather workhorse that pulls double-duty in town.'),
('North Ridge Works', 'Titanium Trail Cook Kit', '450ml titanium pot, folding spork, and windscreen. 4.2oz total. Nests around a fuel canister.', 8900, 'Outdoor Gear', ARRAY['titanium','cook-kit','ultralight'], 'Grade 1 titanium', 'Ultralight backpacking essentials that will outlast a decade.'),
('Fern & Flint', 'Waxed Canvas Bedroll', 'Traditional cowboy-style bedroll in 24oz waxed duck canvas with wool blanket lining. Rolls to a compact bundle with leather straps.', 41000, 'Outdoor Gear', ARRAY['bedroll','canvas','camping','heritage'], 'Waxed duck canvas', 'Classic overlanding sleep system built to last generations.'),
('Fern & Flint', 'Copper Camp Kettle', 'Hand-hammered copper kettle with a bail handle that folds flat. Holds 1L and heats fast over a fire.', 14500, 'Outdoor Gear', ARRAY['kettle','copper','fire-cooking'], 'Solid copper', 'A campfire heirloom that develops character with use.'),
('Cascade Supply Co.', 'Trailhead Rain Poncho', 'Waxed cotton poncho with brass snaps. Doubles as a groundsheet or lean-to shelter. Old-school and repairable.', 16800, 'Outdoor Gear', ARRAY['poncho','waxed-cotton','multi-use'], 'Waxed cotton', 'Simple, ancient tech that just works when it pours.'),
('North Ridge Works', 'Basalt Trekking Poles', 'Hand-turned ash wood shafts with brass ferrules and cork grips. Not the lightest, but silent and satisfying.', 19500, 'Outdoor Gear', ARRAY['trekking','wood','handmade'], 'Ash wood + brass', 'Rejects the aluminum-and-plastic hiking aesthetic entirely.'),
('Iron & Oak Forge', 'Buckskin Belt Knife', 'Full-tang 3.5" carbon steel blade with a stacked leather handle. Comes with a hand-stitched sheath.', 22000, 'Outdoor Gear', ARRAY['knife','carbon-steel','edc'], '1095 carbon steel', 'A field knife your grandkids will still be sharpening.'),

-- Home Goods (10)
('Ember Ceramics', 'Hand-Thrown Hearth Pitcher', '1.2L stoneware pitcher with a matte earth glaze and generous pouring lip. Each one slightly different by hand.', 8400, 'Home Goods', ARRAY['ceramic','stoneware','pitcher','handmade'], 'Stoneware', 'A daily-use piece with sculptural presence on the counter.'),
('Ember Ceramics', 'Speckled Breakfast Bowl Set', 'Set of four 16oz bowls in speckled cream. Microwave and dishwasher safe despite the artisan finish.', 12000, 'Home Goods', ARRAY['bowls','ceramic','breakfast','set'], 'Speckled stoneware', 'Everyday tableware with a hand-thrown soul.'),
('Linden & Loom', 'French Linen Duvet Cover', 'Stone-washed 100% Belgian flax linen. Gets softer with every wash. Queen size, with hidden button closure.', 32000, 'Home Goods', ARRAY['linen','bedding','duvet'], 'Belgian flax linen', 'Bedding that quietly transforms a bedroom.'),
('Linden & Loom', 'Waffle Bath Towel', '600gsm cotton waffle weave. Fast-drying and gets more absorbent with every use.', 6800, 'Home Goods', ARRAY['towel','waffle','cotton'], 'Long-staple cotton', 'Spa-hotel absorbency in a considered weave.'),
('Copper & Cane', 'Brass Candlestick Trio', 'Solid brass candlesticks in three heights (4", 6", 9"). Weighted base, no wobble. Ages to a rich patina.', 14800, 'Home Goods', ARRAY['brass','candlestick','tabletop'], 'Solid brass', 'Sculptural centerpiece that never goes out of style.'),
('Copper & Cane', 'Walnut Bread Board', 'End-grain black walnut cutting board with rubber feet. 18" x 12" x 1.5". Reversible.', 15500, 'Home Goods', ARRAY['walnut','cutting-board','kitchen'], 'Black walnut', 'Kitchen anchor that becomes a serving surface for guests.'),
('Meadow & Moss', 'Sheepskin Throw', 'Ethically sourced New Zealand sheepskin throw. Silky, warm, and 4ft long. Naturally hypoallergenic.', 24000, 'Home Goods', ARRAY['sheepskin','throw','warm'], 'New Zealand sheepskin', 'The one piece that always gets touched when guests visit.'),
('Ember Ceramics', 'Ritual Tea Set', 'Two 6oz cups, one 12oz teapot, and a bamboo tray. Iron-oxide glaze in charcoal.', 18500, 'Home Goods', ARRAY['tea','ceramic','ritual','set'], 'Iron-oxide stoneware', 'A slow-morning ritual designed to be handled every day.'),
('Copper & Cane', 'Solid Oak Spice Rack', 'Wall-mounted white oak rack that holds 12 glass jars (included). Refillable and labeled.', 11800, 'Home Goods', ARRAY['oak','spice','organizer'], 'White oak + glass', 'Kitchen storage that looks like furniture.'),
('Linden & Loom', 'Turkish Cotton Blanket', 'Handwoven cotton blanket with a subtle stripe. Reversible, lightweight, and gets softer with age.', 9600, 'Home Goods', ARRAY['blanket','cotton','turkish'], 'Turkish cotton', 'The three-season blanket that lives on your couch.'),

-- Handmade (10)
('Waxwing Studio', 'Hand-Poured Beeswax Tapers', 'Set of six 10" beeswax candles hand-poured in small batches. Burns clean with a natural honey scent.', 4200, 'Handmade', ARRAY['candles','beeswax','handmade'], '100% beeswax', 'Handmade tapers that feel like a small ceremony.'),
('Waxwing Studio', 'Botanical Soy Candle', '8oz soy candle scented with juniper, cedar, and black pepper. 50-hour burn in a reusable amber glass.', 3800, 'Handmade', ARRAY['candle','soy','botanical'], 'Soy wax + essential oils', 'Winter cabin in a jar.'),
('Threadbare Bindery', 'Hand-Bound Notebook', 'A5 blank notebook with 160 pages of Italian paper and a hand-marbled endsheet. Coptic-stitched by hand.', 6200, 'Handmade', ARRAY['notebook','bookbinding','stationery'], 'Italian paper + linen thread', 'A working notebook that will still be readable in 50 years.'),
('Threadbare Bindery', 'Leather Journal Wrap', 'Full-grain vegetable-tanned leather wrap that holds a passport, notebook, and pen. Ages to a rich patina.', 9800, 'Handmade', ARRAY['leather','journal','travel'], 'Vegetable-tanned leather', 'The travel companion that gets more beautiful with every trip.'),
('Kiln + Kettle', 'Ceramic Pour-Over Set', 'Handmade porcelain V60-style dripper and 300ml server. Optimized for a 15-20g brew.', 11400, 'Handmade', ARRAY['coffee','pour-over','ceramic'], 'Porcelain', 'Slow coffee ritual, engineered by a maker who drinks it daily.'),
('Wild Iron Co.', 'Forged Steel Bottle Opener', 'Hand-forged from a single piece of steel. Each one unique. Weighted for satisfying leverage.', 2800, 'Handmade', ARRAY['blacksmith','forged','bottle-opener'], 'Hand-forged steel', 'The kind of small tool you keep for 40 years.'),
('Wild Iron Co.', 'Blacksmith Fire Poker', 'Traditional twisted-shaft fire poker with a hooked end. 32" long, made to last.', 8800, 'Handmade', ARRAY['blacksmith','fire','fireplace'], 'Hand-forged mild steel', 'Turns tending a fire into a satisfying, physical practice.'),
('Kiln + Kettle', 'Stoneware Butter Crock', 'French-style water-seal butter keeper. Holds one stick, keeps it spreadable at room temp.', 5400, 'Handmade', ARRAY['ceramic','butter','kitchen'], 'Stoneware', 'The small kitchen upgrade with a disproportionate impact.'),
('Waxwing Studio', 'Herbal Bath Soak', 'Small-batch bath soak of Epsom salt, lavender, chamomile, and rose petals. 12oz muslin bag.', 3400, 'Handmade', ARRAY['bath','herbal','wellness'], 'Epsom salt + botanicals', 'A weeknight ritual in a linen pouch.'),
('Threadbare Bindery', 'Letterpress Card Set', 'Set of 10 letterpress-printed greeting cards on cotton paper. Blank inside. With matching envelopes.', 3200, 'Handmade', ARRAY['stationery','letterpress','cards'], 'Cotton paper', 'Handwritten notes that feel like they matter again.');

-- Seed a few reviews
INSERT INTO public.reviews (product_id, reviewer_name, rating, body)
SELECT id, 'M.K.', 5, 'Better patina than advertised. Stitching is unreal.' FROM public.products WHERE title = 'The Heritage Scout Pack';
INSERT INTO public.reviews (product_id, reviewer_name, rating, body)
SELECT id, 'D.R.', 4, 'Straps needed about a week of break-in. Now perfect.' FROM public.products WHERE title = 'The Heritage Scout Pack';
INSERT INTO public.reviews (product_id, reviewer_name, rating, body)
SELECT id, 'S.J.', 5, 'Heavier than expected empty, but built like a tank. Fits my 16-inch MBP.' FROM public.products WHERE title = 'The Heritage Scout Pack';
INSERT INTO public.reviews (product_id, reviewer_name, rating, body)
SELECT id, 'A.C.', 5, 'Bedding that changed how I sleep. No exaggeration.' FROM public.products WHERE title = 'French Linen Duvet Cover';
INSERT INTO public.reviews (product_id, reviewer_name, rating, body)
SELECT id, 'K.L.', 5, 'Bowls have that hand-thrown weight and warmth. Use them daily.' FROM public.products WHERE title = 'Speckled Breakfast Bowl Set';
