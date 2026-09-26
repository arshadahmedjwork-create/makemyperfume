import { supabase } from '../supabase.js';

// ---------------------------------------------------------------------------
// Helper: generate a URL-safe slug from brand + fragrance
// ---------------------------------------------------------------------------
function toSlug(brand, fragrance) {
  return `${brand}-${fragrance}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')   // strip special chars (& . ' etc.)
    .replace(/\s+/g, '-')            // spaces -> hyphens
    .replace(/-+/g, '-')             // collapse consecutive hyphens
    .replace(/^-|-$/g, '');           // trim leading/trailing hyphens
}

// ---------------------------------------------------------------------------
// 1.  CREATE TABLE SQL
// ---------------------------------------------------------------------------
const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS public.stock (
  id TEXT PRIMARY KEY,
  barcode TEXT,
  brand TEXT NOT NULL,
  fragrance TEXT NOT NULL,
  price_6ml NUMERIC,
  price_12ml NUMERIC,
  price_30ml NUMERIC,
  price_50ml NUMERIC,
  price_100ml NUMERIC,
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access on stock" ON public.stock;
CREATE POLICY "Public full access on stock" ON public.stock FOR ALL USING (true) WITH CHECK (true);
`;

// ---------------------------------------------------------------------------
// 2.  RAW STOCK DATA
//     Each row: [barcode, brand, fragrance, price_6ml, price_12ml,
//                price_30ml, price_50ml, price_100ml]
// ---------------------------------------------------------------------------
const RAW_STOCK = [
  [null, 'AMOUAGE', 'INTERLUDE', 809, 1509, 919, 1459, 2779],
  [null, 'AMOUAGE', 'REFLECTION', 809, 1509, 919, 1459, 2779],
  ['MH0188', 'ARMAF', 'CLUB', 677, 1230, 737, 1181, 2125],
  ['MH0189', 'AZZARO', 'CHROME', 489, 849, 579, 769, 1349],
  ['MH0190', 'AZZARO', 'WANTED', 489, 849, 579, 819, 1449],
  ['MH0191', 'AZZARO', 'MOST WANTED', 589, 1059, 679, 999, 1799],
  ['MH0192', 'BULGARI', 'AQUA POUR HOMME', 459, 799, 549, 779, 1359],
  ['MH0193', 'BULGARI', 'MEN IN BLACK', 499, 899, 599, 859, 1519],
  ['MH0194', 'BULGARI', 'AQUA MARINE', 469, 809, 809, 829, 1429],
  ['MH0195', 'BULGARI', 'WOOD ESSENCE', 579, 1039, 649, 1019, 1849],
  ['MH0196', 'BURBERRY', 'MR BURBERRY', 469, 809, 529, 809, 1429],
  ['MH0197', 'OFFER STOCK', '6 VERAITY', null, null, 399, null, null],
  ['MH0198', 'BURBERRY', 'WEEKEND', 459, 789, 519, 789, 1389],
  ['MH0199', 'BYREDO', 'ROSE OF NO MANS LAND', 749, 1379, 839, 1269, 2349],
  ['MH0200', 'CALVIN KLEIN', 'ONE', 459, 799, 549, 789, 1369],
  ['MH0201', 'CALVIN KLEIN', 'ETERNITY', 459, 799, 549, 789, 1369],
  ['MH0202', 'CALVIN KLEIN', 'BE', 499, 839, 569, 849, 1429],
  ['MH0203', 'CAROLINA HERRERA', '212NYC', 459, 799, 549, 769, 1349],
  ['MH0204', 'CAROLINA HERRERA', '212SEXY', 459, 799, 549, 779, 1349],
  ['MH0205', 'CAROLINA HERRERA', 'VIP', 459, 799, 549, 779, 1359],
  ['MH0206', 'CAROLINA HERRERA', 'BAD BOY', 529, 889, 599, 899, 1519],
  ['MH0207', 'CHANEL', 'ALLURE HOMME SPORTS', 449, 789, 539, 769, 1329],
  ['MH0208', 'CHANEL', 'BLEU DE CHANEL', 459, 799, 549, 789, 1369],
  ['MH0209', 'CHOPARD', 'OUD MALAKI', 509, 909, 579, 889, 1589],
  ['MH0210', 'CHRISTIAN DIOR', 'HOMME INTENSE', 469, 799, 549, 789, 1389],
  ['MH0211', 'CHRISTIAN DIOR', 'SAUVAGE', 459, 799, 549, 779, 1379],
  ['MH0212', 'CHRISTIAN DIOR', 'SAUVAGE ELIXIR', 649, 1179, 749, 1099, 1999],
  ['MH0215', 'CLINIQUE', 'HAPPY', 509, 889, 569, 889, 1589],
  [null, 'CR7', 'CR7', 589, 1059, 679, 999, 1799],
  ['MH0216', 'CREED', 'AVENTUS', 459, 799, 549, 769, 1349],
  ['MH0217', 'CREED', 'MILLESIME IMPERIAL', 649, 1189, 739, 1099, 1999],
  ['MH0218', 'CREED', 'SILVER MOUNTAIN WATER', 459, 799, 549, 769, 1339],
  ['MH0219', 'DAVID OFF', 'COOL WATER', 549, 969, 639, 919, 1639],
  ['MH0220', 'DAVID OFF', 'COOL WATER GAME', 459, 789, 519, 789, 1389],
  [null, 'DIOR', 'FAHRENHEIT', 789, 1439, 879, 1302, 2389],
  ['MH0221', 'DIPTYQ', 'TAMDAO', 880, 1678, 929, 1554, 2925],
  ['MH0213', 'DOLCE & GABBANA', 'K', 529, 949, 609, 939, 1679],
  ['MH0214', 'DOLCE & GABBANA', 'VELVET DESERT OUD', 479, 839, 539, 839, 1479],
  ['MH0222', 'DOLCE & GABBANA', 'LIGHT BLUE INTENSE', 499, 889, 599, 849, 1499],
  ['MH0223', 'DOLCE & GABBANA', 'THE ONE', 469, 819, 569, 799, 1399],
  ['MH0224', 'DUNHILL', 'DESIRE BLUE', 479, 829, 569, 799, 1419],
  ['MH0225', 'DUNHILL', 'DERSIRE RED', 459, 799, 549, 779, 1379],
  ['MH0226', 'DUNHILL', 'ICON', 459, 799, 549, 779, 1379],
  ['MH0227', 'FENDI', 'LIFE ESSENCE', 589, 1059, 669, 1049, 1899],
  ['MH0228', 'FERRARI', 'BLACK', 499, 899, 609, 859, 1539],
  ['MH0229', 'FERRARI', 'PASSION', 539, 969, 639, 919, 1649],
  ['MH0230', 'GIORGIO ARMANI', 'ACQUA DI GIO', 449, 799, 549, 770, 1349],
  ['MH0231', 'GIORGIO ARMANI', 'PROFUMO', 459, 799, 549, 770, 1349],
  ['MH0232', 'GIORGIO ARMANI', 'PROFONDO', 570, 1019, 669, 959, 1739],
  ['MH0233', 'GIORGIO ARMANI', 'CODE ABSOLU', 529, 929, 619, 889, 1589],
  ['MH0234', 'GIORGIO ARMANI', 'STRONGER WITH YOU', 499, 899, 609, 869, 1539],
  ['MH0235', 'GIORGIO ARMANI', 'BLACK OUD PROFUMO', 479, 789, 549, 789, 1379],
  ['MH0236', 'GIORGIO ARMANI', 'PRIVE OUD ROYALE', 489, 860, 549, 859, 1519],
  [null, 'GIORGIO ARMANI', 'PROFUMO', 469, 819, 569, 799, 1399],
  ['MH0237', 'GIVENCHEY', 'BLUE LABEL', 559, 999, 649, 949, 1699],
  ['MH0238', 'GIVENCHEY', 'GENTLEMEN', 509, 859, 579, 889, 1589],
  ['MH0239', 'GUCCI', 'GUILTY', 499, 899, 609, 869, 1539],
  ['MH0240', 'GUCCI', 'OUD', 519, 919, 609, 879, 1539],
  ['MH0241', 'GUCCI', 'VOICE OF THE SNAKE', 590, 1059, 679, 999, 1799],
  ['MH0242', 'GUCCI', 'GUITY INTENSE', 489, 879, 569, 879, 1559],
  ['MH0243', 'HERMES', 'TERRE DE HERMES', 559, 999, 649, 949, 1699],
  [null, 'HUGO BOSS', 'SCENT', 590, 1059, 679, 999, 1799],
  ['MH0244', 'HUGO BOSS', 'ORANGE MAN', 489, 849, 579, 819, 1449],
  ['MH0245', 'HUGO BOSS', 'BOTTLED NIGHT', 459, 789, 549, 789, 1389],
  ['MH0246', 'HUGO BOSS', 'HUGO MAN', 449, 769, 549, 759, 1319],
  ['MH0247', 'ISSEYMIYAKE', 'POUR HOMME', 539, 949, 629, 899, 1619],
  ['MH0248', 'ISSEYMIYAKE', 'INTENSE', 479, 839, 539, 839, 1479],
  [null, 'JAGUAR', 'CLASSIC', 590, 1059, 679, 999, 1799],
  ['MH0249', 'JEAN PAUL GAULTIER', 'ULTRA MALE', 739, 1359, 819, 1239, 2289],
  ['MH0250', 'JEAN PAUL GAULTIER', 'LE MALE LE', 569, 983, 631, 975, 1684],
  [null, 'JEAN PAUL GAUTIER', 'LEMALE', 590, 1059, 679, 999, 1799],
  ['MH0252', 'JIMMY CHOO', 'CHOO', 519, 899, 609, 869, 1539],
  ['MH0251', 'JPG', 'SCANDAL', 579, 999, 649, 999, 1799],
  ['MH0253', 'KILLIAN', 'BLACK PHANTOM', 1236, 2348, 1266, 2210, 4331],
  ['MH0254', 'KILLIAN', 'ANGLE SHARE', 945, 1823, 991, 1675, 3184],
  ['MH0255', 'KILLIAN', 'INTOXICATED', 829, 1559, 879, 1459, 2709],
  ['MH0256', 'LACOSTE', '12.12. BLACK', 519, 899, 609, 869, 1539],
  ['MH0257', 'LACOSTE', 'RED', 539, 969, 639, 919, 1649],
  ['MH0258', 'LANCOME', 'OUD BOUTIQUE', 879, 1679, 929, 1549, 2919],
  ['MH0259', 'LOUISE VUITTON', 'AFTERNOON SWIM', 749, 1379, 849, 1259, 2329],
  ['MH0260', 'LOUISE VUITTON', 'OMBRE NOMADE', 719, 1319, 809, 1199, 2229],
  [null, 'LOUISE VUITTON', 'IMAGINATION', 1649, 3219, 1659, 2969, 5959],
  [null, 'LOUISE VUITTON', 'PACIFIC CHILL', 1649, 3219, 1659, 2969, 5959],
  ['MH0261', 'MAISON FRANCIS KURKDJIAN', 'BACCART ROUGE 540', 599, 1109, 699, 1029, 1869],
  ['MH0262', 'MANCERA', 'RED TOBACCO', 639, 1159, 729, 1069, 1949],
  ['MH0263', 'MANCERA', 'ROSES VANILLA', 599, 1089, 689, 1019, 1839],
  ['MH0264', 'MERCEDES BENZ', 'MEN', 510, 909, 579, 889, 1609],
  ['MH0265', 'MONTBLAC', 'EMBLEM', 499, 899, 609, 869, 1539],
  ['MH0266', 'MONTBLAC', 'EXPLOPER', 819, 1519, 909, 1370, 2549],
  ['MH0267', 'MONTBLAC', 'LEGEND', 539, 969, 639, 919, 1639],
  ['MH0268', 'MOCHINO', 'TOY BOY', 523, 939, 639, 929, 1659],
  ['MH0269', 'NASOMATTO', 'BLACK AFGANO', 539, 970, 649, 959, 1719],
  ['MH0270', 'PACO RABANNE', 'BLACK XS', 549, 789, 509, 789, 1389],
  ['MH0271', 'PACO RABANNE', 'INVCTUS', 449, 779, 509, 779, 1369],
  ['MH0272', 'PACO RABANNE', 'ONE MILLION', 459, 789, 519, 799, 1389],
  ['MH0273', 'PACO RABANNE', 'ONE MILLION LUCKY', 519, 919, 589, 909, 1629],
  ['MH0274', 'PACO RABANNE', 'ONE MILLION PRIVE', 459, 809, 529, 810, 1429],
  [null, 'PACO RABANNE', 'ONE MILLION ELIXIR', 719, 1319, 809, 1199, 2229],
  ['MH0275', 'PARFUM DE MARLEY', 'PEGASUS', 722, 1329, 780, 1263, 2302],
  ['MH0276', 'PARFUM DE MARLEY', 'HEROD', 1030, 1915, 1072, 1832, 3520],
  ['MH0277', 'PARFUM DE MARLEY', 'LAYTON', 722, 1329, 780, 1263, 2302],
  ['MH0278', 'PRADA', 'L HOMME', 789, 1469, 889, 1429, 2659],
  ['MH0279', 'PRADA', 'L HOMME INTENSE', 789, 1469, 889, 1429, 2659],
  ['MH0280', 'PRADA', 'LUNA ROSSA CARBON', 809, 1509, 919, 1459, 2779],
  ['MH0281', 'RALPH LAUREN', 'POLO BLUE', 459, 789, 519, 789, 1389],
  [null, 'RASASE', 'HAWAS', 809, 1509, 919, 1459, 2779],
  ['MH0282', 'RASASE', 'BLUE FOR MEN', 489, 879, 569, 869, 1559],
  ['MH0283', 'RASASE', 'DAAREJ', 489, 839, 569, 839, 1479],
  ['MH0284', 'ROJA DOVE', 'AMBER AOUD', 736, 1360, 793, 1290, 2359],
  ['MH0285', 'ROJA DOVE', 'ELYSIUM', 1647, 3214, 1656, 2968, 5956],
  ['MH0286', 'THEIRY MUGLER', 'AMEN PURE HAVANE', 569, 1039, 649, 1019, 1839],
  ['MH0287', 'TOM FORD', 'LOST CHERRY', 489, 879, 569, 879, 1559],
  ['MH0288', 'TOM FORD', 'OMBRE LEATHER', 489, 879, 569, 879, 1559],
  ['MH0289', 'TOM FORD', 'TUSCAN LEATHER', 469, 819, 529, 819, 1439],
  ['MH0290', 'TOM FORD', 'OUD FLEUR', 489, 859, 549, 849, 1509],
  ['MH0291', 'TOM FORD', 'OUD WOOD', 489, 859, 549, 859, 1519],
  ['MH0292', 'TOM FORD', 'TOBACCO VANILLA', 469, 809, 529, 809, 1429],
  [null, 'TOM FORD', 'NOIR EXTREME', 789, 1399, 879, 1302, 2389],
  [null, 'TOM FORD', 'BLACK ORCHID', 789, 1399, 879, 1302, 2389],
  ['MH0293', 'TOMMY HILFIGER', 'TOMMY BOY', 489, 859, 549, 859, 1519],
  ['MH0294', 'VERSACE', 'DYLAN BLUE', 469, 809, 529, 809, 1429],
  ['MH0295', 'VERSACE', 'EROS', 469, 809, 529, 809, 1429],
  ['MH0296', 'VERSACE', 'POUR HOMME', 459, 789, 519, 789, 1389],
  [null, 'VIKTOR & ROLF', 'SPICEBOMB EXTREME', 1259, 2179, 1279, 1999, 3799],
  ['MH0298', 'YSL', 'Y', 469, 819, 529, 819, 1439],
  ['MH0299', 'YSL', 'TUXEDO', 743, 1376, 800, 1302, 2385],
  ['MH0300', 'YSL', 'SUPREME BOUQUET', 542, 931, 609, 932, 1592],
  ['MH0301', 'YSL', 'LA NUIT DE LHOMME', null, null, null, 1099, 1999],
  ['MH0297', 'YSL', 'MYSELF', null, null, null, 1199, 2229],
];

// ---------------------------------------------------------------------------
// 3.  Build stock rows with unique IDs
// ---------------------------------------------------------------------------
function buildStockRows() {
  const seenIds = new Set();
  return RAW_STOCK.map(([barcode, brand, fragrance, p6, p12, p30, p50, p100]) => {
    let id = toSlug(brand, fragrance);

    // Handle duplicate IDs (e.g. second GIORGIO ARMANI PROFUMO)
    if (seenIds.has(id)) {
      id = `${id}-2`;
    }
    seenIds.add(id);

    return {
      id,
      barcode:      barcode ?? null,
      brand,
      fragrance,
      price_6ml:    p6 ?? null,
      price_12ml:   p12 ?? null,
      price_30ml:   p30 ?? null,
      price_50ml:   p50 ?? null,
      price_100ml:  p100 ?? null,
      in_stock:     true,
    };
  });
}

// ---------------------------------------------------------------------------
// 4.  Main seed function
// ---------------------------------------------------------------------------
async function seed() {
  console.log('=== Stock Seed Script ===\n');

  // ---- Step 1: Attempt to create the stock table -------------------------
  console.log('[1/2] Creating stock table if it does not exist...');
  try {
    // Attempt via supabase.rpc – requires an `exec_sql` function in the DB.
    // Create it once in the Supabase SQL editor:
    //
    //   CREATE OR REPLACE FUNCTION exec_sql(query text)
    //   RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
    //   BEGIN EXECUTE query; END; $$;
    //
    const { error } = await supabase.rpc('exec_sql', { query: CREATE_TABLE_SQL });
    if (error) throw error;
    console.log('       Stock table created / already exists (via exec_sql RPC).');
  } catch (err) {
    console.log('       Could not create table via RPC:', err.message || err);
    console.log('       If the table does not exist yet, run the following SQL');
    console.log('       in the Supabase SQL Editor, then re-run this script:\n');
    console.log(CREATE_TABLE_SQL);
    console.log('       Continuing to upsert data (will fail if table is missing)...\n');
  }

  // ---- Step 2: Upsert stock data in batches ------------------------------
  const rows = buildStockRows();
  console.log(`[2/2] Upserting ${rows.length} stock items...\n`);

  const BATCH_SIZE = 50;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(rows.length / BATCH_SIZE);

    const { error } = await supabase
      .from('stock')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`  Batch ${batchNum}/${totalBatches} FAILED:`, error.message);
      errors += batch.length;
    } else {
      inserted += batch.length;
      console.log(`  Batch ${batchNum}/${totalBatches} OK  (${batch.length} items)`);
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`  Inserted/updated: ${inserted}`);
  if (errors > 0) console.log(`  Errors:           ${errors}`);
  console.log(`  Total rows:       ${rows.length}`);
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
