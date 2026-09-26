import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { supabase } from './supabase.js';
import { SEED_PRODUCTS, NEWS } from './data/seed.js';
import { hashPassword, verifyPassword, createAdminToken, verifyAdminToken } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const app = express();
const corsOrigins = (process.env.CORS_ORIGINS || '*').split(',');

app.use(cors({
  origin: corsOrigins.includes('*') ? '*' : corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['*']
}));

app.use(express.json());

const apiRouter = express.Router();

// In-memory Users cache for fallback/fast response
const usersCache = new Map();

// Helper to sanitize user object (exclude password)
function sanitizeUser(u) {
  const { password, ...safe } = u;
  return safe;
}

function requireAdmin(req, res, next) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    return res.status(503).json({ detail: 'Admin auth is not configured on the server.' });
  }
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!verifyAdminToken(token, secret)) {
    return res.status(401).json({ detail: 'Unauthorized' });
  }
  next();
}

apiRouter.post('/admin/login', (req, res) => {
  const { email, password } = req.body || {};
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminHash = process.env.ADMIN_PASSWORD_HASH;
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!adminEmail || !adminHash || !secret) {
    return res.status(503).json({
      detail: 'Admin auth is not configured. Run: node backend/scripts/set-admin-password.js <email> <password>'
    });
  }

  // Always verify so a wrong email and a wrong password cost the same time.
  const passwordOk = verifyPassword(password || '', adminHash);
  const emailOk = (email || '').toLowerCase().trim() === adminEmail.toLowerCase().trim();

  if (!emailOk || !passwordOk) {
    return res.status(401).json({ detail: 'Invalid email or password' });
  }

  res.json({ token: createAdminToken(secret) });
});

apiRouter.get('/admin/session', requireAdmin, (req, res) => res.json({ valid: true }));

apiRouter.use('/admin/stock', requireAdmin);

// Check if Email Exists
apiRouter.post('/auth/check-email', async (req, res) => {
  const { email } = req.body;
  const cleanEmail = (email || '').toLowerCase().trim();
  if (!cleanEmail) return res.status(400).json({ detail: 'Email is required' });

  if (usersCache.has(cleanEmail)) {
    return res.json({ exists: true });
  }

  try {
    const { data } = await supabase.from('users').select('id').eq('email', cleanEmail).maybeSingle();
    if (data) return res.json({ exists: true });
  } catch (err) {
    console.error('Supabase check-email error:', err);
  }

  res.json({ exists: false });
});

// Login
apiRouter.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const cleanEmail = (email || '').toLowerCase().trim();
  if (!cleanEmail || !password) {
    return res.status(400).json({ detail: 'Email and password are required' });
  }

  let userObj = usersCache.get(cleanEmail);

  if (!userObj) {
    try {
      const { data } = await supabase.from('users').select('*').eq('email', cleanEmail).maybeSingle();
      if (data) userObj = data;
    } catch (err) {
      console.error('Supabase login query error:', err);
    }
  }

  if (!userObj) {
    return res.status(401).json({ detail: 'Invalid email or password' });
  }

  if (!verifyPassword(password, userObj.password)) {
    return res.status(401).json({ detail: 'Invalid email or password' });
  }

  const token = `token-${crypto.randomUUID()}`;
  res.json({ user: sanitizeUser(userObj), token });
});

// Register
apiRouter.post('/auth/register', async (req, res) => {
  const { email, password, name, phone, address, city, state, pincode } = req.body;
  const cleanEmail = (email || '').toLowerCase().trim();
  if (!cleanEmail || !password) {
    return res.status(400).json({ detail: 'Email and password are required' });
  }

  if (usersCache.has(cleanEmail)) {
    return res.status(400).json({ detail: 'User with this email already exists' });
  }

  const userId = `usr-${crypto.randomUUID().slice(0, 8)}`;
  const newUser = {
    id: userId,
    email: cleanEmail,
    password: hashPassword(password),
    name: name || '',
    phone: phone || '',
    address: address || '',
    city: city || '',
    state: state || '',
    pincode: pincode || '',
    created_at: new Date().toISOString()
  };

  usersCache.set(cleanEmail, newUser);

  const { error: registerError } = await supabase.from('users').upsert(newUser, { onConflict: 'email' });

  if (registerError) {
    console.error('Supabase register upsert error:', registerError.message);
    usersCache.delete(cleanEmail);
    return res.status(503).json({ detail: 'Could not create your account. Please try again.' });
  }

  const token = `token-${crypto.randomUUID()}`;
  res.json({ user: sanitizeUser(newUser), token });
});

