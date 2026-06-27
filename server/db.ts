import fs from 'fs';
import path from 'path';
import { User, Product, Category, Order, OrderStatus, SystemSettings, Transaction, ActivityLog, BackupFile, ShippingCity, RestoreEvent } from '../src/types';

const DB_PATH = path.join(process.cwd(), 'db.json');

interface DatabaseSchema {
  users: User[];
  passwords: Record<string, string>; // userId -> password (plain for simulation/demo simplicity)
  products: Product[];
  categories: Category[];
  orders: Order[];
  settings: SystemSettings;
  transactions: Transaction[];
  activityLogs?: ActivityLog[];
  backups?: BackupFile[];
  shippingCities?: ShippingCity[];
  restores?: RestoreEvent[];
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', nameEn: 'Electronics', nameAr: 'الإلكترونيات', slug: 'electronics' },
  { id: 'cat-2', nameEn: 'Fashion & Apparel', nameAr: 'الأزياء والملابس', slug: 'fashion' },
  { id: 'cat-3', nameEn: 'Home & Kitchen', nameAr: 'المنزل والمطبخ', slug: 'home-kitchen' },
  { id: 'cat-4', nameEn: 'Books & Stationery', nameAr: 'الكتب والأدوات المكتبية', slug: 'books' },
];

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    nameEn: 'Quantum X Pro Smartphone',
    nameAr: 'هاتف كوانتوم إكس برو الذكي',
    descriptionEn: 'Flagship smartphone featuring an OLED screen, 12GB RAM, 256GB storage, and cinematic camera.',
    descriptionAr: 'هاتف ذكي رائد يتميز بشاشة OLED، وذاكرة وصول عشوائي 12 جيجابايت، ومساحة تخزين 256 جيجابايت، وكاميرا سينمائية.',
    price: 899.99,
    categoryId: 'cat-1',
    stock: 25,
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=60',
    topSelling: true,
    salesCount: 42,
  },
  {
    id: 'prod-2',
    nameEn: 'AeroBook Air 14" Laptop',
    nameAr: 'كمبيوتر محمول آيروبوك إير 14 بوصة',
    descriptionEn: 'Ultralight laptop with high-speed processor, 16GB RAM, and 18-hour battery life.',
    descriptionAr: 'كمبيوتر محمول خفيف الوزن للغاية مع معالج عالي السرعة، وذاكرة وصول عشوائي (RAM) سعة 16 جيجابايت، وعمر بطارية يصل إلى 18 ساعة.',
    price: 1199.99,
    categoryId: 'cat-1',
    stock: 12,
    imageUrl: 'https://images.unsplash.com/photo-1496181130204-755241524eab?w=600&auto=format&fit=crop&q=60',
    topSelling: true,
    salesCount: 28,
  },
  {
    id: 'prod-3',
    nameEn: 'Elite Noise-Cancelling Headphones',
    nameAr: 'سماعات النخبة لإلغاء الضوضاء',
    descriptionEn: 'Wireless over-ear headphones with superior audio clarity and adaptive noise cancellation.',
    descriptionAr: 'سماعات رأس لاسلكية فوق الأذن تتميز بوضوح صوت فائق وإلغاء ضوضاء تكيفي.',
    price: 249.99,
    categoryId: 'cat-1',
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=60',
    topSelling: false,
    salesCount: 15,
  },
  {
    id: 'prod-4',
    nameEn: 'Classic Leather Bomber Jacket',
    nameAr: 'سترة جلدية بومبر كلاسيكية',
    descriptionEn: 'Premium full-grain leather jacket, hand-tailored with custom brass hardware.',
    descriptionAr: 'سترة جلدية فاخرة عالية الجودة، ومصممة يدوياً بقطع معدنية نحاسية مخصصة.',
    price: 199.99,
    categoryId: 'cat-2',
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=60',
    topSelling: false,
    salesCount: 19,
  },
  {
    id: 'prod-5',
    nameEn: 'SpeedRunner Athletic Shoes',
    nameAr: 'حذاء الجري الرياضي سبيد رانر',
    descriptionEn: 'Breathable, high-rebound cushioning shoes engineered for road running and track events.',
    descriptionAr: 'حذاء جري مريح ومبطن بمرونة عالية، مصمم للجري على الطرق والمسارات.',
    price: 120.00,
    categoryId: 'cat-2',
    stock: 45,
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60',
    topSelling: true,
    salesCount: 56,
  },
  {
    id: 'prod-6',
    nameEn: 'Signature Ceramic Coffee Mug',
    nameAr: 'كوب القهوة الخزفي الفاخر',
    descriptionEn: 'Artisanal double-walled ceramic mug, keeps your beverage hot with style.',
    descriptionAr: 'كوب قهوة خزفي مزدوج الجدران مصنوع يدوياً، يحافظ على مشروبك ساخناً بأناقة.',
    price: 24.99,
    categoryId: 'cat-3',
    stock: 120,
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=60',
    topSelling: false,
    salesCount: 8,
  },
  {
    id: 'prod-7',
    nameEn: 'Ergonomic Premium Office Chair',
    nameAr: 'كرسي مكتب مريح ومميز',
    descriptionEn: 'Lumbar-support mesh desk chair with adjustable arms, seat depth, and tilt mechanism.',
    descriptionAr: 'كرسي مكتب شبكي مريح مع دعم لأسفل الظهر ومساند أذرع قابلة للتعديل، وعمق المقعد، وآلية الإمالة.',
    price: 349.99,
    categoryId: 'cat-3',
    stock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=600&auto=format&fit=crop&q=60',
    topSelling: true,
    salesCount: 33,
  },
  {
    id: 'prod-8',
    nameEn: 'Vintage Leather Journal Set',
    nameAr: 'مجموعة دفتر ملاحظات جلدي عتيق',
    descriptionEn: 'Genuine leather notebook with heavy unlined cotton parchment paper and antique fountain pen.',
    descriptionAr: 'دفتر ملاحظات جلدي حقيقي مصنوع من ورق قطني سميك غير مسطر وقلم حبر عتيق.',
    price: 45.00,
    categoryId: 'cat-4',
    stock: 80,
    imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=60',
    topSelling: false,
    salesCount: 12,
  },
];

