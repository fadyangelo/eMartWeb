import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { getDb, saveDb } from './server/db';
import { User, Product, Category, Order, OrderStatus, StatusHistoryItem, SystemSettings, Transaction, BackupFile, ActivityLog, ShippingCity } from './src/types';
import Stripe from 'stripe';

const app = express();
const PORT = 3000;

// JSON request body parser
app.use(express.json());

// API Key status helper
const isStripeConfigured = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  return key && key !== 'sk_test_placeholder' && key.trim() !== '';
};

// Initialize Stripe if configured
let stripe: Stripe | null = null;
if (isStripeConfigured()) {
  try {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-01-15.acacia' as any, // Using stable API version
    });
    console.log('Stripe initialized with user-provided API key.');
  } catch (err) {
    console.error('Error initializing Stripe:', err);
  }
} else {
  console.log('Stripe is in sandbox/simulation mode (no valid API key provided).');
}

// Simple authentication middleware
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized. Please login.' });
  }
  const token = authHeader.split(' ')[1];
  const db = getDb();
  // Simplified token is just the userId for demo/simulated environment
  const user = db.users.find(u => u.id === token);
  if (!user) {
    return res.status(401).json({ message: 'Invalid session token. Please re-authenticate.' });
  }
  if (user.disabled) {
    return res.status(403).json({ message: 'This account has been disabled. Please contact support.' });
  }
  (req as any).user = user;
  next();
};

// Admin authentication middleware
const requireAdminOrManager = (req: Request, res: Response, next: NextFunction) => {
  authenticate(req, res, () => {
    const user = (req as any).user as User;
    if (user.role !== 'admin' && user.role !== 'manager') {
      return res.status(403).json({ message: 'Forbidden. Admin or Manager access required.' });
    }
    next();
  });
};

// Granular permission check middleware helper
const checkPermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    requireAdminOrManager(req, res, () => {
      const user = (req as any).user as User;
      if (user.role === 'admin') {
        // Admins can do everything
        return next();
      }
      if (user.role === 'manager' && user.permissions?.includes(permission)) {
        return next();
      }
      return res.status(403).json({ message: `Access Denied: Missing permission '${permission}'` });
    });
  };
};

// Activity Logging helper
const logActivity = (req: any, action: string, description: string) => {
  const db = getDb();
  if (!db.activityLogs) {
    db.activityLogs = [];
  }
  const user = req.user;
  const userEmail = user ? user.email : 'system@emart.com';
  const userName = user ? user.name : 'System';
  
  const ipAddress = req.ip || req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || '';
  const userAgent = req.headers?.['user-agent'] || '';

  const newLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toISOString(),
    userEmail,
    userName,
    action,
    description,
    ipAddress: String(ipAddress),
    userAgent: String(userAgent),
  };

  db.activityLogs.unshift(newLog);
  if (db.activityLogs.length > 1000) {
    db.activityLogs = db.activityLogs.slice(0, 1000);
  }
  saveDb(db);
};

// ----------------------------------------------------
// AUTH ENDPOINTS
// ----------------------------------------------------

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const db = getDb();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  if (user.disabled) {
    return res.status(403).json({ message: 'This account has been disabled. Please contact support.' });
  }

  const userPassword = db.passwords[user.id];
  if (userPassword !== password) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  // Log successful login
  logActivity({ user, ip: req.ip, headers: req.headers, socket: req.socket }, 'User Login', `${user.name} (${user.role}) logged in successfully.`);

  res.json({
    token: user.id, // Simplistic token
    user,
  });
});

app.post('/api/auth/signup', (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const db = getDb();
  const exists = db.users.some(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ message: 'Email already registered.' });
  }

  const newUser: User = {
    id: `u-${Date.now()}`,
    name,
    email,
    role: 'customer',
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  db.passwords[newUser.id] = password;
  saveDb(db);

  res.status(201).json({
    token: newUser.id,
    user: newUser,
  });
});

// ----------------------------------------------------
// PRODUCT & CATEGORY ENDPOINTS
// ----------------------------------------------------

app.get('/api/products', (req: Request, res: Response) => {
  const db = getDb();
  let results = [...db.products];

  // If not admin or manager, filter out disabled products
  const authHeader = req.headers.authorization;
  let isAdmin = false;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const user = db.users.find(u => u.id === token);
    if (user && (user.role === 'admin' || user.role === 'manager')) {
      isAdmin = true;
    }
  }

  if (!isAdmin) {
    results = results.filter(p => p.enabled !== false);
  }

  // Filters
  const categoryId = req.query.categoryId as string;
  const search = req.query.search as string;
  const minPrice = parseFloat(req.query.minPrice as string);
  const maxPrice = parseFloat(req.query.maxPrice as string);
  const sort = req.query.sort as string; // 'price-asc', 'price-desc', 'name', 'popular'

  if (categoryId) {
    results = results.filter(p => p.categoryId === categoryId);
  }

  if (search) {
    const q = search.toLowerCase();
    results = results.filter(p =>
      p.nameEn.toLowerCase().includes(q) ||
      p.nameAr.toLowerCase().includes(q) ||
      p.descriptionEn.toLowerCase().includes(q) ||
      p.descriptionAr.toLowerCase().includes(q)
    );
  }

  if (!isNaN(minPrice)) {
    results = results.filter(p => p.price >= minPrice);
  }
  if (!isNaN(maxPrice)) {
    results = results.filter(p => p.price <= maxPrice);
  }

  // Sorting
  if (sort === 'price-asc') {
    results.sort((a, b) => a.price - b.price);
  } else if (sort === 'price-desc') {
    results.sort((a, b) => b.price - a.price);
  } else if (sort === 'name') {
    results.sort((a, b) => a.nameEn.localeCompare(b.nameEn));
  } else if (sort === 'popular') {
    results.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
  }

  // Pagination
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 6;
  const totalItems = results.length;
  const totalPages = Math.ceil(totalItems / limit);
  const startIndex = (page - 1) * limit;
  const paginatedItems = results.slice(startIndex, startIndex + limit);

  res.json({
    products: paginatedItems,
    pagination: {
      currentPage: page,
      limit,
      totalItems,
      totalPages,
    }
  });
});

app.get('/api/categories', (req: Request, res: Response) => {
  const db = getDb();
  res.json(db.categories);
});