// Update Profile / Address
apiRouter.put('/auth/profile', async (req, res) => {
  const { email, name, phone, address, city, state, pincode } = req.body;
  const cleanEmail = (email || '').toLowerCase().trim();
  if (!cleanEmail) return res.status(400).json({ detail: 'Email is required' });

  let existing = usersCache.get(cleanEmail) || { id: `usr-${crypto.randomUUID().slice(0, 8)}`, email: cleanEmail };
  existing = {
    ...existing,
    ...(name !== undefined && { name }),
    ...(phone !== undefined && { phone }),
    ...(address !== undefined && { address }),
    ...(city !== undefined && { city }),
    ...(state !== undefined && { state }),
    ...(pincode !== undefined && { pincode })
  };

  usersCache.set(cleanEmail, existing);

  const { error: profileError } = await supabase.from('users').upsert(existing, { onConflict: 'email' });

  if (profileError) {
    console.error('Supabase update profile error:', profileError.message);
    return res.status(503).json({ detail: 'Could not save your profile. Please try again.' });
  }

  res.json({ user: sanitizeUser(existing) });
});

// Customer Order History
apiRouter.get('/orders/my-orders', async (req, res) => {
  const { email } = req.query;
  const cleanEmail = (email || '').toLowerCase().trim();
  if (!cleanEmail) return res.json([]);

  const userOrders = [];

  // Check in-memory ordersCache first
  for (const [key, val] of ordersCache.entries()) {
    if (val.email && val.email.toLowerCase() === cleanEmail) {
      userOrders.push(val);
    }
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('email', cleanEmail)
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      data.forEach(row => {
        if (!userOrders.some(o => o.order_id === row.id)) {
          userOrders.push({
            order_id: row.id,
            status: row.response?.status || 'payment_confirmed',
            payable_total: row.response?.payable_total || 0,
            items: row.items || [],
            created_at: row.created_at || new Date().toISOString(),
            message: row.response?.message || 'Order completed'
          });
        }
      });
    }
  } catch (err) {
    console.error('Supabase my-orders query error:', err);
  }

  res.json(userOrders);
});

// Health Check
apiRouter.get('/', (req, res) => {
  res.json({ message: 'Hello World' });
});