const DEFAULT_USERS: User[] = [
  {
    id: 'u-1',
    name: 'Chief Admin',
    email: 'admin@emart.com',
    role: 'admin',
    permissions: ['manage_products', 'manage_categories', 'manage_orders', 'manage_admins', 'manage_refunds'],
    createdAt: new Date(2026, 1, 1).toISOString(),
  },
  {
    id: 'u-2',
    name: 'Samer Ahmed (Manager)',
    email: 'manager@emart.com',
    role: 'manager',
    permissions: ['manage_products', 'manage_categories', 'manage_orders'],
    createdAt: new Date(2026, 2, 14).toISOString(),
  },
  {
    id: 'u-3',
    name: 'Fady Angelo (Customer)',
    email: 'fady.angelo@itspark-eg.com',
    role: 'customer',
    createdAt: new Date(2026, 3, 1).toISOString(),
  },
  {
    id: 'u-4',
    name: 'Mariam Ali',
    email: 'mariam@example.com',
    role: 'customer',
    createdAt: new Date(2026, 4, 10).toISOString(),
  },
];

const DEFAULT_PASSWORDS: Record<string, string> = {
  'u-1': 'admin123',
  'u-2': 'manager123',
  'u-3': 'fady123',
  'u-4': 'mariam123',
};