// Create product (requires 'manage_products' permission)
app.post('/api/products', requireAdminOrManager, checkPermission('manage_products'), (req: Request, res: Response) => {
  const { 
    nameEn, nameAr, descriptionEn, descriptionAr, price, categoryId, stock, imageUrl, enabled, 
    discountPercent, discountAmount, specificationsEn, specificationsAr, datasheetUrl, videoUrl, images, coverImageIndex 
  } = req.body;
  if (!nameEn || !nameAr || !price || !categoryId || isNaN(parseFloat(price))) {
    return res.status(400).json({ message: 'Required fields are missing or invalid.' });
  }

  let parsedStock: number | null = null;
  if (stock !== undefined && stock !== null && stock !== '') {
    const s = parseInt(stock);
    if (isNaN(s)) {
      return res.status(400).json({ message: 'Stock must be a valid number or empty.' });
    }
    parsedStock = s;
  }

  const db = getDb();
  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    nameEn,
    nameAr,
    descriptionEn: descriptionEn || '',
    descriptionAr: descriptionAr || '',
    price: parseFloat(price),
    categoryId,
    stock: parsedStock,
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop&q=60',
    salesCount: 0,
    enabled: enabled !== false, // Defaults to true
    discountPercent: discountPercent !== undefined ? parseFloat(discountPercent) || 0 : 0,
    discountAmount: discountAmount !== undefined ? parseFloat(discountAmount) || 0 : 0,
    specificationsEn: specificationsEn || '',
    specificationsAr: specificationsAr || '',
    datasheetUrl: datasheetUrl || '',
    videoUrl: videoUrl || '',
    images: Array.isArray(images) ? images : [],
    coverImageIndex: coverImageIndex !== undefined ? Number(coverImageIndex) : 0,
    rating: 5,
    reviewsCount: 0,
    reviews: []
  };

  db.products.push(newProduct);
  saveDb(db);
  res.status(201).json(newProduct);
});

// Edit product (requires 'manage_products' permission)
app.put('/api/products/:id', requireAdminOrManager, checkPermission('manage_products'), (req: Request, res: Response) => {
  const { id } = req.params;
  const { 
    nameEn, nameAr, descriptionEn, descriptionAr, price, categoryId, stock, imageUrl, topSelling, enabled, 
    discountPercent, discountAmount, specificationsEn, specificationsAr, datasheetUrl, videoUrl, images, coverImageIndex 
  } = req.body;

  const db = getDb();
  const prodIndex = db.products.findIndex(p => p.id === id);
  if (prodIndex === -1) {
    return res.status(404).json({ message: 'Product not found.' });
  }

  const existing = db.products[prodIndex];
  let parsedStock: number | null = existing.stock !== undefined ? existing.stock : null;
  if (stock !== undefined) {
    if (stock === null || stock === '') {
      parsedStock = null;
    } else {
      const s = parseInt(stock);
      parsedStock = isNaN(s) ? null : s;
    }
  }

  db.products[prodIndex] = {
    ...existing,
    nameEn: nameEn || existing.nameEn,
    nameAr: nameAr || existing.nameAr,
    descriptionEn: descriptionEn !== undefined ? descriptionEn : existing.descriptionEn,
    descriptionAr: descriptionAr !== undefined ? descriptionAr : existing.descriptionAr,
    price: price !== undefined ? parseFloat(price) : existing.price,
    categoryId: categoryId || existing.categoryId,
    stock: parsedStock,
    imageUrl: imageUrl || existing.imageUrl,
    topSelling: topSelling !== undefined ? topSelling : existing.topSelling,
    enabled: enabled !== undefined ? enabled === true : existing.enabled,
    discountPercent: discountPercent !== undefined ? (parseFloat(discountPercent) || 0) : existing.discountPercent,
    discountAmount: discountAmount !== undefined ? (parseFloat(discountAmount) || 0) : existing.discountAmount,
    specificationsEn: specificationsEn !== undefined ? specificationsEn : existing.specificationsEn,
    specificationsAr: specificationsAr !== undefined ? specificationsAr : existing.specificationsAr,
    datasheetUrl: datasheetUrl !== undefined ? datasheetUrl : existing.datasheetUrl,
    videoUrl: videoUrl !== undefined ? videoUrl : existing.videoUrl,
    images: Array.isArray(images) ? images : (existing.images || []),
    coverImageIndex: coverImageIndex !== undefined ? Number(coverImageIndex) : (existing.coverImageIndex || 0),
  };

  saveDb(db);
  res.json(db.products[prodIndex]);
});

// Delete product (requires 'manage_products')
app.delete('/api/products/:id', requireAdminOrManager, checkPermission('manage_products'), (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDb();
  const filtered = db.products.filter(p => p.id !== id);
  if (filtered.length === db.products.length) {
    return res.status(404).json({ message: 'Product not found.' });
  }
  db.products = filtered;
  saveDb(db);
  res.json({ success: true, message: 'Product deleted.' });
});

// Add product review
app.post('/api/products/:id/reviews', authenticate, (req: Request, res: Response) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const user = (req as any).user as User;

  if (rating === undefined || isNaN(parseInt(rating)) || parseInt(rating) < 1 || parseInt(rating) > 5) {
    return res.status(400).json({ message: 'Valid rating between 1 and 5 is required.' });
  }

  const db = getDb();
  const product = db.products.find(p => p.id === id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found.' });
  }

  if (!product.reviews) {
    product.reviews = [];
  }

  const newReview = {
    id: `rev-${Date.now()}`,
    userName: user.name || user.email,
    rating: parseInt(rating),
    comment: comment || '',
    createdAt: new Date().toISOString()
  };

  product.reviews.push(newReview);
  
  // Recalculate average rating & count
  const totalReviews = product.reviews.length;
  const ratingSum = product.reviews.reduce((sum, r) => sum + r.rating, 0);
  product.rating = parseFloat((ratingSum / totalReviews).toFixed(1));
  product.reviewsCount = totalReviews;

  saveDb(db);
  res.status(201).json({ product, newReview });
});

// Category Management
app.post('/api/categories', requireAdminOrManager, checkPermission('manage_categories'), (req: Request, res: Response) => {
  const { nameEn, nameAr, slug } = req.body;
  if (!nameEn || !nameAr || !slug) {
    return res.status(400).json({ message: 'All category fields are required.' });
  }

  const db = getDb();
  const newCategory: Category = {
    id: `cat-${Date.now()}`,
    nameEn,
    nameAr,
    slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
  };

  db.categories.push(newCategory);
  saveDb(db);
  res.status(201).json(newCategory);
});

app.put('/api/categories/:id', requireAdminOrManager, checkPermission('manage_categories'), (req: Request, res: Response) => {
  const { id } = req.params;
  const { nameEn, nameAr, slug } = req.body;

  const db = getDb();
  const catIndex = db.categories.findIndex(c => c.id === id);
  if (catIndex === -1) {
    return res.status(404).json({ message: 'Category not found.' });
  }

  db.categories[catIndex] = {
    ...db.categories[catIndex],
    nameEn: nameEn || db.categories[catIndex].nameEn,
    nameAr: nameAr || db.categories[catIndex].nameAr,
    slug: slug ? slug.toLowerCase().replace(/[^a-z0-9-]/g, '-') : db.categories[catIndex].slug,
  };

  saveDb(db);
  res.json(db.categories[catIndex]);
});

