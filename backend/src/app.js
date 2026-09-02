import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { supabase } from './supabase.js';
import { SEED_PRODUCTS, NEWS } from './data/seed.js';

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

  if (userObj.password !== password) {
    return res.status(401).json({ detail: 'Incorrect password' });
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
    password,
    name: name || '',
    phone: phone || '',
    address: address || '',
    city: city || '',
    state: state || '',
    pincode: pincode || '',
    created_at: new Date().toISOString()
  };

  usersCache.set(cleanEmail, newUser);

  try {
    await supabase.from('users').upsert(newUser, { onConflict: 'email' });
  } catch (err) {
    console.error('Supabase register upsert error:', err);
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

  try {
    await supabase.from('users').upsert(existing, { onConflict: 'email' });
  } catch (err) {
    console.error('Supabase update profile error:', err);
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

  try {
    await supabase
      .from('subscribers')
      .upsert({ id: recordId, email: cleanEmail, consent: Boolean(consent) }, { onConflict: 'email' });
  } catch (err) {
    console.error('Supabase upsert error (subscribers):', err);
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

  try {
    const { data: existing } = await supabase
      .from('orders')
      .select('response')
      .eq('idempotency_key', idempotency_key)
      .maybeSingle();

    if (existing?.response) {
      return res.json(existing.response);
    }
  } catch (err) {
    console.error('Supabase query error (orders):', err);
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

  try {
    await supabase
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
  } catch (err) {
    console.error('Supabase insert error (orders):', err);
  }

  res.json(responseData);
});

app.use('/api', apiRouter);

export default app;