// Products List
apiRouter.get('/products', async (req, res) => {
  const { search, collection } = req.query;
  let items = null;

  try {
    let query = supabase.from('products').select('*');
    if (collection && collection !== 'All') {
      query = query.eq('collection', collection);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,tagline.ilike.%${search}%`);
    }
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      items = data;
    }
  } catch (err) {
    console.error('Supabase query error (products):', err);
  }

  if (!items) {
    items = SEED_PRODUCTS.filter(item => {
      const matchesCollection = !collection || collection === 'All' || item.collection === collection;
      const matchesSearch = !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.tagline.toLowerCase().includes(search.toLowerCase());
      return matchesCollection && matchesSearch;
    });
  }

  res.json({ items, total: items.length });
});

// Product Detail by Slug
apiRouter.get('/products/:slug', async (req, res) => {
  const { slug } = req.params;
  let product = null;

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (!error && data) {
      product = data;
    }
  } catch (err) {
    console.error('Supabase query error (product detail):', err);
  }

  if (!product) {
    product = SEED_PRODUCTS.find(p => p.slug === slug);
  }

  if (!product) {
    return res.status(404).json({ detail: 'Product not found' });
  }

  res.json(product);
});

// News List
apiRouter.get('/news', async (req, res) => {
  let items = null;

  try {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('date', { ascending: false });
    if (!error && data && data.length > 0) {
      items = data;
    }
  } catch (err) {
    console.error('Supabase query error (news):', err);
  }

  if (!items) {
    items = NEWS;
  }

  res.json(items);
});

// News Detail by Slug
apiRouter.get('/news/:slug', async (req, res) => {
  const { slug } = req.params;
  let newsItem = null;

  try {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (!error && data) {
      newsItem = data;
    }
  } catch (err) {
    console.error('Supabase query error (news detail):', err);
  }

  if (!newsItem) {
    newsItem = NEWS.find(n => n.slug === slug);
  }

  if (!newsItem) {
    return res.status(404).json({ detail: 'News item not found' });
  }

  res.json(newsItem);
});

// Subscribers
apiRouter.post('/subscribers', async (req, res) => {
  const { email, consent } = req.body;
  const recordId = crypto.randomUUID();
  const cleanEmail = (email || '').toLowerCase().trim();

  const { error: subscribeError } = await supabase
    .from('subscribers')
    .upsert({ id: recordId, email: cleanEmail, consent: Boolean(consent) }, { onConflict: 'email' });

  if (subscribeError) {
    console.error('Supabase upsert error (subscribers):', subscribeError.message);
    return res.status(503).json({ detail: 'Could not complete signup. Please try again.' });
  }

  res.json({
    id: recordId,
    status: 'subscribed',
    message: 'Welcome to the inner circle. Your 10% code is PREPAID10.'
  });
});

// Contact
apiRouter.post('/contact', async (req, res) => {
  const { name, email, message, website } = req.body;
  const recordId = crypto.randomUUID();

  if (website) {
    return res.json({
      id: recordId,
      status: 'received',
      message: 'Thanks — your note is with our studio.'
    });
  }

  try {
    await supabase
      .from('contact_submissions')
      .insert({ id: recordId, name, email, message });
  } catch (err) {
    console.error('Supabase insert error (contact):', err);
  }

  res.json({
    id: recordId,
    status: 'received',
    message: 'Thanks — your note is with our studio.'
  });
});

// --- Stock CRUD (Admin) ---

// Helper: generate slug id from brand + fragrance
function generateStockId(brand, fragrance) {
  return `${brand}-${fragrance}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const STOCK_SIZES = ['6ml', '12ml', '30ml', '50ml', '100ml'];

function toQuantity(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

// GET /api/admin/stock — List all stock items
apiRouter.get('/admin/stock', async (req, res) => {
  const { search } = req.query;
  try {
    let query = supabase.from('stock').select('*').order('brand').order('fragrance');
    if (search) {
      query = query.or(`brand.ilike.%${search}%,fragrance.ilike.%${search}%`);
    }
    const { data, error } = await query;
    if (error) {
      if (error.message.includes("Could not find the table") || error.code === 'PGRST204' || error.code === 'PGRST205') {
        return res.json({ items: [], total: 0 });
      }
      return res.status(500).json({ detail: error.message });
    }
    res.json({ items: data || [], total: (data || []).length });
  } catch (err) {
    console.error('Supabase error (admin stock list):', err);
    res.status(500).json({ detail: err.message });
  }
});

// GET /api/admin/stock/:id — Get a single stock item
apiRouter.get('/admin/stock/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('stock')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) {
      return res.status(500).json({ detail: error.message });
    }
    if (!data) {
      return res.status(404).json({ detail: 'Stock item not found' });
    }
    res.json(data);
  } catch (err) {
    console.error('Supabase error (admin stock detail):', err);
    res.status(500).json({ detail: err.message });
  }
});

// POST /api/admin/stock — Create a new stock item
apiRouter.post('/admin/stock', async (req, res) => {
  const { barcode, brand, fragrance, price_6ml, price_12ml, price_30ml, price_50ml, price_100ml, in_stock } = req.body;
  if (!brand || !fragrance) {
    return res.status(400).json({ detail: 'brand and fragrance are required' });
  }
  const id = generateStockId(brand, fragrance);
  const newItem = {
    id,
    barcode: barcode || null,
    brand,
    fragrance,
    price_6ml: price_6ml ?? null,
    price_12ml: price_12ml ?? null,
    price_30ml: price_30ml ?? null,
    price_50ml: price_50ml ?? null,
    price_100ml: price_100ml ?? null,
    in_stock: in_stock !== undefined ? Boolean(in_stock) : true
  };
  for (const size of STOCK_SIZES) {
    newItem[`qty_${size}`] = toQuantity(req.body[`qty_${size}`]);
  }
  try {
    const { data, error } = await supabase.from('stock').insert(newItem).select().single();
    if (error) {
      return res.status(500).json({ detail: error.message });
    }
    res.status(201).json(data);
  } catch (err) {
    console.error('Supabase error (admin stock create):', err);
    res.status(500).json({ detail: err.message });
  }
});

// PUT /api/admin/stock/:id — Update a stock item
apiRouter.put('/admin/stock/:id', async (req, res) => {
  const { id } = req.params;
  const updates = {};
  const allowedFields = ['barcode', 'brand', 'fragrance', 'price_6ml', 'price_12ml', 'price_30ml', 'price_50ml', 'price_100ml', 'in_stock'];
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = field === 'in_stock' ? Boolean(req.body[field]) : req.body[field];
    }
  }
  for (const size of STOCK_SIZES) {
    const key = `qty_${size}`;
    if (req.body[key] !== undefined) updates[key] = toQuantity(req.body[key]);
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ detail: 'No valid fields to update' });
  }
  try {
    const { data, error } = await supabase
      .from('stock')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      return res.status(500).json({ detail: error.message });
    }
    if (!data) {
      return res.status(404).json({ detail: 'Stock item not found' });
    }
    res.json(data);
  } catch (err) {
    console.error('Supabase error (admin stock update):', err);
    res.status(500).json({ detail: err.message });
  }
});