app.delete('/api/categories/:id', requireAdminOrManager, checkPermission('manage_categories'), (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDb();
  const filtered = db.categories.filter(c => c.id !== id);
  if (filtered.length === db.categories.length) {
    return res.status(404).json({ message: 'Category not found.' });
  }
  db.categories = filtered;
  saveDb(db);
  res.json({ success: true, message: 'Category deleted.' });
});

// ----------------------------------------------------
// ORDERS ENDPOINTS
// ----------------------------------------------------

// List orders (Admins see all; Customers see only their own)
app.get('/api/orders', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const db = getDb();
  let results = [...db.orders];

  if (user.role === 'customer') {
    results = results.filter(o => o.userId === user.id);
  }

  // Filters (Admin & Manager filters)
  const status = req.query.status as string;
  const search = req.query.search as string; // Searches by customer name, email or order ID

  if (status) {
    results = results.filter(o => o.status === status);
  }

  if (search) {
    const q = search.toLowerCase();
    results = results.filter(o =>
      o.id.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerEmail.toLowerCase().includes(q)
    );
  }

  // Sort orders by newest first
  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Pagination
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 5;
  const totalItems = results.length;
  const totalPages = Math.ceil(totalItems / limit);
  const startIndex = (page - 1) * limit;
  const paginatedOrders = results.slice(startIndex, startIndex + limit);

  res.json({
    orders: paginatedOrders,
    pagination: {
      currentPage: page,
      limit,
      totalItems,
      totalPages,
    }
  });
});