// Seed historical orders to populate the graphs beautifully over the current/past months
const generateMockOrders = (): Order[] => {
  const orders: Order[] = [];
  const startMonth = 1; // Feb (index 1)
  const currentYear = 2026;

  // Let's create orders spread across months for rich graphs
  // Feb 2026
  orders.push({
    id: 'ord-101',
    userId: 'u-3',
    customerName: 'Fady Angelo',
    customerEmail: 'fady.angelo@itspark-eg.com',
    items: [
      { productId: 'prod-1', productNameEn: 'Quantum X Pro Smartphone', productNameAr: 'هاتف كوانتوم إكس برو الذكي', price: 899.99, quantity: 1 },
      { productId: 'prod-5', productNameEn: 'SpeedRunner Athletic Shoes', productNameAr: 'حذاء الجري الرياضي سبيد رانر', price: 120.00, quantity: 1 }
    ],
    totalAmount: 1019.99,
    status: 'delivered',
    paymentMethod: 'stripe',
    paymentDetails: { last4: '4242', brand: 'visa', paymentIntentId: 'pi_mock_101' },
    createdAt: new Date(currentYear, startMonth, 10, 14, 20).toISOString(),
    shippingAddress: { city: 'Cairo', street: '9 El Maadi St', phone: '+201012345678' },
    statusHistory: [
      { status: 'pending', updatedAt: new Date(currentYear, startMonth, 10, 14, 20).toISOString(), updatedBy: 'Customer' },
      { status: 'paid', updatedAt: new Date(currentYear, startMonth, 10, 14, 22).toISOString(), updatedBy: 'System' },
      { status: 'processing', updatedAt: new Date(currentYear, startMonth, 11, 10, 0).toISOString(), updatedBy: 'manager@emart.com' },
      { status: 'shipped', updatedAt: new Date(currentYear, startMonth, 11, 17, 30).toISOString(), updatedBy: 'manager@emart.com' },
      { status: 'delivered', updatedAt: new Date(currentYear, startMonth, 13, 11, 15).toISOString(), updatedBy: 'System (Logistics)' }
    ]
  });

  // Mar 2026
  orders.push({
    id: 'ord-102',
    userId: 'u-4',
    customerName: 'Mariam Ali',
    customerEmail: 'mariam@example.com',
    items: [
      { productId: 'prod-2', productNameEn: 'AeroBook Air 14" Laptop', productNameAr: 'كمبيوتر محمول آيروبوك إير 14 بوصة', price: 1199.99, quantity: 1 },
      { productId: 'prod-8', productNameEn: 'Vintage Leather Journal Set', productNameAr: 'مجموعة دفتر ملاحظات جلدي عتيق', price: 45.00, quantity: 2 }
    ],
    totalAmount: 1289.99,
    status: 'delivered',
    paymentMethod: 'kasheir',
    paymentDetails: { last4: '8812', brand: 'mastercard', paymentIntentId: 'pi_mock_102' },
    createdAt: new Date(currentYear, startMonth + 1, 5, 18, 45).toISOString(),
    shippingAddress: { city: 'Alexandria', street: '14 Sporting St', phone: '+201287654321' },
    statusHistory: [
      { status: 'pending', updatedAt: new Date(currentYear, startMonth + 1, 5, 18, 45).toISOString(), updatedBy: 'Customer' },
      { status: 'paid', updatedAt: new Date(currentYear, startMonth + 1, 5, 18, 47).toISOString(), updatedBy: 'System' },
      { status: 'processing', updatedAt: new Date(currentYear, startMonth + 1, 6, 9, 30).toISOString(), updatedBy: 'admin@emart.com' },
      { status: 'shipped', updatedAt: new Date(currentYear, startMonth + 1, 6, 16, 0).toISOString(), updatedBy: 'admin@emart.com' },
      { status: 'delivered', updatedAt: new Date(currentYear, startMonth + 1, 8, 12, 0).toISOString(), updatedBy: 'System (Logistics)' }
    ]
  });

  // Apr 2026
  orders.push({
    id: 'ord-103',
    userId: 'u-3',
    customerName: 'Fady Angelo',
    customerEmail: 'fady.angelo@itspark-eg.com',
    items: [
      { productId: 'prod-3', productNameEn: 'Elite Noise-Cancelling Headphones', productNameAr: 'سماعات النخبة لإلغاء الضوضاء', price: 249.99, quantity: 2 }
    ],
    totalAmount: 499.98,
    status: 'delivered',
    paymentMethod: 'stripe',
    paymentDetails: { last4: '1111', brand: 'visa', paymentIntentId: 'pi_mock_103' },
    createdAt: new Date(currentYear, startMonth + 2, 15, 11, 10).toISOString(),
    shippingAddress: { city: 'Giza', street: '22 Pyramids Avenue', phone: '+201012345678' },
    statusHistory: [
      { status: 'pending', updatedAt: new Date(currentYear, startMonth + 2, 15, 11, 10).toISOString(), updatedBy: 'Customer' },
      { status: 'paid', updatedAt: new Date(currentYear, startMonth + 2, 15, 11, 12).toISOString(), updatedBy: 'System' },
      { status: 'processing', updatedAt: new Date(currentYear, startMonth + 2, 16, 14, 0).toISOString(), updatedBy: 'manager@emart.com' },
      { status: 'shipped', updatedAt: new Date(currentYear, startMonth + 2, 17, 10, 15).toISOString(), updatedBy: 'manager@emart.com' },
      { status: 'delivered', updatedAt: new Date(currentYear, startMonth + 2, 19, 15, 45).toISOString(), updatedBy: 'System (Logistics)' }
    ]
  });

  // May 2026
  orders.push({
    id: 'ord-104',
    userId: 'u-4',
    customerName: 'Mariam Ali',
    customerEmail: 'mariam@example.com',
    items: [
      { productId: 'prod-7', productNameEn: 'Ergonomic Premium Office Chair', productNameAr: 'كرسي مكتب مريح ومميز', price: 349.99, quantity: 1 },
      { productId: 'prod-6', productNameEn: 'Signature Ceramic Coffee Mug', productNameAr: 'كوب القهوة الخزفي الفاخر', price: 24.99, quantity: 3 }
    ],
    totalAmount: 424.96,
    status: 'processing',
    paymentMethod: 'stripe',
    paymentDetails: { last4: '4242', brand: 'visa', paymentIntentId: 'pi_mock_104' },
    createdAt: new Date(currentYear, startMonth + 3, 22, 9, 30).toISOString(),
    shippingAddress: { city: 'Cairo', street: '60 Heliopolis', phone: '+201287654321' },
    statusHistory: [
      { status: 'pending', updatedAt: new Date(currentYear, startMonth + 3, 22, 9, 30).toISOString(), updatedBy: 'Customer' },
      { status: 'paid', updatedAt: new Date(currentYear, startMonth + 3, 22, 9, 32).toISOString(), updatedBy: 'System' },
      { status: 'processing', updatedAt: new Date(currentYear, startMonth + 3, 23, 11, 0).toISOString(), updatedBy: 'admin@emart.com' }
    ]
  });

  // June 2026 (current month in ADDITIONAL_METADATA)
  orders.push({
    id: 'ord-105',
    userId: 'u-3',
    customerName: 'Fady Angelo',
    customerEmail: 'fady.angelo@itspark-eg.com',
    items: [
      { productId: 'prod-5', productNameEn: 'SpeedRunner Athletic Shoes', productNameAr: 'حذاء الجري الرياضي سبيد رانر', price: 120.00, quantity: 2 },
      { productId: 'prod-4', productNameEn: 'Classic Leather Bomber Jacket', productNameAr: 'سترة جلدية بومبر كلاسيكية', price: 199.99, quantity: 1 }
    ],
    totalAmount: 439.99,
    status: 'paid',
    paymentMethod: 'stripe',
    paymentDetails: { last4: '4242', brand: 'visa', paymentIntentId: 'pi_mock_105' },
    createdAt: new Date(currentYear, startMonth + 4, 18, 15, 40).toISOString(),
    shippingAddress: { city: 'Giza', street: '22 Pyramids Avenue', phone: '+201012345678' },
    statusHistory: [
      { status: 'pending', updatedAt: new Date(currentYear, startMonth + 4, 18, 15, 40).toISOString(), updatedBy: 'Customer' },
      { status: 'paid', updatedAt: new Date(currentYear, startMonth + 4, 18, 15, 41).toISOString(), updatedBy: 'System' }
    ]
  });

  // A refunded order to demonstrate refunds tracking
  orders.push({
    id: 'ord-106',
    userId: 'u-4',
    customerName: 'Mariam Ali',
    customerEmail: 'mariam@example.com',
    items: [
      { productId: 'prod-6', productNameEn: 'Signature Ceramic Coffee Mug', productNameAr: 'كوب القهوة الخزفي الفاخر', price: 24.99, quantity: 1 }
    ],
    totalAmount: 24.99,
    status: 'refunded',
    paymentMethod: 'stripe',
    paymentDetails: { last4: '5555', brand: 'amex', paymentIntentId: 'pi_mock_106', refundId: 're_mock_106', refundedAmount: 24.99 },
    createdAt: new Date(currentYear, startMonth + 2, 2, 10, 0).toISOString(),
    shippingAddress: { city: 'Cairo', street: '12 Nasr City', phone: '+201287654321' },
    statusHistory: [
      { status: 'pending', updatedAt: new Date(currentYear, startMonth + 2, 2, 10, 0).toISOString(), updatedBy: 'Customer' },
      { status: 'paid', updatedAt: new Date(currentYear, startMonth + 2, 2, 10, 2).toISOString(), updatedBy: 'System' },
      { status: 'refunded', updatedAt: new Date(currentYear, startMonth + 2, 3, 14, 0).toISOString(), updatedBy: 'admin@emart.com' }
    ]
  });

  return orders;
};

