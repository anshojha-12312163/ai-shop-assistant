-- Seed real picsum.photos image URLs for 8-10 featured products
-- Using /seed/{slug}/600/600 — deterministic, no API key, always returns a real photo

UPDATE public.products SET image_url = 'https://picsum.photos/seed/hiking-jacket/600/600'
  WHERE title = 'Alpine Shell Jacket';

UPDATE public.products SET image_url = 'https://picsum.photos/seed/canvas-backpack/600/600'
  WHERE title = 'The Heritage Scout Pack';

UPDATE public.products SET image_url = 'https://picsum.photos/seed/merino-crew/600/600'
  WHERE title = 'Base Camp Merino Crew';

UPDATE public.products SET image_url = 'https://picsum.photos/seed/linen-duvet/600/600'
  WHERE title = 'French Linen Duvet Cover';

UPDATE public.products SET image_url = 'https://picsum.photos/seed/ceramic-tea-set/600/600'
  WHERE title = 'Ritual Tea Set';

UPDATE public.products SET image_url = 'https://picsum.photos/seed/walnut-board/600/600'
  WHERE title = 'Walnut Bread Board';

UPDATE public.products SET image_url = 'https://picsum.photos/seed/pour-over-coffee/600/600'
  WHERE title = 'Ceramic Pour-Over Set';

UPDATE public.products SET image_url = 'https://picsum.photos/seed/beeswax-candles/600/600'
  WHERE title = 'Hand-Poured Beeswax Tapers';

UPDATE public.products SET image_url = 'https://picsum.photos/seed/titanium-cookkit/600/600'
  WHERE title = 'Titanium Trail Cook Kit';

UPDATE public.products SET image_url = 'https://picsum.photos/seed/leather-journal/600/600'
  WHERE title = 'Leather Journal Wrap';