// Create Order & Process Payment
app.post('/api/orders/checkout', authenticate, async (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { items, paymentMethod, shippingAddress, stripePaymentToken } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0 || !paymentMethod || !shippingAddress) {
    return res.status(400).json({ message: 'Missing order items, payment method, or shipping address.' });
  }

  const db = getDb();
  const settings = db.settings as SystemSettings;

  // Check if selected option is allowed
  const normalizedMethod = paymentMethod === 'cod' ? 'cod' : 'card';
  if (!settings.paymentOptions.includes(normalizedMethod)) {
    return res.status(400).json({ message: `Payment method ${paymentMethod} is not enabled on this store.` });
  }

  // Helper to determine if promotion is active
  const isPromoActive = (): boolean => {
    if (!settings || !settings.promoTimerEnabled) return false;
    if (!settings.promoTimerFrom || !settings.promoTimerTo) return true;
    const now = new Date();
    const from = new Date(settings.promoTimerFrom);
    const to = new Date(settings.promoTimerTo);
    return now >= from && now <= to;
  };

  const getProductPromoPrice = (product: Product): number => {
    if (!isPromoActive()) return product.price;
    let final = product.price;
    if (product.discountPercent !== undefined && product.discountPercent > 0) {
      final = product.price * (1 - product.discountPercent / 100);
    } else if (product.discountAmount !== undefined && product.discountAmount > 0) {
      final = Math.max(0, product.price - product.discountAmount);
    }
    return final;
  };

  let total = 0;
  const orderItems = [];

  // Match and deduct items in DB
  for (const item of items) {
    const prod = db.products.find(p => p.id === item.productId);
    if (!prod) {
      return res.status(404).json({ message: `Product ${item.productId} not found.` });
    }
    if (prod.enabled === false) {
      return res.status(400).json({ message: `Product ${prod.nameEn} is currently disabled.` });
    }

    // Optional stock: undefined/null/empty string => unlimited
    const isStockLimited = prod.stock !== undefined && prod.stock !== null && (prod.stock as any) !== '';
    if (isStockLimited) {
      const stockNum = Number(prod.stock);
      if (isNaN(stockNum) || stockNum < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for product ${prod.nameEn}.` });
      }
      prod.stock = stockNum - item.quantity;
    }

    prod.salesCount = (prod.salesCount || 0) + item.quantity;
    const finalPrice = getProductPromoPrice(prod);
    total += finalPrice * item.quantity;

    orderItems.push({
      productId: prod.id,
      productNameEn: prod.nameEn,
      productNameAr: prod.nameAr,
      price: finalPrice,
      quantity: item.quantity,
    });
  }

  const subtotal = total;
  let shippingFee = 0;
  let shippingDiscount = 0;
  let codCharge = 0;

  const cities = db.shippingCities || [];
  const cityObj = cities.find(c => 
    c.nameEn.toLowerCase() === shippingAddress.city.toLowerCase() || 
    c.nameAr.toLowerCase() === shippingAddress.city.toLowerCase() ||
    c.id === shippingAddress.city
  );

  if (cityObj) {
    if (subtotal < cityObj.minOrderAmount) {
      return res.status(400).json({ 
        message: `Minimum order amount for shipping to ${cityObj.nameEn} is ${cityObj.minOrderAmount} EGP. Your items total is ${subtotal.toFixed(2)} EGP.` 
      });
    }

    shippingFee = cityObj.defaultShippingFee;
    if (subtotal >= cityObj.minOrderForDiscount) {
      shippingDiscount = cityObj.discountAmount;
    }
  }

  if (normalizedMethod === 'cod' && settings.codExtraChargeEnabled) {
    codCharge = settings.codExtraChargeAmount || 0;
  }

  const netShippingFee = Math.max(0, shippingFee - shippingDiscount);
  total = subtotal + netShippingFee + codCharge;

  const orderId = `ord-${Date.now().toString().slice(-6)}`;
  const paymentDetails: any = {
    last4: '',
    brand: '',
  };

  let status: OrderStatus = 'pending';
  let paymentGateway: 'stripe' | 'kasheir' | undefined = undefined;
  let gatewayMode: 'test' | 'live' | undefined = undefined;
  let transactionNumber: string | undefined = undefined;
  let last4: string | undefined = undefined;
  let transactionStatus: 'Success' | 'Failed' | undefined = undefined;

  if (normalizedMethod === 'card') {
    status = 'paid';
    paymentGateway = settings.paymentGateway;
    gatewayMode = settings.gatewayMode;
    transactionStatus = 'Success';

    if (settings.paymentGateway === 'stripe') {
      const activeStripeKey = settings.gatewayMode === 'live' ? settings.stripeLiveSecretKey : settings.stripeTestSecretKey;
      let localStripeInstance = stripe;

      if (activeStripeKey && activeStripeKey !== 'sk_test_placeholder' && activeStripeKey.trim() !== '') {
        try {
          localStripeInstance = new Stripe(activeStripeKey, {
            apiVersion: '2025-01-15.acacia' as any,
          });
        } catch (err) {
          console.error('Error instantiating stripe key from settings:', err);
        }
      }

      if (localStripeInstance) {
        try {
          const charge = await localStripeInstance.charges.create({
            amount: Math.round(total * 100),
            currency: (settings.currency || 'usd').toLowerCase(),
            source: stripePaymentToken || 'tok_visa',
            description: `eMart Order ${orderId} (${settings.gatewayMode} mode)`,
          });
          paymentDetails.paymentIntentId = charge.id;
          paymentDetails.last4 = charge.payment_method_details?.card?.last4 || '4242';
          paymentDetails.brand = charge.payment_method_details?.card?.brand || 'visa';

          transactionNumber = charge.id;
          last4 = charge.payment_method_details?.card?.last4 || '4242';
        } catch (err: any) {
          console.error('Stripe charge error:', err);
          return res.status(400).json({ message: `Payment gateway error: ${err.message}` });
        }
      } else {
        // Sandbox mode
        paymentDetails.paymentIntentId = `pi_sandbox_${Date.now()}`;
        paymentDetails.last4 = '4242';
        paymentDetails.brand = 'visa';

        transactionNumber = paymentDetails.paymentIntentId;
        last4 = '4242';
      }
    } else {
      // Kasheir
      paymentDetails.paymentIntentId = `pi_kasheir_${Date.now()}`;
      paymentDetails.last4 = '9921';
      paymentDetails.brand = 'meeza';

      transactionNumber = paymentDetails.paymentIntentId;
      last4 = '9921';
    }
  }

  const initialHistory: StatusHistoryItem[] = [
    { status: 'pending', updatedAt: new Date().toISOString(), updatedBy: 'System' },
  ];
  if (normalizedMethod === 'card') {
    initialHistory.push({ status: 'paid', updatedAt: new Date().toISOString(), updatedBy: 'System' });
  }

  const newOrder: Order = {
    id: orderId,
    userId: user.id,
    customerName: user.name,
    customerEmail: user.email,
    items: orderItems,
    totalAmount: parseFloat(total.toFixed(2)),
    status,
    paymentMethod: normalizedMethod,
    paymentGateway,
    gatewayMode,
    transactionNumber,
    last4,
    transactionStatus,
    paymentDetails,
    statusHistory: initialHistory,
    createdAt: new Date().toISOString(),
    shippingAddress,
    shippingFee,
    shippingDiscount,
    codCharge
  };

  db.orders.push(newOrder);

  // Add payment transaction log
  const newTx: Transaction = {
    id: `tx-pay-${orderId}`,
    orderId,
    clientName: user.name,
    clientMobile: shippingAddress.phone || '',
    amount: parseFloat(total.toFixed(2)),
    paymentMethod: normalizedMethod,
    paymentGateway,
    gatewayMode,
    transactionNumber,
    last4,
    status: normalizedMethod === 'card' ? 'Success' : 'Pending',
    type: 'payment',
    createdAt: new Date().toISOString(),
  };

  if (!db.transactions) {
    db.transactions = [];
  }
  db.transactions.push(newTx);

  saveDb(db);
  res.status(201).json(newOrder);
});

// Update Order Status (requires 'manage_orders' permission)
// Automatically tracks history and time change for each status
app.patch('/api/orders/:id/status', requireAdminOrManager, checkPermission('manage_orders'), (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const user = (req as any).user as User;

  if (!status) {
    return res.status(400).json({ message: 'Status is required.' });
  }

  const db = getDb();
  const order = db.orders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ message: 'Order not found.' });
  }

  // Update status and append tracking history
  order.status = status as OrderStatus;
  order.statusHistory.push({
    status: status as OrderStatus,
    updatedAt: new Date().toISOString(),
    updatedBy: user.email,
  });

  saveDb(db);
  res.json(order);
});

// Refund Payment (requires 'manage_refunds' permission)
app.post('/api/orders/:id/refund', requireAdminOrManager, checkPermission('manage_refunds'), async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user as User;

  const db = getDb();
  const order = db.orders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ message: 'Order not found.' });
  }

  if (order.status === 'refunded') {
    return res.status(400).json({ message: 'Order is already refunded.' });
  }

  const piId = order.paymentDetails?.paymentIntentId;

  // Real stripe refund if configured and was paid via stripe
  if (order.paymentMethod === 'stripe' && stripe && piId && piId.startsWith('ch_')) {
    try {
      const refund = await stripe.refunds.create({
        charge: piId,
      });
      order.paymentDetails = {
        ...order.paymentDetails,
        refundId: refund.id,
        refundedAmount: order.totalAmount,
      };
    } catch (err: any) {
      console.error('Stripe refund failed:', err);
      return res.status(400).json({ message: `Refund processing failed: ${err.message}` });
    }
  } else {
    // Sandbox simulation refund
    order.paymentDetails = {
      ...order.paymentDetails,
      refundId: `ref_sandbox_${Date.now()}`,
      refundedAmount: order.totalAmount,
    };
  }

  // Update order status
  order.status = 'refunded';
  order.statusHistory.push({
    status: 'refunded',
    updatedAt: new Date().toISOString(),
    updatedBy: user.email,
  });

  // Put product stock back
  for (const item of order.items) {
    const prod = db.products.find(p => p.id === item.productId);
    if (prod) {
      prod.stock += item.quantity;
      prod.salesCount = Math.max(0, (prod.salesCount || 0) - item.quantity);
    }
  }

  saveDb(db);
  res.json(order);
});

// ----------------------------------------------------
// ADMINISTRATIVE STATS / DASHBOARD
// ----------------------------------------------------

app.get('/api/admin/stats', requireAdminOrManager, (req: Request, res: Response) => {
  const db = getDb();
  
  // High-level KPI calculation
  let totalRevenue = 0;
  let totalOrdersCount = 0;
  
  db.orders.forEach(o => {
    if (o.status !== 'cancelled' && o.status !== 'refunded') {
      totalRevenue += o.totalAmount;
      totalOrdersCount++;
    }
  });

  // Revenue chart calculations over months (Grouped by Year-Month)
  const monthlyMap: Record<string, { revenue: number; orders: number }> = {};
  
  // Fill in default placeholders for the past 5 months to ensure beautiful empty states
  const monthsList = ['Feb', 'Mar', 'Apr', 'May', 'Jun'];
  monthsList.forEach(m => {
    monthlyMap[m] = { revenue: 0, orders: 0 };
  });

  db.orders.forEach(o => {
    if (o.status !== 'cancelled' && o.status !== 'refunded') {
      const date = new Date(o.createdAt);
      const monthName = date.toLocaleString('default', { month: 'short' });
      if (monthlyMap[monthName] !== undefined) {
        monthlyMap[monthName].revenue += o.totalAmount;
        monthlyMap[monthName].orders += 1;
      } else {
        monthlyMap[monthName] = { revenue: o.totalAmount, orders: 1 };
      }
    }
  });

  const monthlyRevenue = Object.entries(monthlyMap).map(([month, data]) => ({
    month,
    revenue: parseFloat(data.revenue.toFixed(2)),
    orders: data.orders,
  }));

  // Top selling products
  const topProducts = db.products
    .map(p => ({
      id: p.id,
      nameEn: p.nameEn,
      nameAr: p.nameAr,
      sales: p.salesCount || 0,
      revenue: parseFloat(((p.salesCount || 0) * p.price).toFixed(2)),
    }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  res.json({
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    totalOrders: totalOrdersCount,
    totalProductsCount: db.products.length,
    totalUsersCount: db.users.filter(u => u.role === 'customer').length,
    monthlyRevenue,
    topProducts,
  });
});

// ----------------------------------------------------
// USERS MANAGEMENT ENDPOINTS
// ----------------------------------------------------

// List all administrative and checkout site users with paging
app.get('/api/admin/users', requireAdminOrManager, (req: Request, res: Response) => {
  const db = getDb();
  let results = [...db.users];

  const role = req.query.role as string; // 'admin', 'manager', 'customer'
  const search = req.query.search as string;

  if (role) {
    results = results.filter(u => u.role === role);
  }

  if (search) {
    const q = search.toLowerCase();
    results = results.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  }

  // Pagination
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 8;
  const totalItems = results.length;
  const totalPages = Math.ceil(totalItems / limit);
  const startIndex = (page - 1) * limit;
  const paginatedUsers = results.slice(startIndex, startIndex + limit);
  const usersWithPasswords = paginatedUsers.map(u => ({
    ...u,
    password: db.passwords[u.id!] || ''
  }));

  res.json({
    users: usersWithPasswords,
    pagination: {
      currentPage: page,
      limit,
      totalItems,
      totalPages,
    }
  });
});

// Create/Update Admin users and permissions (Admins only)
app.post('/api/admin/users', requireAdminOrManager, checkPermission('manage_admins'), (req: Request, res: Response) => {
  const { name, email, password, role, permissions } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Name, email, password, and role are required.' });
  }

  const db = getDb();
  const exists = db.users.some(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ message: 'Email already exists.' });
  }

  const newUser: User = {
    id: `u-${Date.now()}`,
    name,
    email,
    role: role as any,
    permissions: role === 'admin' ? ['manage_products', 'manage_categories', 'manage_orders', 'manage_admins', 'manage_refunds'] : permissions || [],
    createdAt: new Date().toISOString(),
    disabled: req.body.disabled || false,
    priceMultiplier: req.body.priceMultiplier !== undefined ? Number(req.body.priceMultiplier) : 1.0,
    canSeeAllOrders: req.body.canSeeAllOrders || false,
    canEditOrders: req.body.canEditOrders || false,
    canEditOwnOrders: req.body.canEditOwnOrders || false,
    canEditAllOrders: req.body.canEditAllOrders || false,
    canEditOwnStatus: req.body.canEditOwnStatus || false,
    canEditAllStatus: req.body.canEditAllStatus || false,
    canDeleteOrders: req.body.canDeleteOrders || false,
    canDeleteOwnOrders: req.body.canDeleteOwnOrders || false,
    canDeleteAllOrders: req.body.canDeleteAllOrders || false,
    canSeeReviewsPage: req.body.canSeeReviewsPage || false,
    canViewFullDashboard: req.body.canViewFullDashboard || false,
    canViewPaymentTerms: req.body.canViewPaymentTerms || false,
    canAddPaymentTerms: req.body.canAddPaymentTerms || false,
    canEditPaymentTerms: req.body.canEditPaymentTerms || false,
    canDeletePaymentTerms: req.body.canDeletePaymentTerms || false,
    canViewBackups: req.body.canViewBackups || false,
    canManageBackups: req.body.canManageBackups || false,
  };

  db.users.push(newUser);
  db.passwords[newUser.id!] = password;
  saveDb(db);

  // Log activity
  logActivity(req, 'Create User', `Created user ${newUser.name} with role ${newUser.role}`);

  res.status(201).json(newUser);
});

// Edit user permissions & roles (Admins only)
app.put('/api/admin/users/:id', requireAdminOrManager, checkPermission('manage_admins'), (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, role, permissions, password } = req.body;

  const db = getDb();
  const userIndex = db.users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found.' });
  }

  // Prevent modifying the super-admin u-1 from role changes to avoid locking out
  if (id === 'u-1' && role !== 'admin') {
    return res.status(400).json({ message: 'Super Admin cannot change their role.' });
  }

  const existing = db.users[userIndex];
  db.users[userIndex] = {
    ...existing,
    name: name || existing.name,
    email: email || existing.email,
    role: role || existing.role,
    disabled: req.body.disabled !== undefined ? req.body.disabled : existing.disabled,
    priceMultiplier: req.body.priceMultiplier !== undefined ? Number(req.body.priceMultiplier) : existing.priceMultiplier,
    permissions: role === 'admin' 
      ? ['manage_products', 'manage_categories', 'manage_orders', 'manage_admins', 'manage_refunds'] 
      : (permissions !== undefined ? permissions : existing.permissions),
    canSeeAllOrders: req.body.canSeeAllOrders !== undefined ? req.body.canSeeAllOrders : existing.canSeeAllOrders,
    canEditOrders: req.body.canEditOrders !== undefined ? req.body.canEditOrders : existing.canEditOrders,
    canEditOwnOrders: req.body.canEditOwnOrders !== undefined ? req.body.canEditOwnOrders : existing.canEditOwnOrders,
    canEditAllOrders: req.body.canEditAllOrders !== undefined ? req.body.canEditAllOrders : existing.canEditAllOrders,
    canEditOwnStatus: req.body.canEditOwnStatus !== undefined ? req.body.canEditOwnStatus : existing.canEditOwnStatus,
    canEditAllStatus: req.body.canEditAllStatus !== undefined ? req.body.canEditAllStatus : existing.canEditAllStatus,
    canDeleteOrders: req.body.canDeleteOrders !== undefined ? req.body.canDeleteOrders : existing.canDeleteOrders,
    canDeleteOwnOrders: req.body.canDeleteOwnOrders !== undefined ? req.body.canDeleteOwnOrders : existing.canDeleteOwnOrders,
    canDeleteAllOrders: req.body.canDeleteAllOrders !== undefined ? req.body.canDeleteAllOrders : existing.canDeleteAllOrders,
    canSeeReviewsPage: req.body.canSeeReviewsPage !== undefined ? req.body.canSeeReviewsPage : existing.canSeeReviewsPage,
    canViewFullDashboard: req.body.canViewFullDashboard !== undefined ? req.body.canViewFullDashboard : existing.canViewFullDashboard,
    canViewPaymentTerms: req.body.canViewPaymentTerms !== undefined ? req.body.canViewPaymentTerms : existing.canViewPaymentTerms,
    canAddPaymentTerms: req.body.canAddPaymentTerms !== undefined ? req.body.canAddPaymentTerms : existing.canAddPaymentTerms,
    canEditPaymentTerms: req.body.canEditPaymentTerms !== undefined ? req.body.canEditPaymentTerms : existing.canEditPaymentTerms,
    canDeletePaymentTerms: req.body.canDeletePaymentTerms !== undefined ? req.body.canDeletePaymentTerms : existing.canDeletePaymentTerms,
    canViewBackups: req.body.canViewBackups !== undefined ? req.body.canViewBackups : existing.canViewBackups,
    canManageBackups: req.body.canManageBackups !== undefined ? req.body.canManageBackups : existing.canManageBackups,
  };

  if (password) {
    db.passwords[id] = password;
  }

  saveDb(db);

  // Log activity
  logActivity(req, 'Update User', `Updated user ${db.users[userIndex].name} permissions and settings.`);

  res.json(db.users[userIndex]);
});

// GET /api/settings - Public settings
app.get('/api/settings', (req: Request, res: Response) => {
  const db = getDb();
  const settings = db.settings as SystemSettings;

  const authHeader = req.headers.authorization;
  let isAdmin = false;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const user = db.users.find(u => u.id === token);
    if (user && (user.role === 'admin' || user.role === 'manager')) {
      isAdmin = true;
    }
  }

  if (isAdmin) {
    res.json(settings);
  } else {
    // Stripped secret keys for clients
    const publicSettings = {
      paymentOptions: settings.paymentOptions,
      paymentGateway: settings.paymentGateway,
      gatewayMode: settings.gatewayMode,
      currency: settings.currency || 'USD',
      promoTimerEnabled: settings.promoTimerEnabled,
      promoTimerFrom: settings.promoTimerFrom,
      promoTimerTo: settings.promoTimerTo,
      promoTimerTextEn: settings.promoTimerTextEn,
      promoTimerTextAr: settings.promoTimerTextAr,
    };
    res.json(publicSettings);
  }
});

// PUT /api/settings - Update settings (Admins only)
app.put('/api/settings', requireAdminOrManager, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  if (user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admin role required to update settings.' });
  }

  const db = getDb();
  db.settings = {
    ...db.settings,
    ...req.body,
  };
  saveDb(db);
  res.json(db.settings);
});

// GET /api/shipping-cities - Publicly retrieved and sorted alphabetically
app.get('/api/shipping-cities', (req: Request, res: Response) => {
  const db = getDb();
  const cities = db.shippingCities || [];
  // Sort alphabetically by English name
  const sorted = [...cities].sort((a, b) => a.nameEn.localeCompare(b.nameEn));
  res.json(sorted);
});

// POST /api/shipping-cities - Create a city (Admins only)
app.post('/api/shipping-cities', requireAdminOrManager, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  if (user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admin role required.' });
  }
  const { nameEn, nameAr, defaultShippingFee, minOrderAmount, discountAmount, minOrderForDiscount } = req.body;
  if (!nameEn || !nameAr) {
    return res.status(400).json({ message: 'City name in English and Arabic are required.' });
  }

  const db = getDb();
  if (!db.shippingCities) db.shippingCities = [];
  const newCity: ShippingCity = {
    id: `city-${Date.now()}`,
    nameEn,
    nameAr,
    defaultShippingFee: Number(defaultShippingFee || 0),
    minOrderAmount: Number(minOrderAmount || 0),
    discountAmount: Number(discountAmount || 0),
    minOrderForDiscount: Number(minOrderForDiscount || 0),
  };

  db.shippingCities.push(newCity);
  saveDb(db);
  logActivity(req, 'Create Shipping City', `Created shipping city ${nameEn} / ${nameAr}`);
  res.status(201).json(newCity);
});

// PUT /api/shipping-cities/:id - Update a city (Admins only)
app.put('/api/shipping-cities/:id', requireAdminOrManager, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  if (user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admin role required.' });
  }
  const { id } = req.params;
  const { nameEn, nameAr, defaultShippingFee, minOrderAmount, discountAmount, minOrderForDiscount } = req.body;

  const db = getDb();
  if (!db.shippingCities) db.shippingCities = [];
  const index = db.shippingCities.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'City not found.' });
  }

  db.shippingCities[index] = {
    ...db.shippingCities[index],
    nameEn: nameEn || db.shippingCities[index].nameEn,
    nameAr: nameAr || db.shippingCities[index].nameAr,
    defaultShippingFee: defaultShippingFee !== undefined ? Number(defaultShippingFee) : db.shippingCities[index].defaultShippingFee,
    minOrderAmount: minOrderAmount !== undefined ? Number(minOrderAmount) : db.shippingCities[index].minOrderAmount,
    discountAmount: discountAmount !== undefined ? Number(discountAmount) : db.shippingCities[index].discountAmount,
    minOrderForDiscount: minOrderForDiscount !== undefined ? Number(minOrderForDiscount) : db.shippingCities[index].minOrderForDiscount,
  };

  saveDb(db);
  logActivity(req, 'Update Shipping City', `Updated shipping city ${db.shippingCities[index].nameEn}`);
  res.json(db.shippingCities[index]);
});

// DELETE /api/shipping-cities/:id - Delete a city (Admins only)
app.delete('/api/shipping-cities/:id', requireAdminOrManager, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  if (user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admin role required.' });
  }
  const { id } = req.params;

  const db = getDb();
  if (!db.shippingCities) db.shippingCities = [];
  const index = db.shippingCities.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'City not found.' });
  }

  const deleted = db.shippingCities[index];
  db.shippingCities.splice(index, 1);
  saveDb(db);
  logActivity(req, 'Delete Shipping City', `Deleted shipping city ${deleted.nameEn}`);
  res.json({ message: 'City deleted successfully.' });
});

// GET /api/admin/payments - List payments & transactions (Admins only)
app.get('/api/admin/payments', requireAdminOrManager, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  if (user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admin role required.' });
  }

  const db = getDb();
  if (!db.transactions) {
    db.transactions = [];
  }
  let results = [...db.transactions];

  const { 
    startDate, endDate, paymentOption, paymentGateway, transactionNumber,
    mode, status, orderStatus, clientName, clientMobile, priceFrom, priceTo 
  } = req.query;

  if (startDate) {
    const [d, m, y] = (startDate as string).split('/');
    const date = new Date(+y, +m - 1, +d, 0, 0, 0);
    results = results.filter(tx => new Date(tx.createdAt) >= date);
  }
  if (endDate) {
    const [d, m, y] = (endDate as string).split('/');
    const date = new Date(+y, +m - 1, +d, 23, 59, 59);
    results = results.filter(tx => new Date(tx.createdAt) <= date);
  }
  if (paymentOption) {
    results = results.filter(tx => tx.paymentMethod === paymentOption);
  }
  if (paymentGateway) {
    results = results.filter(tx => tx.paymentGateway === paymentGateway);
  }
  if (transactionNumber) {
    const q = (transactionNumber as string).toLowerCase();
    results = results.filter(tx => 
      (tx.transactionNumber || '').toLowerCase().includes(q) ||
      tx.orderId.toLowerCase().includes(q) ||
      tx.id.toLowerCase().includes(q)
    );
  }
  if (mode) {
    results = results.filter(tx => tx.gatewayMode === mode);
  }
  if (status) {
    results = results.filter(tx => tx.status.toLowerCase() === (status as string).toLowerCase());
  }
  if (orderStatus) {
    results = results.filter(tx => {
      const ord = db.orders.find(o => o.id === tx.orderId);
      return ord && ord.status.toLowerCase() === (orderStatus as string).toLowerCase();
    });
  }
  if (clientName) {
    const q = (clientName as string).toLowerCase();
    results = results.filter(tx => tx.clientName.toLowerCase().includes(q));
  }
  if (clientMobile) {
    const q = (clientMobile as string).toLowerCase();
    results = results.filter(tx => tx.clientMobile.includes(q));
  }
  if (priceFrom) {
    results = results.filter(tx => tx.amount >= parseFloat(priceFrom as string));
  }
  if (priceTo) {
    results = results.filter(tx => tx.amount <= parseFloat(priceTo as string));
  }

  // Sorting: newest transactions first
  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Pagination
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 8;
  const totalItems = results.length;
  const totalPages = Math.ceil(totalItems / limit);
  const startIndex = (page - 1) * limit;
  const paginatedTx = results.slice(startIndex, startIndex + limit);

  res.json({
    transactions: paginatedTx,
    pagination: {
      currentPage: page,
      limit,
      totalItems,
      totalPages,
    }
  });
});

// POST /api/admin/payments/:txId/refund - Refund (Admins only)
app.post('/api/admin/payments/:txId/refund', requireAdminOrManager, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  if (user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admin role required.' });
  }

  const { txId } = req.params;
  const db = getDb();
  
  if (!db.transactions) {
    db.transactions = [];
  }
  const tx = db.transactions.find(t => t.id === txId);
  if (!tx) {
    return res.status(404).json({ message: 'Transaction not found.' });
  }

  if (tx.status === 'Refund') {
    return res.status(400).json({ message: 'This transaction is already refunded.' });
  }

  if (tx.paymentMethod !== 'card') {
    return res.status(400).json({ message: 'Only bank card transactions can be refunded.' });
  }

  const order = db.orders.find(o => o.id === tx.orderId);
  if (!order) {
    return res.status(404).json({ message: 'Linked order not found.' });
  }

  // Mark old transaction as refunded
  tx.status = 'Refund';

  // Create another transaction for refund and link with order
  const refundTx: Transaction = {
    id: `tx-ref-${Date.now()}`,
    orderId: order.id,
    clientName: tx.clientName,
    clientMobile: tx.clientMobile,
    amount: tx.amount,
    paymentMethod: 'card',
    paymentGateway: tx.paymentGateway,
    gatewayMode: tx.gatewayMode,
    transactionNumber: `ref_mock_${Date.now()}`,
    last4: tx.last4,
    status: 'Refund',
    type: 'refund',
    createdAt: new Date().toISOString(),
  };
  db.transactions.push(refundTx);

  // Update order status
  order.status = 'refunded';
  order.statusHistory.push({
    status: 'refunded',
    updatedAt: new Date().toISOString(),
    updatedBy: user.email,
  });

  if (order.paymentDetails) {
    order.paymentDetails.refundId = refundTx.transactionNumber;
    order.paymentDetails.refundedAmount = tx.amount;
  } else {
    order.paymentDetails = {
      refundId: refundTx.transactionNumber,
      refundedAmount: tx.amount,
      last4: tx.last4,
    };
  }

  saveDb(db);
  res.json({ message: 'Refund processed successfully.', transaction: tx });
});

// Image Upload Endpoint
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

app.post('/api/upload', (req: Request, res: Response) => {
  const { file, name } = req.body;
  if (!file) {
    return res.status(400).json({ message: 'No file data received.' });
  }

  try {
    const matches = file.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      // If it doesn't match base64 format, it might be already a URL
      return res.json({ url: file });
    }

    const type = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const ext = type.split('/')[1] || 'png';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, buffer);
    res.json({ url: `/uploads/${filename}` });
  } catch (err: any) {
    console.error('Upload failed, using raw base64:', err);
    res.json({ url: file });
  }
});

// View orders of a specific customer (view customer orders)
app.get('/api/admin/users/:id/orders', requireAdminOrManager, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDb();
  const user = db.users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const userOrders = db.orders.filter(o => o.userId === id);
  res.json({
    user,
    orders: userOrders
  });
});

// ----------------------------------------------------
// ACTIVITY LOGS & BACKUPS ENDPOINTS (Admins Only)
// ----------------------------------------------------

// List Activity Logs with Filters & paging
app.get('/api/admin/activity-logs', requireAdminOrManager, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  if (user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admin role required.' });
  }

  const db = getDb();
  let results = db.activityLogs ? [...db.activityLogs] : [];

  const search = req.query.search as string;
  const email = req.query.email as string;
  const action = req.query.action as string;

  if (search) {
    const q = search.toLowerCase();
    results = results.filter(log =>
      log.action.toLowerCase().includes(q) ||
      log.description.toLowerCase().includes(q) ||
      log.userName.toLowerCase().includes(q)
    );
  }

  if (email) {
    results = results.filter(log => log.userEmail.toLowerCase() === email.toLowerCase());
  }

  if (action) {
    results = results.filter(log => log.action.toLowerCase() === action.toLowerCase());
  }

  // Pagination
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const totalItems = results.length;
  const totalPages = Math.ceil(totalItems / limit);
  const startIndex = (page - 1) * limit;
  const paginatedLogs = results.slice(startIndex, startIndex + limit);

  res.json({
    logs: paginatedLogs,
    pagination: {
      currentPage: page,
      limit,
      totalItems,
      totalPages,
    }
  });
});

// List Backup files with Filters & paging
app.get('/api/admin/backups', requireAdminOrManager, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  if (user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admin role required.' });
  }

  const BACKUPS_DIR = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }

  // Scan files from filesystem
  let files: BackupFile[] = [];
  try {
    const filenames = fs.readdirSync(BACKUPS_DIR);
    const db = getDb();
    
    files = filenames
      .filter(f => f.endsWith('.json'))
      .map(filename => {
        const filePath = path.join(BACKUPS_DIR, filename);
        const stats = fs.statSync(filePath);
        // Match with metadata from DB to check if automatic
        const meta = db.backups?.find(b => b.filename === filename);
        return {
          filename,
          size: stats.size,
          createdAt: stats.mtime.toISOString(),
          isAutomatic: meta ? meta.isAutomatic : filename.startsWith('auto_'),
        };
      });
  } catch (err) {
    console.error('Error reading backups directory:', err);
  }

  // Sort by newest first
  files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Filter
  const search = req.query.search as string;
  if (search) {
    const q = search.toLowerCase();
    files = files.filter(f => f.filename.toLowerCase().includes(q));
  }

  // Pagination
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 5;
  const totalItems = files.length;
  const totalPages = Math.ceil(totalItems / limit);
  const startIndex = (page - 1) * limit;
  const paginatedFiles = files.slice(startIndex, startIndex + limit);

  res.json({
    backups: paginatedFiles,
    pagination: {
      currentPage: page,
      limit,
      totalItems,
      totalPages,
    }
  });
});

// Create Backup (Admins Only)
app.post('/api/admin/backups', requireAdminOrManager, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  if (user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admin role required.' });
  }

  const BACKUPS_DIR = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }

  const isAutomatic = req.body.isAutomatic || false;
  const prefix = isAutomatic ? 'auto' : 'manual';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup_${prefix}_${timestamp}.json`;
  const backupPath = path.join(BACKUPS_DIR, filename);

  const db = getDb();
  try {
    const dbContent = fs.readFileSync(path.join(process.cwd(), 'db.json'), 'utf-8');
    fs.writeFileSync(backupPath, dbContent, 'utf-8');

    const newBackup: BackupFile = {
      filename,
      size: fs.statSync(backupPath).size,
      createdAt: new Date().toISOString(),
      isAutomatic,
    };

    if (!db.backups) {
      db.backups = [];
    }
    db.backups.push(newBackup);
    saveDb(db);

    logActivity(req, 'Create Backup', `Backup file "${filename}" created successfully.`);

    res.status(201).json(newBackup);
  } catch (err: any) {
    console.error('Backup creation failed:', err);
    res.status(500).json({ message: `Backup failed: ${err.message}` });
  }
});

// Restore Backup (Admins Only)
app.post('/api/admin/backups/restore', requireAdminOrManager, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  if (user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admin role required.' });
  }

  const { filename } = req.body;
  if (!filename) {
    return res.status(400).json({ message: 'Filename is required for restore.' });
  }

  // Prevent path traversal
  const safeFilename = path.basename(filename);
  const BACKUPS_DIR = path.join(process.cwd(), 'backups');
  const backupPath = path.join(BACKUPS_DIR, safeFilename);

  if (!fs.existsSync(backupPath)) {
    return res.status(404).json({ message: 'Backup file not found.' });
  }

  try {
    const contentStr = fs.readFileSync(backupPath, 'utf-8');
    const parsed = JSON.parse(contentStr);

    // Validate if it has proper fields of DB
    if (!parsed.users || !parsed.products || !parsed.settings) {
      return res.status(400).json({ message: 'Invalid backup file structure. Missing key tables (users, products, settings).' });
    }

    // Write to active db.json
    fs.writeFileSync(path.join(process.cwd(), 'db.json'), contentStr, 'utf-8');

    logActivity(req, 'Restore Backup', `Database successfully restored from backup file "${safeFilename}".`);

    res.json({ success: true, message: 'Database restored successfully.' });
  } catch (err: any) {
    console.error('Backup restore failed:', err);
    res.status(500).json({ message: `Restore failed: ${err.message}` });
  }
});

// Download Backup file (Admins Only)
app.get('/api/admin/backups/download/:filename', requireAdminOrManager, (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  // Express/auth middleware check
  if (!authHeader) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }
  const token = authHeader.split(' ')[1];
  const db = getDb();
  const user = db.users.find(u => u.id === token);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admins only.' });
  }

  const { filename } = req.params;
  const safeFilename = path.basename(filename);
  const BACKUPS_DIR = path.join(process.cwd(), 'backups');
  const filePath = path.join(BACKUPS_DIR, safeFilename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Backup file not found.' });
  }

  res.download(filePath, safeFilename);
});