export const DEFAULT_SETTINGS: SystemSettings = {
  paymentOptions: ['cod', 'card'],
  paymentGateway: 'stripe',
  gatewayMode: 'test',
  stripeTestSecretKey: 'sk_test_placeholder',
  stripeLiveSecretKey: '',
  kasheirTestKey: 'pk_test_placeholder',
  kasheirLiveKey: '',
  currency: 'USD',
  promoTimerEnabled: true,
  promoTimerFrom: new Date(Date.now() - 3600000).toISOString(), // started 1 hour ago
  promoTimerTo: new Date(Date.now() + 86400000 * 3).toISOString(), // ends in 3 days
  promoTimerTextEn: 'Big Summer Sale - Up to 50% Off!',
  promoTimerTextAr: 'تخفيضات الصيف الكبرى - خصم يصل إلى ٥٠٪!',
  codExtraChargeEnabled: false,
  codExtraChargeAmount: 0,
};

export const generateMockTransactions = (orders: Order[]): Transaction[] => {
  const transactions: Transaction[] = [];
  for (const order of orders) {
    const isRefunded = order.status === 'refunded';
    
    // Add primary payment transaction
    const txId = `tx-pay-${order.id}`;
    transactions.push({
      id: txId,
      orderId: order.id,
      clientName: order.customerName,
      clientMobile: order.shippingAddress?.phone || '+201012345678',
      amount: order.totalAmount,
      paymentMethod: order.paymentMethod === 'cod' ? 'cod' : 'card',
      paymentGateway: order.paymentMethod === 'cod' ? undefined : (order.paymentMethod as any),
      gatewayMode: order.paymentMethod === 'cod' ? undefined : 'test',
      transactionNumber: order.paymentDetails?.paymentIntentId || `pi_sandbox_${order.id}`,
      last4: order.paymentDetails?.last4 || '4242',
      status: isRefunded ? 'Refund' : 'Success',
      type: 'payment',
      createdAt: order.createdAt,
    });

    // Add refund transaction if refunded
    if (isRefunded) {
      transactions.push({
        id: `tx-ref-${order.id}`,
        orderId: order.id,
        clientName: order.customerName,
        clientMobile: order.shippingAddress?.phone || '+201012345678',
        amount: order.totalAmount,
        paymentMethod: 'card',
        paymentGateway: order.paymentMethod === 'cod' ? undefined : (order.paymentMethod as any),
        gatewayMode: order.paymentMethod === 'cod' ? undefined : 'test',
        transactionNumber: order.paymentDetails?.refundId || `ref_sandbox_${order.id}`,
        last4: order.paymentDetails?.last4 || '4242',
        status: 'Refund',
        type: 'refund',
        createdAt: new Date(new Date(order.createdAt).getTime() + 86400000).toISOString(), // 1 day later
      });
    }
  }
  return transactions;
};