// DELETE /api/admin/stock/:id — Delete a stock item
apiRouter.delete('/admin/stock/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from('stock').delete().eq('id', id);
    if (error) {
      return res.status(500).json({ detail: error.message });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Supabase error (admin stock delete):', err);
    res.status(500).json({ detail: err.message });
  }
});

// POST /api/admin/stock/bulk-delete — Delete multiple stock items
apiRouter.post('/admin/stock/bulk-delete', async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ detail: 'ids array is required' });
  }
  try {
    const { error, count } = await supabase.from('stock').delete().in('id', ids);
    if (error) {
      return res.status(500).json({ detail: error.message });
    }
    res.json({ success: true, deleted: count ?? ids.length });
  } catch (err) {
    console.error('Supabase error (admin stock bulk-delete):', err);
    res.status(500).json({ detail: err.message });
  }
});

// --- Stock (Public / Storefront) ---

// GET /api/stock — Public stock listing (in-stock items only)
apiRouter.get('/stock', async (req, res) => {
  const { search, brand } = req.query;
  try {
    let query = supabase.from('stock').select('*').eq('in_stock', true).order('brand');
    if (search) {
      query = query.or(`brand.ilike.%${search}%,fragrance.ilike.%${search}%`);
    }
    if (brand) {
      query = query.eq('brand', brand);
    }
    const { data, error } = await query;
    if (error) {
      return res.status(500).json({ detail: error.message });
    }
    res.json({ items: data || [], total: (data || []).length });
  } catch (err) {
    console.error('Supabase error (public stock list):', err);
    res.status(500).json({ detail: err.message });
  }
});

// GET /api/brands — Public list of unique brand names
apiRouter.get('/brands', async (req, res) => {
  try {
    const { data, error } = await supabase.from('stock').select('brand');
    if (error) {
      return res.status(500).json({ detail: error.message });
    }
    const uniqueBrands = [...new Set((data || []).map(row => row.brand))].sort();
    res.json(uniqueBrands);
  } catch (err) {
    console.error('Supabase error (brands list):', err);
    res.status(500).json({ detail: err.message });
  }
});