// Upload external Backup (Admins Only)
app.post('/api/admin/backups/upload', requireAdminOrManager, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  if (user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admin role required.' });
  }

  const { filename, content } = req.body;
  if (!filename || !content) {
    return res.status(400).json({ message: 'Filename and content are required.' });
  }

  try {
    const parsed = typeof content === 'string' ? JSON.parse(content) : content;
    if (!parsed.users || !parsed.products || !parsed.settings) {
      return res.status(400).json({ message: 'Invalid uploaded JSON backup. Missing key tables (users, products, settings).' });
    }

    const BACKUPS_DIR = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(BACKUPS_DIR)) {
      fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    }

    // Clean filename
    const safeFilename = 'uploaded_' + path.basename(filename).replace(/[^a-zA-Z0-9_.-]/g, '_');
    const backupPath = path.join(BACKUPS_DIR, safeFilename);

    fs.writeFileSync(backupPath, JSON.stringify(parsed, null, 2), 'utf-8');

    const db = getDb();
    const newBackup: BackupFile = {
      filename: safeFilename,
      size: fs.statSync(backupPath).size,
      createdAt: new Date().toISOString(),
      isAutomatic: false,
    };

    if (!db.backups) {
      db.backups = [];
    }
    db.backups.push(newBackup);
    saveDb(db);

    logActivity(req, 'Upload Backup', `External backup file "${safeFilename}" uploaded successfully.`);

    res.status(201).json(newBackup);
  } catch (err: any) {
    console.error('Upload backup failed:', err);
    res.status(400).json({ message: `Upload failed: ${err.message}` });
  }
});

// Delete Backup (Admins Only)
app.delete('/api/admin/backups/:filename', requireAdminOrManager, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  if (user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admin role required.' });
  }

  const { filename } = req.params;
  const safeFilename = path.basename(filename);
  const BACKUPS_DIR = path.join(process.cwd(), 'backups');
  const filePath = path.join(BACKUPS_DIR, safeFilename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Backup file not found.' });
  }

  try {
    fs.unlinkSync(filePath);
    const db = getDb();
    if (db.backups) {
      db.backups = db.backups.filter(b => b.filename !== safeFilename);
      saveDb(db);
    }

    logActivity(req, 'Delete Backup', `Backup file "${safeFilename}" deleted successfully.`);

    res.json({ success: true, message: 'Backup file deleted successfully.' });
  } catch (err: any) {
    console.error('Delete backup failed:', err);
    res.status(500).json({ message: `Delete failed: ${err.message}` });
  }
});

// ----------------------------------------------------
// START SERVER & VITE INTEGRATION
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware mounted in Development mode.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve SPA fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production build assets from /dist.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer();