const MOCK_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'log-1',
    timestamp: new Date(2026, 5, 20, 10, 15, 0).toISOString(),
    userEmail: 'admin@emart.com',
    userName: 'Chief Admin',
    action: 'System Initialized',
    description: 'E-Mart platform database seeded and settings initialized successfully.',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
  },
  {
    id: 'log-2',
    timestamp: new Date(2026, 5, 22, 14, 30, 0).toISOString(),
    userEmail: 'manager@emart.com',
    userName: 'Samer Ahmed (Manager)',
    action: 'Update Product',
    description: 'Updated price of Quantum X Pro Smartphone to $899.99.',
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  },
  {
    id: 'log-3',
    timestamp: new Date(2026, 5, 25, 11, 45, 0).toISOString(),
    userEmail: 'admin@emart.com',
    userName: 'Chief Admin',
    action: 'Create Backup',
    description: 'Manual system backup "backup-2026-06-25.json" created successfully.',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
  }
];

export const DEFAULT_CITIES: ShippingCity[] = [
  { id: 'c-1', nameEn: 'Cairo', nameAr: 'القاهرة', defaultShippingFee: 70, minOrderAmount: 100, discountAmount: 30, minOrderForDiscount: 200 },
  { id: 'c-2', nameEn: 'Giza', nameAr: 'الجيزة', defaultShippingFee: 70, minOrderAmount: 100, discountAmount: 30, minOrderForDiscount: 200 },
  { id: 'c-3', nameEn: 'Alexandria', nameAr: 'الإسكندرية', defaultShippingFee: 70, minOrderAmount: 100, discountAmount: 30, minOrderForDiscount: 200 },
  { id: 'c-4', nameEn: 'Qalyubia', nameAr: 'القليوبية', defaultShippingFee: 70, minOrderAmount: 100, discountAmount: 30, minOrderForDiscount: 200 },
  { id: 'c-5', nameEn: 'Sharqia', nameAr: 'الشرقية', defaultShippingFee: 70, minOrderAmount: 100, discountAmount: 30, minOrderForDiscount: 200 },
  { id: 'c-6', nameEn: 'Dakahlia', nameAr: 'الدقهلية', defaultShippingFee: 70, minOrderAmount: 100, discountAmount: 30, minOrderForDiscount: 200 },
  { id: 'c-7', nameEn: 'Beheira', nameAr: 'البحيرة', defaultShippingFee: 70, minOrderAmount: 100, discountAmount: 30, minOrderForDiscount: 200 },
  { id: 'c-8', nameEn: 'Minya', nameAr: 'المنيا', defaultShippingFee: 70, minOrderAmount: 100, discountAmount: 30, minOrderForDiscount: 200 },
  { id: 'c-9', nameEn: 'Gharbia', nameAr: 'الغربية', defaultShippingFee: 70, minOrderAmount: 100, discountAmount: 30, minOrderForDiscount: 200 },
  { id: 'c-10', nameEn: 'Sohag', nameAr: 'سوهاج', defaultShippingFee: 70, minOrderAmount: 100, discountAmount: 30, minOrderForDiscount: 200 },
  { id: 'c-11', nameEn: 'Monufia', nameAr: 'المنوفية', defaultShippingFee: 70, minOrderAmount: 100, discountAmount: 30, minOrderForDiscount: 200 },
  { id: 'c-12', nameEn: 'Asyut', nameAr: 'أسيوط', defaultShippingFee: 70, minOrderAmount: 100, discountAmount: 30, minOrderForDiscount: 200 },
  { id: 'c-13', nameEn: 'Kafr El Sheikh', nameAr: 'كفر الشيخ', defaultShippingFee: 70, minOrderAmount: 100, discountAmount: 30, minOrderForDiscount: 200 },
  { id: 'c-14', nameEn: 'Faiyum', nameAr: 'الفيوم', defaultShippingFee: 70, minOrderAmount: 100, discountAmount: 30, minOrderForDiscount: 200 },
  { id: 'c-15', nameEn: 'Qena', nameAr: 'قنا', defaultShippingFee: 70, minOrderAmount: 100, discountAmount: 30, minOrderForDiscount: 200 },
  { id: 'c-16', nameEn: 'Damietta', nameAr: 'دمياط', defaultShippingFee: 70, minOrderAmount: 100, discountAmount: 30, minOrderForDiscount: 200 },
  { id: 'c-17', nameEn: 'Aswan', nameAr: 'أسوان', defaultShippingFee: 70, minOrderAmount: 100, discountAmount: 30, minOrderForDiscount: 200 },
  { id: 'c-18', nameEn: 'Ismailia', nameAr: 'الإسماعيلية', defaultShippingFee: 70, minOrderAmount: 100, discountAmount: 30, minOrderForDiscount: 200 },
  { id: 'c-19', nameEn: 'Luxor', nameAr: 'الأقصر', defaultShippingFee: 70, minOrderAmount: 100, discountAmount: 30, minOrderForDiscount: 200 },
  { id: 'c-20', nameEn: 'Port Said', nameAr: 'بورسعيد', defaultShippingFee: 70, minOrderAmount: 100, discountAmount: 30, minOrderForDiscount: 200 },
  { id: 'c-21', nameEn: 'Suez', nameAr: 'السويس', defaultShippingFee: 70, minOrderAmount: 100, discountAmount: 30, minOrderForDiscount: 200 },
  { id: 'c-22', nameEn: 'Red Sea', nameAr: 'البحر الأحمر', defaultShippingFee: 70, minOrderAmount: 100, discountAmount: 30, minOrderForDiscount: 200 },
  { id: 'c-23', nameEn: 'South Sinai', nameAr: 'جنوب سيناء', defaultShippingFee: 70, minOrderAmount: 100, discountAmount: 30, minOrderForDiscount: 200 },
  { id: 'c-24', nameEn: 'North Sinai', nameAr: 'شمال سيناء', defaultShippingFee: 70, minOrderAmount: 100, discountAmount: 30, minOrderForDiscount: 200 },
  { id: 'c-25', nameEn: 'Matrouh', nameAr: 'مطروح', defaultShippingFee: 70, minOrderAmount: 100, discountAmount: 30, minOrderForDiscount: 200 },
  { id: 'c-26', nameEn: 'New Valley', nameAr: 'الوادي الجديد', defaultShippingFee: 70, minOrderAmount: 100, discountAmount: 30, minOrderForDiscount: 200 },
  { id: 'c-27', nameEn: 'Beni Suef', nameAr: 'بني سويف', defaultShippingFee: 70, minOrderAmount: 100, discountAmount: 30, minOrderForDiscount: 200 }
];

