-- =============================================
-- SUPABASE DATABASE SETUP FOR VEGETABLE CHECKOUT
-- =============================================
-- Run this entire script in your Supabase SQL Editor

-- 1. Create vegetables table
CREATE TABLE IF NOT EXISTS vegetables (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  average_weight_per_unit_g INTEGER NOT NULL,
  average_area_per_unit_mm2 INTEGER NOT NULL,
  price_per_500g DECIMAL(10,2),
  price_per_unit DECIMAL(10,2),
  price_per_packet DECIMAL(10,2),
  pricing_unit VARCHAR(20) NOT NULL CHECK (pricing_unit IN ('per_500g', 'per_unit', 'per_packet')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create checkout_items table
CREATE TABLE IF NOT EXISTS checkout_items (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL,
  vegetable_id INTEGER REFERENCES vegetables(id),
  vegetable_name VARCHAR(100) NOT NULL,
  weight_g DECIMAL(10,2),
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  confidence_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_checkout_items_session ON checkout_items(session_id);
CREATE INDEX IF NOT EXISTS idx_vegetables_name ON vegetables(name);

-- 4. Insert vegetable data from your pricing table
-- Vegetables priced per 500g
INSERT INTO vegetables (name, average_weight_per_unit_g, average_area_per_unit_mm2, price_per_500g, pricing_unit) VALUES
('Potato', 150, 11900, 25.00, 'per_500g'),
('Tomato', 100, 9020, 100.00, 'per_500g'),
('Onion', 150, 12080, 25.00, 'per_500g'),
('Ginger', 50, 4400, 200.00, 'per_500g'),
('Garlic', 50, 6710, 100.00, 'per_500g'),
('Carrot', 70, 18280, 75.00, 'per_500g'),
('Eggplant', 150, 35040, 60.00, 'per_500g')
ON CONFLICT (name) DO UPDATE SET
  average_weight_per_unit_g = EXCLUDED.average_weight_per_unit_g,
  average_area_per_unit_mm2 = EXCLUDED.average_area_per_unit_mm2,
  price_per_500g = EXCLUDED.price_per_500g,
  pricing_unit = EXCLUDED.pricing_unit,
  updated_at = NOW();

-- Vegetables priced per unit
INSERT INTO vegetables (name, average_weight_per_unit_g, average_area_per_unit_mm2, price_per_unit, pricing_unit) VALUES
('Lettuce', 800, 70170, 45.00, 'per_unit'),
('Cabbage', 1500, 109750, 80.00, 'per_unit'),
('Cauliflower', 800, 76160, 125.00, 'per_unit')
ON CONFLICT (name) DO UPDATE SET
  average_weight_per_unit_g = EXCLUDED.average_weight_per_unit_g,
  average_area_per_unit_mm2 = EXCLUDED.average_area_per_unit_mm2,
  price_per_unit = EXCLUDED.price_per_unit,
  pricing_unit = EXCLUDED.pricing_unit,
  updated_at = NOW();

-- Vegetables priced per packet
INSERT INTO vegetables (name, average_weight_per_unit_g, average_area_per_unit_mm2, price_per_packet, pricing_unit) VALUES
('Chinese Cabbage (Bok choy)', 200, 89570, 35.00, 'per_packet'),
('Onion Spring', 100, 23240, 50.00, 'per_packet'),
('Mint', 50, 3690, 25.00, 'per_packet')
ON CONFLICT (name) DO UPDATE SET
  average_weight_per_unit_g = EXCLUDED.average_weight_per_unit_g,
  average_area_per_unit_mm2 = EXCLUDED.average_area_per_unit_mm2,
  price_per_packet = EXCLUDED.price_per_packet,
  pricing_unit = EXCLUDED.pricing_unit,
  updated_at = NOW();

-- 5. Create function to calculate vegetable price
CREATE OR REPLACE FUNCTION calculate_vegetable_price(
  p_vegetable_name VARCHAR(100),
  p_weight_g DECIMAL(10,2)
) RETURNS DECIMAL(10,2) AS $$
DECLARE
  v_vegetable RECORD;
  v_price DECIMAL(10,2);
BEGIN
  -- Get vegetable pricing info
  SELECT * INTO v_vegetable 
  FROM vegetables 
  WHERE name ILIKE '%' || p_vegetable_name || '%'
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN 0.00;
  END IF;
  
  -- Calculate price based on pricing unit
  CASE v_vegetable.pricing_unit
    WHEN 'per_500g' THEN
      v_price := (p_weight_g / 500.0) * COALESCE(v_vegetable.price_per_500g, 0);
    WHEN 'per_unit' THEN
      v_price := COALESCE(v_vegetable.price_per_unit, 0);
    WHEN 'per_packet' THEN
      v_price := COALESCE(v_vegetable.price_per_packet, 0);
    ELSE
      v_price := 0.00;
  END CASE;
  
  RETURN ROUND(v_price, 2);
END;
$$ LANGUAGE plpgsql;

-- 6. Create function to get cart total
CREATE OR REPLACE FUNCTION get_cart_total(p_session_id VARCHAR(100))
RETURNS DECIMAL(10,2) AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(total_price) FROM checkout_items WHERE session_id = p_session_id), 
    0.00
  );
END;
$$ LANGUAGE plpgsql;

-- 7. Enable Row Level Security (RLS)
ALTER TABLE vegetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkout_items ENABLE ROW LEVEL SECURITY;

-- 8. Create policies for public access (for demo purposes)
-- Allow public read access to vegetables
CREATE POLICY "Allow public read access to vegetables" ON vegetables
  FOR SELECT USING (true);

-- Allow public access to checkout_items (for demo purposes)
CREATE POLICY "Allow public access to checkout_items" ON checkout_items
  FOR ALL USING (true);

-- 9. Create a function to clean up old sessions (optional)
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void AS $$
BEGIN
  -- Delete checkout items older than 24 hours
  DELETE FROM checkout_items 
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- 10. Verify the setup
SELECT 'Database setup completed successfully!' as status;

-- Check if vegetables were inserted
SELECT COUNT(*) as vegetable_count FROM vegetables;

-- Show sample vegetables
SELECT name, pricing_unit, 
  COALESCE(price_per_500g, 0) as price_500g,
  COALESCE(price_per_unit, 0) as price_unit,
  COALESCE(price_per_packet, 0) as price_packet
FROM vegetables 
ORDER BY name;
