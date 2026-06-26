import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getDb, saveDb } from './server/db';
import { User, Product, Category, Order, OrderStatus, StatusHistoryItem } from './src/types';
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

  const userPassword = db.passwords[user.id];
  if (userPassword !== password) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

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
  const { nameEn, nameAr, descriptionEn, descriptionAr, price, categoryId, stock, imageUrl } = req.body;
  if (!nameEn || !nameAr || !price || !categoryId || isNaN(price) || isNaN(stock)) {
    return res.status(400).json({ message: 'Required fields are missing or invalid.' });
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
    stock: parseInt(stock) || 0,
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop&q=60',
    salesCount: 0,
  };

  db.products.push(newProduct);
  saveDb(db);
  res.status(201).json(newProduct);
});

// Edit product (requires 'manage_products' permission)
app.put('/api/products/:id', requireAdminOrManager, checkPermission('manage_products'), (req: Request, res: Response) => {
  const { id } = req.params;
  const { nameEn, nameAr, descriptionEn, descriptionAr, price, categoryId, stock, imageUrl, topSelling } = req.body;

  const db = getDb();
  const prodIndex = db.products.findIndex(p => p.id === id);
  if (prodIndex === -1) {
    return res.status(404).json({ message: 'Product not found.' });
  }

  const existing = db.products[prodIndex];
  db.products[prodIndex] = {
    ...existing,
    nameEn: nameEn || existing.nameEn,
    nameAr: nameAr || existing.nameAr,
    descriptionEn: descriptionEn !== undefined ? descriptionEn : existing.descriptionEn,
    descriptionAr: descriptionAr !== undefined ? descriptionAr : existing.descriptionAr,
    price: price !== undefined ? parseFloat(price) : existing.price,
    categoryId: categoryId || existing.categoryId,
    stock: stock !== undefined ? parseInt(stock) : existing.stock,
    imageUrl: imageUrl || existing.imageUrl,
    topSelling: topSelling !== undefined ? topSelling : existing.topSelling,
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
  let total = 0;
  const orderItems = [];

  // Match and deduct items in DB
  for (const item of items) {
    const prod = db.products.find(p => p.id === item.productId);
    if (!prod) {
      return res.status(404).json({ message: `Product ${item.productId} not found.` });
    }
    if (prod.stock < item.quantity) {
      return res.status(400).json({ message: `Insufficient stock for product ${prod.nameEn}.` });
    }

    prod.stock -= item.quantity;
    prod.salesCount = (prod.salesCount || 0) + item.quantity;
    total += prod.price * item.quantity;

    orderItems.push({
      productId: prod.id,
      productNameEn: prod.nameEn,
      productNameAr: prod.nameAr,
      price: prod.price,
      quantity: item.quantity,
    });
  }

  const orderId = `ord-${Date.now().toString().slice(-6)}`;
  const paymentDetails: any = {
    last4: '4242',
    brand: 'visa',
  };

  let status: OrderStatus = 'paid'; // Assumed success

  // Real stripe integration if key is provided and token present
  if (paymentMethod === 'stripe') {
    if (stripe) {
      try {
        // If a real client-side token is sent, charge it
        const charge = await stripe.charges.create({
          amount: Math.round(total * 100),
          currency: 'usd',
          source: stripePaymentToken || 'tok_visa', // fallback token
          description: `eMart Order ${orderId}`,
        });
        paymentDetails.paymentIntentId = charge.id;
        paymentDetails.last4 = charge.payment_method_details?.card?.last4 || '4242';
        paymentDetails.brand = charge.payment_method_details?.card?.brand || 'visa';
      } catch (err: any) {
        console.error('Stripe payment failed:', err);
        return res.status(400).json({ message: `Payment failed: ${err.message}` });
      }
    } else {
      // Sandbox mode
      paymentDetails.paymentIntentId = `pi_sandbox_${Date.now()}`;
      paymentDetails.last4 = '4242';
      paymentDetails.brand = 'visa';
    }
  } else if (paymentMethod === 'kasheir') {
    // Simulated Kasheir flow
    paymentDetails.paymentIntentId = `pi_kasheir_${Date.now()}`;
    paymentDetails.last4 = '9921';
    paymentDetails.brand = 'meeza';
  }

  const initialHistory: StatusHistoryItem[] = [
    { status: 'pending', updatedAt: new Date().toISOString(), updatedBy: 'System' },
    { status: 'paid', updatedAt: new Date().toISOString(), updatedBy: 'System' },
  ];

  const newOrder: Order = {
    id: orderId,
    userId: user.id,
    customerName: user.name,
    customerEmail: user.email,
    items: orderItems,
    totalAmount: parseFloat(total.toFixed(2)),
    status,
    paymentMethod,
    paymentDetails,
    statusHistory: initialHistory,
    createdAt: new Date().toISOString(),
    shippingAddress,
  };

  db.orders.push(newOrder);
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

  res.json({
    users: paginatedUsers,
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
    role: role as 'admin' | 'manager' | 'customer',
    permissions: role === 'admin' ? ['manage_products', 'manage_categories', 'manage_orders', 'manage_admins', 'manage_refunds'] : permissions || [],
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  db.passwords[newUser.id] = password;
  saveDb(db);

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
    permissions: role === 'admin' 
      ? ['manage_products', 'manage_categories', 'manage_orders', 'manage_admins', 'manage_refunds'] 
      : (permissions !== undefined ? permissions : existing.permissions),
  };

  if (password) {
    db.passwords[id] = password;
  }

  saveDb(db);
  res.json(db.users[userIndex]);
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
