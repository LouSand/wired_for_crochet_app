-- ============================================================
-- SEED DATA for Wired for Crochet
-- Replace YOUR_USER_ID below with your actual auth.users id
-- Run: SELECT id, email FROM auth.users; to find it
-- ============================================================

-- SET YOUR USER ID HERE:
DO $$ 
DECLARE
  uid uuid;
BEGIN
  -- Get the first user's ID (or replace with a specific one)
  SELECT id INTO uid FROM auth.users LIMIT 1;
  
  IF uid IS NULL THEN
    RAISE EXCEPTION 'No users found. Please register first.';
  END IF;

  -- ============================================================
  -- USER SETTINGS (Pro tier)
  -- ============================================================
  INSERT INTO user_settings (user_id, default_hourly_rate, subscription_tier)
  VALUES (uid, 20.00, 'pro')
  ON CONFLICT (user_id) DO UPDATE SET subscription_tier = 'pro', default_hourly_rate = 20.00;

  -- ============================================================
  -- YARN ENTRIES (existing yarn inventory)
  -- ============================================================
  INSERT INTO yarn_entries (user_id, name, brand, colour, weight_category, quantity_owned, cost_per_unit, fibre_content, recommended_hook_size) VALUES
  (uid, '12mm Chenille Yellow', 'Shein', 'Yellow', 'bulky', 5, 3.96, '100% Polyester', '12mm'),
  (uid, '12mm Chenille Black', 'Shein', 'Black', 'bulky', 4, 3.96, '100% Polyester', '12mm'),
  (uid, '12mm Chenille White', 'Shein', 'White', 'bulky', 6, 3.96, '100% Polyester', '12mm'),
  (uid, 'Gradient Shawl Yarn Purple', 'Shein', 'Purple', 'fingering', 3, 4.95, 'Acrylic Blend', '4mm'),
  (uid, 'Gradient Shawl Yarn Blue/Green', 'Shein', 'Blue/Green', 'fingering', 2, 9.72, 'Acrylic Blend', '4mm'),
  (uid, 'Australian Wool Multi', 'Shein', 'Beige/Grey/Brown', 'aran', 2, 27.72, '100% Australian Wool', '5mm'),
  (uid, 'Fine Merino Red', 'Shein', 'Red', 'sport', 2, 9.38, '100% Merino Wool', '3.5mm'),
  (uid, 'Baby Plush Yarn Yellow', 'Shein', 'Yellow', 'bulky', 3, 2.96, 'Polyester Plush', '6mm'),
  (uid, 'Cotton DK White', 'Utopia Crafts', 'White', 'dk', 5, 2.16, '100% Cotton', '4mm'),
  (uid, 'Milk Yarn White', 'Amazon', 'White', 'dk', 4, 17.99, 'Milk Cotton Blend', '3.5mm');

  -- ============================================================
  -- HOOK ENTRIES
  -- ============================================================
  INSERT INTO hook_entries (user_id, size, type, brand, material, yarn_types, pattern_types) VALUES
  (uid, '3.5mm', 'inline', 'Clover', 'aluminum', '["cotton", "wool"]', '["amigurumi", "lace"]'),
  (uid, '4.0mm', 'inline', 'Clover', 'aluminum', '["acrylic", "cotton"]', '["blankets", "garments"]'),
  (uid, '5.0mm', 'tapered', 'Tulip', 'bamboo', '["wool", "acrylic"]', '["blankets", "garments", "accessories"]'),
  (uid, '6.0mm', 'inline', 'Prym', 'aluminum', '["chunky", "acrylic"]', '["blankets", "home decor"]'),
  (uid, '8.0mm', 'tapered', 'KnitPro', 'wood', '["chunky"]', '["blankets", "home decor"]'),
  (uid, '12.0mm', 'inline', 'Amazon', 'plastic', '["chunky"]', '["amigurumi", "home decor"]'),
  (uid, '2.5mm', 'inline', 'Aeelike', 'steel', '["cotton", "silk"]', '["lace", "accessories"]');

  -- ============================================================
  -- PATTERNS (written ones)
  -- ============================================================
  INSERT INTO patterns (user_id, title, type, introduction, materials_list, hook_size, yarn_info, gauge, abbreviations, instructions, notes) VALUES
  (uid, 'Simple Bee Amigurumi', 'written', 
   'A cute little bee plushie, perfect for beginners. Makes a great keychain or gift.',
   '12mm chenille yarn (yellow, black, white), 12mm hook, safety eyes (8mm), stuffing',
   '12mm',
   '12mm Chenille - Yellow (40g), Black (20g), White (10g)',
   'Not critical for amigurumi - just ensure tight stitches',
   'sc = single crochet, inc = increase, dec = decrease, sl st = slip stitch, ch = chain, MR = magic ring',
   'Body (Yellow):
R1: 6sc in MR (6)
R2: inc x6 (12)
R3: (sc, inc) x6 (18)
R4: (2sc, inc) x6 (24)
R5-R8: sc around (24)
R9: (2sc, dec) x6 (18)
R10: (sc, dec) x6 (12)
Stuff firmly.
R11: dec x6 (6)
Fasten off.

Stripes (Black):
R5 and R7 work in black.

Wings (White):
Ch 6, sl st into 2nd ch from hook, sc, hdc, dc, 3dc in last ch. Working on other side: dc, hdc, sc, sl st. Fasten off. Make 2.',
   'Add safety eyes between R6 and R7. Sew wings on at R4. Takes about 45 minutes.'),

  (uid, 'Granny Square Blanket', 'written',
   'Classic granny square blanket made from joined squares. Customise with your favourite colours.',
   'DK weight yarn in 4-6 colours (approx 200g each), 4mm hook, yarn needle',
   '4.0mm',
   'Any DK weight yarn - I used Cotton DK White and various colours',
   '1 granny square = 10cm x 10cm after blocking',
   'ch = chain, dc = double crochet (UK treble), sl st = slip stitch, sp = space',
   'Each Square:
R1: Ch 4, sl st to form ring. Ch 3 (counts as dc), 2dc in ring, ch 2, (3dc in ring, ch 2) x3, sl st to top of ch-3.
R2: Sl st to corner sp. Ch 3, 2dc, ch 2, 3dc in same sp. *Ch 1, (3dc, ch 2, 3dc) in next corner sp.* Repeat * around. Ch 1, sl st to top of ch-3.
R3: Sl st to corner sp. Ch 3, 2dc, ch 2, 3dc in same sp. *Ch 1, 3dc in next ch-1 sp, ch 1, (3dc, ch 2, 3dc) in corner sp.* Repeat around.
Continue adding rounds until desired size.

Assembly: Join squares with whip stitch or sc join. I made 48 squares (6x8 grid) for a lap blanket.',
   'Great TV project. Each square takes about 15 minutes once you get the rhythm.'),

  (uid, 'Cosy Cardigan', 'written',
   'A relaxed-fit cardigan worked in one piece from the top down. Suitable for intermediate crocheters.',
   'Australian Wool (approx 1500g), 5mm hook, stitch markers, buttons x5',
   '5.0mm',
   'Australian Wool Multi - Aran weight, 2000g total purchased',
   '14 dc x 8 rows = 10cm x 10cm',
   'ch = chain, dc = double crochet, hdc = half double crochet, inc = 2dc in same st, sk = skip',
   'Yoke (worked flat):
Ch 80 (for size M).
R1: Dc in 4th ch from hook, dc across. (78 dc)
R2: Ch 3, dc in each st, placing markers at: st 13, 14, 27, 28, 51, 52, 65, 66 (raglan points). Inc at each marker.
R3-R12: Continue increasing at raglan points every row. (approx 198 sts at R12)

Separate sleeves: Skip sleeve stitches, ch 4 for underarm, continue body.

Body:
Work even in dc for 40 rows or desired length.

Sleeves:
Pick up stitches around armhole, work in rounds decreasing every 8th round until desired length.

Edging: 2 rows sc around entire cardigan opening. Add buttonholes on R2 of edging.',
   'This is a long project - about 46 hours total. The wool is gorgeous to work with. Size M fits bust 36-38 inches.');

  -- ============================================================
  -- PROJECTS
  -- ============================================================
  INSERT INTO projects (user_id, name, description, status, difficulty, customer_name, date_started, date_completed, currency) VALUES
  (uid, 'Bee Keychain for Sarah', 'Small bee amigurumi with keychain attachment', 'completed', 'beginner', 'Sarah M', '2025-01-15', '2025-01-15', 'GBP'),
  (uid, 'Purple Shawl', 'Gradient shawl in purple tones, shell stitch pattern', 'in_progress', 'intermediate', NULL, '2025-03-01', NULL, 'GBP'),
  (uid, 'Baby Blanket for Emma', 'Granny square blanket in pastel colours for new baby', 'in_progress', 'easy', 'Emma T', '2025-02-10', NULL, 'GBP'),
  (uid, 'Autumn Cardigan', 'Cosy cardigan in Australian wool, relaxed fit', 'planned', 'advanced', NULL, NULL, NULL, 'GBP'),
  (uid, 'Popit Fidget Toy', 'Rainbow popit sensory toy', 'completed', 'beginner', NULL, '2025-01-20', '2025-01-20', 'GBP'),
  (uid, 'Moses Basket', 'Large cotton cord basket for baby', 'paused', 'advanced', 'Lisa K', '2025-04-01', NULL, 'GBP');

  -- ============================================================
  -- SUPPLIERS
  -- ============================================================
  INSERT INTO suppliers (user_id, name, website, notes) VALUES
  (uid, 'Amazon', 'https://amazon.co.uk', 'Main supplier for yarn, hooks, and equipment. Prime delivery.'),
  (uid, 'Shein', 'https://shein.co.uk', 'Budget yarn and accessories. Shipping takes 1-2 weeks. Use Shein Saver for discounts.'),
  (uid, 'Etsy', 'https://etsy.com', 'Patterns and specialty yarn. Support small makers.'),
  (uid, 'Hobbycraft', 'https://hobbycraft.co.uk', 'Local craft store. Good for last-minute supplies.');

  -- ============================================================
  -- PURCHASES (expenses)
  -- ============================================================
  INSERT INTO purchases (user_id, supplier_id, purchase_date, description, category, cost) 
  SELECT uid, s.id, '2025-01-23', 'Needles set', 'equipment', 3.39
  FROM suppliers s WHERE s.user_id = uid AND s.name = 'Amazon' LIMIT 1;

  INSERT INTO purchases (user_id, supplier_id, purchase_date, description, category, cost) 
  SELECT uid, s.id, '2025-01-23', 'Wool holder/yarn bowl', 'equipment', 13.99
  FROM suppliers s WHERE s.user_id = uid AND s.name = 'Amazon' LIMIT 1;

  INSERT INTO purchases (user_id, supplier_id, purchase_date, description, category, cost) 
  SELECT uid, s.id, '2025-01-21', 'White milk yarn x3', 'stock', 51.97
  FROM suppliers s WHERE s.user_id = uid AND s.name = 'Amazon' LIMIT 1;

  INSERT INTO purchases (user_id, supplier_id, purchase_date, description, category, cost) 
  SELECT uid, s.id, '2025-01-21', 'Green milk yarn', 'stock', 15.99
  FROM suppliers s WHERE s.user_id = uid AND s.name = 'Amazon' LIMIT 1;

  INSERT INTO purchases (user_id, supplier_id, purchase_date, description, category, cost) 
  SELECT uid, s.id, '2025-04-01', 'Large crochet hooks set', 'equipment', 6.99
  FROM suppliers s WHERE s.user_id = uid AND s.name = 'Amazon' LIMIT 1;

  INSERT INTO purchases (user_id, supplier_id, purchase_date, description, category, cost) 
  SELECT uid, s.id, '2025-04-30', 'Tunisian crochet hooks', 'equipment', 31.50
  FROM suppliers s WHERE s.user_id = uid AND s.name = 'Amazon' LIMIT 1;

  INSERT INTO purchases (user_id, supplier_id, purchase_date, description, category, cost) 
  SELECT uid, s.id, '2025-03-30', 'Blue/green shawl yarn', 'stock', 9.72
  FROM suppliers s WHERE s.user_id = uid AND s.name = 'Shein' LIMIT 1;

  INSERT INTO purchases (user_id, supplier_id, purchase_date, description, category, cost) 
  SELECT uid, s.id, '2025-04-27', 'Cardigan wools, browns', 'stock', 27.72
  FROM suppliers s WHERE s.user_id = uid AND s.name = 'Shein' LIMIT 1;

  INSERT INTO purchases (user_id, supplier_id, purchase_date, description, category, cost) 
  SELECT uid, s.id, '2025-05-20', 'Plushie and amigurumi wool bulk', 'stock', 80.17
  FROM suppliers s WHERE s.user_id = uid AND s.name = 'Shein' LIMIT 1;

  INSERT INTO purchases (user_id, supplier_id, purchase_date, description, category, cost) 
  SELECT uid, s.id, '2025-03-21', 'Crochet pattern books', 'books', 17.23
  FROM suppliers s WHERE s.user_id = uid AND s.name = 'Etsy' LIMIT 1;

  INSERT INTO purchases (user_id, supplier_id, purchase_date, description, category, cost) 
  SELECT uid, s.id, '2025-02-09', 'Shein Saver subscription', 'subscription', 6.90
  FROM suppliers s WHERE s.user_id = uid AND s.name = 'Shein' LIMIT 1;

  -- ============================================================
  -- MATERIALS (business inventory)
  -- ============================================================
  INSERT INTO materials (user_id, name, material_type, category, colour, quantity_owned, quantity_used, total_cost, unit) VALUES
  (uid, '12mm Chenille Yellow', 'polyester', 'yarn', 'Yellow', 490, 80, 7.92, 'grams'),
  (uid, '12mm Chenille Black', 'polyester', 'yarn', 'Black', 490, 40, 7.92, 'grams'),
  (uid, '12mm Chenille White', 'polyester', 'yarn', 'White', 735, 60, 11.88, 'grams'),
  (uid, 'Gradient Shawl Yarn Purple', 'acrylic', 'yarn', 'Purple', 900, 300, 14.85, 'grams'),
  (uid, 'Australian Wool Multi', 'wool', 'yarn', 'Beige/Grey/Brown', 2000, 0, 27.72, 'grams'),
  (uid, 'Safety Eyes 8mm', 'plastic', 'accessories', 'Black', 560, 12, 1.92, 'pieces'),
  (uid, 'Silver Keychains', 'metal', 'hardware', 'Silver', 50, 3, 1.18, 'pieces'),
  (uid, 'Polyester Stuffing', 'polyester', 'accessories', 'White', 500, 100, 4.50, 'grams'),
  (uid, 'Stitch Markers', 'plastic', 'tools', 'Mixed', 100, 0, 2.99, 'pieces'),
  (uid, 'Cotton Cord 9mm Red', 'cotton', 'yarn', 'Red', 1200, 600, 20.00, 'grams');

  -- ============================================================
  -- PRODUCTS
  -- ============================================================
  INSERT INTO products (user_id, name, description, sell_price, status, time_taken_minutes, wages_per_minute, profit_margin_percent) VALUES
  (uid, 'Bee Keychain', 'Cute amigurumi bee with keychain attachment', 9.22, 'active', 45, 0.33, 20),
  (uid, 'Popit Fidget Toy', 'Rainbow crochet popit sensory toy', 8.56, 'active', 55, 0.33, 20),
  (uid, 'Octopus Large', 'Large amigurumi octopus with curly tentacles', 14.64, 'active', 38, 0.33, 25),
  (uid, 'Shell Stitch Shawl', 'Gradient shawl in shell stitch pattern', 45.00, 'active', 4800, 0.33, 15),
  (uid, 'Granny Square Blanket', 'Classic granny square lap blanket, 48 squares', 85.00, 'active', 720, 0.33, 20),
  (uid, 'Star Bookmark', 'Small crochet star bookmark', 4.50, 'active', 15, 0.33, 30),
  (uid, 'Flower Bookmark', 'Crochet flower bookmark with stem', 4.50, 'active', 18, 0.33, 30);

  -- ============================================================
  -- CUSTOMERS
  -- ============================================================
  INSERT INTO customers (user_id, name, email, phone, notes) VALUES
  (uid, 'Sarah Mitchell', 'sarah.m@email.com', '07700 900123', 'Regular customer. Loves amigurumi. Ordered 3 bee keychains so far.'),
  (uid, 'Emma Thompson', 'emma.t@email.com', '07700 900456', 'Ordered baby blanket for her newborn. Due date March 2025.'),
  (uid, 'Lisa King', 'lisa.k@email.com', NULL, 'Wants a moses basket. Discussed colours - prefers neutral tones.'),
  (uid, 'James Wilson', 'james.w@email.com', '07700 900789', 'Bought popit toys for his kids. May want more for birthday party.');

  -- ============================================================
  -- SALES
  -- ============================================================
  INSERT INTO sales (user_id, product_id, customer_id, sale_date, quantity_sold, sale_price)
  SELECT uid, p.id, c.id, '2025-01-16', 1, 9.22
  FROM products p, customers c 
  WHERE p.user_id = uid AND p.name = 'Bee Keychain' 
  AND c.user_id = uid AND c.name = 'Sarah Mitchell' LIMIT 1;

  INSERT INTO sales (user_id, product_id, customer_id, sale_date, quantity_sold, sale_price)
  SELECT uid, p.id, c.id, '2025-02-01', 2, 18.44
  FROM products p, customers c 
  WHERE p.user_id = uid AND p.name = 'Bee Keychain' 
  AND c.user_id = uid AND c.name = 'Sarah Mitchell' LIMIT 1;

  INSERT INTO sales (user_id, product_id, customer_id, sale_date, quantity_sold, sale_price)
  SELECT uid, p.id, c.id, '2025-01-21', 2, 17.12
  FROM products p, customers c 
  WHERE p.user_id = uid AND p.name = 'Popit Fidget Toy' 
  AND c.user_id = uid AND c.name = 'James Wilson' LIMIT 1;

  INSERT INTO sales (user_id, product_id, sale_date, quantity_sold, sale_price)
  SELECT uid, p.id, '2025-03-05', 1, 4.50
  FROM products p 
  WHERE p.user_id = uid AND p.name = 'Star Bookmark' LIMIT 1;

  INSERT INTO sales (user_id, product_id, sale_date, quantity_sold, sale_price)
  SELECT uid, p.id, '2025-03-05', 2, 9.00
  FROM products p 
  WHERE p.user_id = uid AND p.name = 'Flower Bookmark' LIMIT 1;

  -- ============================================================
  -- BOM LINE ITEMS (for Bee Keychain)
  -- ============================================================
  INSERT INTO bom_line_items (product_id, material_id, user_id, quantity_required)
  SELECT p.id, m.id, uid, 40
  FROM products p, materials m
  WHERE p.user_id = uid AND p.name = 'Bee Keychain'
  AND m.user_id = uid AND m.name = '12mm Chenille Yellow' LIMIT 1;

  INSERT INTO bom_line_items (product_id, material_id, user_id, quantity_required)
  SELECT p.id, m.id, uid, 20
  FROM products p, materials m
  WHERE p.user_id = uid AND p.name = 'Bee Keychain'
  AND m.user_id = uid AND m.name = '12mm Chenille Black' LIMIT 1;

  INSERT INTO bom_line_items (product_id, material_id, user_id, quantity_required)
  SELECT p.id, m.id, uid, 10
  FROM products p, materials m
  WHERE p.user_id = uid AND p.name = 'Bee Keychain'
  AND m.user_id = uid AND m.name = '12mm Chenille White' LIMIT 1;

  INSERT INTO bom_line_items (product_id, material_id, user_id, quantity_required)
  SELECT p.id, m.id, uid, 2
  FROM products p, materials m
  WHERE p.user_id = uid AND p.name = 'Bee Keychain'
  AND m.user_id = uid AND m.name = 'Safety Eyes 8mm' LIMIT 1;

  INSERT INTO bom_line_items (product_id, material_id, user_id, quantity_required)
  SELECT p.id, m.id, uid, 1
  FROM products p, materials m
  WHERE p.user_id = uid AND p.name = 'Bee Keychain'
  AND m.user_id = uid AND m.name = 'Silver Keychains' LIMIT 1;

  -- BOM for Octopus Large
  INSERT INTO bom_line_items (product_id, material_id, user_id, quantity_required)
  SELECT p.id, m.id, uid, 60
  FROM products p, materials m
  WHERE p.user_id = uid AND p.name = 'Octopus Large'
  AND m.user_id = uid AND m.name = '12mm Chenille Yellow' LIMIT 1;

  INSERT INTO bom_line_items (product_id, material_id, user_id, quantity_required)
  SELECT p.id, m.id, uid, 2
  FROM products p, materials m
  WHERE p.user_id = uid AND p.name = 'Octopus Large'
  AND m.user_id = uid AND m.name = 'Safety Eyes 8mm' LIMIT 1;

  INSERT INTO bom_line_items (product_id, material_id, user_id, quantity_required)
  SELECT p.id, m.id, uid, 15
  FROM products p, materials m
  WHERE p.user_id = uid AND p.name = 'Octopus Large'
  AND m.user_id = uid AND m.name = 'Polyester Stuffing' LIMIT 1;

END $$;