export const getDb = (): DatabaseSchema => {
  if (!fs.existsSync(DB_PATH)) {
    const initialOrders = generateMockOrders();
    const initialDb: DatabaseSchema = {
      users: DEFAULT_USERS,
      passwords: DEFAULT_PASSWORDS,
      products: DEFAULT_PRODUCTS,
      categories: DEFAULT_CATEGORIES,
      orders: initialOrders,
      settings: DEFAULT_SETTINGS,
      transactions: generateMockTransactions(initialOrders),
      activityLogs: MOCK_ACTIVITY_LOGS,
      backups: [],
      shippingCities: DEFAULT_CITIES,
      restores: []
    };
    saveDb(initialDb);
    return initialDb;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as DatabaseSchema;
    let updated = false;
    
    if (!parsed.settings) {
      parsed.settings = DEFAULT_SETTINGS;
      updated = true;
    }
    if (!parsed.transactions || parsed.transactions.length === 0) {
      parsed.transactions = generateMockTransactions(parsed.orders || []);
      updated = true;
    }
    if (!parsed.activityLogs) {
      parsed.activityLogs = MOCK_ACTIVITY_LOGS;
      updated = true;
    }
    if (!parsed.backups) {
      parsed.backups = [];
      updated = true;
    }
    if (!parsed.shippingCities || parsed.shippingCities.length === 0) {
      parsed.shippingCities = DEFAULT_CITIES;
      updated = true;
    }
    if (!parsed.restores) {
      parsed.restores = [];
      updated = true;
    }
    if (updated) {
      saveDb(parsed);
    }
    return parsed;
  } catch (error) {
    console.error('Error reading JSON DB, restoring defaults', error);
    const initialOrders = generateMockOrders();
    const initialDb: DatabaseSchema = {
      users: DEFAULT_USERS,
      passwords: DEFAULT_PASSWORDS,
      products: DEFAULT_PRODUCTS,
      categories: DEFAULT_CATEGORIES,
      orders: initialOrders,
      settings: DEFAULT_SETTINGS,
      transactions: generateMockTransactions(initialOrders),
      activityLogs: MOCK_ACTIVITY_LOGS,
      backups: [],
      shippingCities: DEFAULT_CITIES,
      restores: []
    };
    saveDb(initialDb);
    return initialDb;
  }
};

export const saveDb = (db: DatabaseSchema) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to JSON DB', error);
  }
};