// Checkout Preview Calculation Helper
function calculateCheckout({ items = [], payment_method = 'prepaid', promo_code }) {
  const subtotal = Math.round(items.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0) * 100) / 100;
  const prepaid = payment_method === 'prepaid';
  const promo_applied = prepaid && (!promo_code || promo_code.toUpperCase() === 'PREPAID10');
  const discount = promo_applied ? Math.round(subtotal * 0.10 * 100) / 100 : 0;
  const taxable = Math.max(subtotal - discount, 0);
  const gst = Math.round(taxable * 0.18 * 100) / 100;
  const shipping = subtotal >= 999 ? 0 : 99;
  const cod_fee = payment_method === 'cod' ? 80 : 0;
  const total = Math.round((taxable + gst + shipping + cod_fee) * 100) / 100;

  return {
    subtotal,
    gst,
    shipping,
    discount,
    cod_fee,
    total,
    free_shipping_threshold: 999,
    free_shipping_remaining: Math.max(999 - subtotal, 0),
    promo_applied,
    payment_method
  };
}

// Checkout Preview
apiRouter.post('/checkout/preview', (req, res) => {
  const result = calculateCheckout(req.body);
  res.json(result);
});

// In-memory orders cache fallback
const ordersCache = new Map();

// Mock Order Creation
apiRouter.post('/orders/mock', async (req, res) => {
  const {
    customer_name,
    email,
    phone,
    address,
    city,
    state,
    pincode,
    items,
    payment_method = 'prepaid',
    promo_code,
    idempotency_key
  } = req.body;

  if (idempotency_key && ordersCache.has(idempotency_key)) {
    return res.json(ordersCache.get(idempotency_key));
  }

  const { data: existingOrder, error: lookupError } = await supabase
    .from('orders')
    .select('response')
    .eq('idempotency_key', idempotency_key)
    .maybeSingle();

  if (lookupError) {
    console.error('Supabase query error (orders):', lookupError.message);
  } else if (existingOrder?.response) {
    return res.json(existingOrder.response);
  }

  const preview = calculateCheckout({ items, payment_method, promo_code });
  const orderId = `MMP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const status = payment_method === 'prepaid' ? 'payment_confirmed' : 'cod_pending';
  const responseData = {
    order_id: orderId,
    status,
    message: status === 'payment_confirmed' ? 'Payment confirmed in demo mode.' : 'Order reserved. Pay on delivery.',
    payable_total: preview.total,
    payment_provider: 'mocked_razorpay_boundary',
    checkout_mode: 'mocked'
  };

  const cleanEmail = (email || '').toLowerCase().trim();
  const orderRecord = {
    order_id: orderId,
    status,
    message: status === 'payment_confirmed' ? 'Payment confirmed in demo mode.' : 'Order reserved. Pay on delivery.',
    payable_total: preview.total,
    items,
    customer_name,
    email: cleanEmail,
    phone,
    address,
    city,
    state,
    pincode,
    created_at: new Date().toISOString()
  };

  if (idempotency_key) {
    ordersCache.set(idempotency_key, orderRecord);
  }

  // Auto update user's saved address if user exists
  if (cleanEmail && usersCache.has(cleanEmail)) {
    const existing = usersCache.get(cleanEmail);
    usersCache.set(cleanEmail, {
      ...existing,
      name: customer_name || existing.name,
      phone: phone || existing.phone,
      address: address || existing.address,
      city: city || existing.city,
      state: state || existing.state,
      pincode: pincode || existing.pincode
    });
  }

  const { error: orderError } = await supabase
    .from('orders')
    .insert({
      id: orderId,
      idempotency_key,
      customer_name,
      email: cleanEmail,
      phone,
      address,
      city,
      state,
      pincode,
      items,
      response: responseData,
      created_at: new Date().toISOString()
    });

  if (orderError) {
    console.error('Supabase insert error (orders):', orderError.message);
    if (idempotency_key) ordersCache.delete(idempotency_key);
    return res.status(503).json({
      detail: 'Order could not be saved. No payment has been taken — please try again.'
    });
  }

  res.json(responseData);
});

app.use('/api', apiRouter);

export default app;
