-- ============================================================
-- MAKE MY PERFUME - SUPABASE DATABASE SCHEMA & SEED DATA SQL
-- Copy and paste this script into your Supabase SQL Editor to set up all tables and seed data.
-- ============================================================

-- 1. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  collection TEXT NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  gallery JSONB DEFAULT '[]'::jsonb,
  price NUMERIC NOT NULL,
  compare_at_price NUMERIC,
  size_ml INT DEFAULT 50,
  rating NUMERIC DEFAULT 4.8,
  review_count INT DEFAULT 0,
  in_stock BOOLEAN DEFAULT true,
  badge TEXT,
  top_notes JSONB DEFAULT '[]'::jsonb,
  heart_notes JSONB DEFAULT '[]'::jsonb,
  base_notes JSONB DEFAULT '[]'::jsonb,
  longevity TEXT DEFAULT '6–8 hours',
  sillage TEXT DEFAULT 'Moderate',
  ingredients JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. NEWS TABLE
CREATE TABLE IF NOT EXISTS public.news (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  image_url TEXT NOT NULL,
  read_time TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USERS TABLE (Customer Auth & Delivery Address)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SUBSCRIBERS TABLE
CREATE TABLE IF NOT EXISTS public.subscribers (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  consent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CONTACT SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT,
  customer_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  response JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Allows API access via Anon Key
-- ============================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public full access on products" ON public.products;
CREATE POLICY "Public full access on products" ON public.products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access on news" ON public.news;
CREATE POLICY "Public full access on news" ON public.news FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access on users" ON public.users;
CREATE POLICY "Public full access on users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access on subscribers" ON public.subscribers;
CREATE POLICY "Public full access on subscribers" ON public.subscribers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access on contact_submissions" ON public.contact_submissions;
CREATE POLICY "Public full access on contact_submissions" ON public.contact_submissions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access on orders" ON public.orders;
CREATE POLICY "Public full access on orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- INITIAL SEED DATA FOR PRODUCTS
-- ============================================================
INSERT INTO public.products (
  id, slug, name, collection, tagline, description, image_url, gallery,
  price, compare_at_price, size_ml, rating, review_count, badge,
  top_notes, heart_notes, base_notes, longevity, sillage, ingredients
) VALUES
(
  'p-citrus-noir', 'citrus-noir', 'Citrus Noir', 'Fresh',
  'Brightness with a beautiful shadow.',
  'A luminous, mineral citrus that settles into a clean, confident trail. Made for first impressions that stay.',
  'https://images.unsplash.com/photo-1594913615593-e4b8c44625be?auto=format&fit=crop&w=1000&q=85',
  '["https://images.unsplash.com/photo-1594913615593-e4b8c44625be?auto=format&fit=crop&w=1000&q=85", "https://images.unsplash.com/photo-1758871993077-e084cc7eca86?auto=format&fit=crop&w=1000&q=85"]'::jsonb,
  1200, 1450, 100, 4.9, 128, 'Bestseller',
  '["Bergamot", "Lemon", "Sea salt"]'::jsonb,
  '["Lavender", "Neroli", "Mineral air"]'::jsonb,
  '["Vetiver", "Cedar", "White musk"]'::jsonb,
  '8–10 hours', 'Moderate',
  '["Denatured alcohol", "Parfum", "Aqua", "Limonene"]'::jsonb
),
(
  'p-amber-veil', 'amber-veil', 'Amber Veil', 'Warm',
  'Soft light, held close.',
  'A warm amber veil woven with saffron and a touch of vanilla. Quietly magnetic, never loud.',
  'https://images.unsplash.com/photo-1622618991746-fe6004db3a47?auto=format&fit=crop&w=1000&q=85',
  '["https://images.unsplash.com/photo-1622618991746-fe6004db3a47?auto=format&fit=crop&w=1000&q=85", "https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&w=1000&q=85"]'::jsonb,
  1490, 1690, 50, 4.8, 86, 'New release',
  '["Saffron", "Pink pepper", "Pear"]'::jsonb,
  '["Jasmine", "Amberwood", "Rose"]'::jsonb,
  '["Vanilla", "Moss", "Dry woods"]'::jsonb,
  '7–9 hours', 'Intimate',
  '["Denatured alcohol", "Parfum", "Aqua", "Linalool"]'::jsonb
),
(
  'p-nocturne', 'nocturne', 'Nocturne', 'Woody',
  'A darker kind of calm.',
  'Smoked woods and black tea on a polished skin scent. Composed for late rooms and long conversations.',
  'https://images.unsplash.com/photo-1643797517714-a273548abc3c?auto=format&fit=crop&w=1000&q=85',
  '["https://images.unsplash.com/photo-1643797517714-a273548abc3c?auto=format&fit=crop&w=1000&q=85", "https://images.unsplash.com/photo-1758871993077-e084cc7eca86?auto=format&fit=crop&w=1000&q=85"]'::jsonb,
  1750, 1990, 100, 4.7, 64, 'Unisex',
  '["Black tea", "Cardamom", "Bergamot"]'::jsonb,
  '["Iris", "Suede", "Incense"]'::jsonb,
  '["Cedar", "Patchouli", "Tonka"]'::jsonb,
  '9–11 hours', 'Pronounced',
  '["Denatured alcohol", "Parfum", "Aqua", "Citral"]'::jsonb
),
(
  'p-azure-skin', 'azure-skin', 'Azure Skin', 'Aquatic',
  'The air after rain.',
  'Salted skin, crisp cypress and a cool blue horizon. An effortless everyday signature.',
  'https://images.unsplash.com/photo-1717852885839-166ce0621811?auto=format&fit=crop&w=1000&q=85',
  '["https://images.unsplash.com/photo-1717852885839-166ce0621811?auto=format&fit=crop&w=1000&q=85", "https://images.unsplash.com/photo-1594913615593-e4b8c44625be?auto=format&fit=crop&w=1000&q=85"]'::jsonb,
  990, 1190, 50, 4.6, 42, NULL,
  '["Yuzu", "Juniper", "Marine accord"]'::jsonb,
  '["Cypress", "Sage", "Lotus"]'::jsonb,
  '["Driftwood", "Musk", "Ambergris"]'::jsonb,
  '6–8 hours', 'Soft',
  '["Denatured alcohol", "Parfum", "Aqua", "Geraniol"]'::jsonb
),
(
  'p-velvet-fig', 'velvet-fig', 'Velvet Fig', 'Sweet',
  'A little green. A little undone.',
  'Ripe fig and creamy woods with a sheer floral lift. A modern gourmand with an editorial edge.',
  'https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&w=1000&q=85',
  '["https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&w=1000&q=85", "https://images.unsplash.com/photo-1622618991746-fe6004db3a47?auto=format&fit=crop&w=1000&q=85"]'::jsonb,
  1350, 1590, 50, 4.8, 73, 'Staff pick',
  '["Fig leaf", "Mandarin", "Pear"]'::jsonb,
  '["Violet", "Coconut milk", "Orris"]'::jsonb,
  '["Sandalwood", "Benzoin", "Musk"]'::jsonb,
  '7–9 hours', 'Moderate',
  '["Denatured alcohol", "Parfum", "Aqua", "Benzyl salicylate"]'::jsonb
),
(
  'p-saffron-neroli', 'saffron-neroli', 'Saffron Neroli', 'Floral',
  'Bright petals, warm skin.',
  'A radiant floral with neroli, saffron and creamy sandalwood. Polished, personal and easy to love.',
  'https://images.unsplash.com/photo-1758871993077-e084cc7eca86?auto=format&fit=crop&w=1000&q=85',
  '["https://images.unsplash.com/photo-1758871993077-e084cc7eca86?auto=format&fit=crop&w=1000&q=85", "https://images.unsplash.com/photo-1622618991746-fe6004db3a47?auto=format&fit=crop&w=1000&q=85"]'::jsonb,
  1100, NULL, 100, 4.5, 31, 'Everyday',
  '["Neroli", "Orange blossom", "Lemon"]'::jsonb,
  '["Saffron", "Tuberose", "Ylang ylang"]'::jsonb,
  '["Sandalwood", "Musk", "Cashmere wood"]'::jsonb,
  '6–8 hours', 'Moderate',
  '["Denatured alcohol", "Parfum", "Aqua", "Citronellol"]'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  collection = EXCLUDED.collection,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  gallery = EXCLUDED.gallery,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  size_ml = EXCLUDED.size_ml,
  rating = EXCLUDED.rating,
  review_count = EXCLUDED.review_count,
  badge = EXCLUDED.badge,
  top_notes = EXCLUDED.top_notes,
  heart_notes = EXCLUDED.heart_notes,
  base_notes = EXCLUDED.base_notes,
  longevity = EXCLUDED.longevity,
  sillage = EXCLUDED.sillage,
  ingredients = EXCLUDED.ingredients;

-- ============================================================
-- INITIAL SEED DATA FOR NEWS
-- ============================================================
INSERT INTO public.news (id, slug, title, excerpt, body, category, date, image_url, read_time) VALUES
(
  'n-01', 'how-to-build-a-scent-wardrobe', 'How to build a scent wardrobe',
  'Three moods, three bottles, one very personal ritual.',
  'A fragrance wardrobe is less about owning more and more about choosing with intention. Start with a bright daytime signature, add something with texture for evenings, and keep one quiet skin scent for yourself.',
  'Rituals', '2026-04-04',
  'https://images.unsplash.com/photo-1622618991746-fe6004db3a47?auto=format&fit=crop&w=1000&q=85',
  '4 min read'
),
(
  'n-02', 'the-art-of-the-first-spray', 'The art of the first spray',
  'Why the opening is only the beginning of your fragrance story.',
  'The first spray is an introduction, not a verdict. Give the top notes a few minutes to soften, then notice what the heart brings forward as the warmth of skin changes the composition.',
  'Notes', '2026-03-18',
  'https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&w=1000&q=85',
  '3 min read'
),
(
  'n-03', 'behind-the-bottle', 'Behind the bottle',
  'A closer look at the objects that hold our everyday rituals.',
  'We believe the bottle should feel as considered as the fragrance inside it: clear lines, comfortable weight and a silhouette that earns its place on your shelf.',
  'Studio', '2026-02-22',
  'https://images.unsplash.com/photo-1594913615593-e4b8c44625be?auto=format&fit=crop&w=1000&q=85',
  '5 min read'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  body = EXCLUDED.body,
  category = EXCLUDED.category,
  date = EXCLUDED.date,
  image_url = EXCLUDED.image_url,
  read_time = EXCLUDED.read_time;
