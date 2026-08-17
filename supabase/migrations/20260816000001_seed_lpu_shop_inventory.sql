-- Seed live catalog products & stock availability for LPU, Law Gate, Phagwara & Jalandhar stores
INSERT INTO public.inventory_items (shop_id, product_name, category, price, status, image_url, updated_at)
SELECT 
  s.id,
  item.product_name,
  item.category,
  item.price,
  item.status,
  item.image_url,
  now() - (item.offset_minutes || ' minutes')::interval
FROM public.shops s
CROSS JOIN LATERAL (
  VALUES 
    -- Clothing & Fashion catalog items
    ('Zudio Slim Fit Denim Jeans', 'Clothing & Fashion', 799.00, 'in_stock', 'https://picsum.photos/seed/jeans-1/400/400', 12),
    ('FabIndia Handcrafted Cotton Kurti', 'Clothing & Fashion', 1299.00, 'in_stock', 'https://picsum.photos/seed/kurti-1/400/400', 25),
    ('Oversized College Graphic Tee', 'Clothing & Fashion', 499.00, 'in_stock', 'https://picsum.photos/seed/tee-1/400/400', 5),
    ('Trends Unisex Fleece Hoodie', 'Clothing & Fashion', 1199.00, 'low_stock', 'https://picsum.photos/seed/hoodie-1/400/400', 45),
    ('Formal Executive Button-Down Shirt', 'Clothing & Fashion', 899.00, 'out_of_stock', 'https://picsum.photos/seed/shirt-1/400/400', 120),

    -- Footwear catalog items
    ('Campus Air Running Sneakers', 'Footwear', 1699.00, 'in_stock', 'https://picsum.photos/seed/sneaker-1/400/400', 8),
    ('Bata Leather Formal Oxfords', 'Footwear', 2499.00, 'in_stock', 'https://picsum.photos/seed/bata-1/400/400', 18),
    ('Law Gate Casual Canvas Kicks', 'Footwear', 799.00, 'in_stock', 'https://picsum.photos/seed/canvas-1/400/400', 30),
    ('Woodland Waterproof Outdoor Boots', 'Footwear', 3995.00, 'low_stock', 'https://picsum.photos/seed/boots-1/400/400', 60),

    -- Electronics catalog items
    ('Universal Type-C Fast Charger 65W', 'Electronics', 699.00, 'in_stock', 'https://picsum.photos/seed/charger-1/400/400', 10),
    ('Wireless Noise Cancelling Earbuds', 'Electronics', 1899.00, 'in_stock', 'https://picsum.photos/seed/earbuds-1/400/400', 15),
    ('Laptop Cooling Pad with Dual Fans', 'Electronics', 899.00, 'in_stock', 'https://picsum.photos/seed/cooler-1/400/400', 40),
    ('Tempered Glass & Tough Armor Case', 'Electronics', 299.00, 'in_stock', 'https://picsum.photos/seed/case-1/400/400', 2),

    -- Pharmacy & Wellness items
    ('N95 Protective Face Masks (Pack of 5)', 'Pharmacy', 199.00, 'in_stock', 'https://picsum.photos/seed/mask-1/400/400', 14),
    ('Multivitamin & Zinc Capsules (60 Tabs)', 'Pharmacy', 450.00, 'in_stock', 'https://picsum.photos/seed/vitamins-1/400/400', 20),
    ('First-Aid Waterproof Bandage Kit', 'Pharmacy', 120.00, 'in_stock', 'https://picsum.photos/seed/firstaid-1/400/400', 50),

    -- Cafe & Bakery items
    ('Cold Brew Iced Coffee (Large)', 'Cafe & Bakery', 180.00, 'in_stock', 'https://picsum.photos/seed/coldbrew-1/400/400', 4),
    ('Artisan Sourdough Cheese Sandwich', 'Cafe & Bakery', 220.00, 'in_stock', 'https://picsum.photos/seed/sandwich-1/400/400', 11),
    ('Belgian Dark Chocolate Brownie', 'Cafe & Bakery', 140.00, 'in_stock', 'https://picsum.photos/seed/brownie-1/400/400', 22)
) AS item(product_name, category, price, status, image_url, offset_minutes)
ON CONFLICT (id) DO NOTHING;
