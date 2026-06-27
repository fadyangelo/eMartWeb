import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Product, Category, Order, SystemSettings } from '../types';

export type ActiveTab = 'store' | 'cart' | 'my-orders' | 'admin';
export type AdminSubTab = 'dashboard' | 'products' | 'categories' | 'orders' | 'admin-users' | 'customers' | 'settings' | 'payments' | 'activity-logs' | 'backup-restore';
export type Language = 'en' | 'ar';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  adminSubTab: AdminSubTab;
  setAdminSubTab: (sub: AdminSubTab) => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  authModalCallback: (() => void) | null;
  setAuthModalCallback: (callback: (() => void) | null) => void;
  apiFetch: (url: string, options?: RequestInit) => Promise<any>;
  t: (key: string) => string;
  settings: SystemSettings | null;
  fetchSettings: () => Promise<void>;
  isPromoActive: () => boolean;
  getProductPrice: (product: Product) => { original: number; final: number; hasDiscount: boolean; discountText: string };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// English & Arabic Translation Dictionary
const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    // Nav / General
    appName: 'eMart',
    slogan: 'Your Premium Marketplace',
    home: 'Home',
    cart: 'Cart',
    myOrders: 'My Orders',
    adminPanel: 'Admin Panel',
    login: 'Login',
    logout: 'Logout',
    signUp: 'Sign Up',
    welcome: 'Welcome',
    language: 'العربية',
    searchPlaceholder: 'Search products...',
    allCategories: 'All Categories',
    priceRange: 'Price Range',
    filter: 'Filter',
    sort: 'Sort By',
    sortByPriceAsc: 'Price: Low to High',
    sortByPriceDesc: 'Price: High to Low',
    sortByName: 'Alphabetical',
    sortByPopular: 'Most Popular',
    page: 'Page',
    of: 'of',
    addToCart: 'Add to Cart',
    outOfStock: 'Out of Stock',
    onlyLeft: 'only {num} left!',
    items: 'items',
    total: 'Total',
    subtotal: 'Subtotal',
    checkout: 'Proceed to Checkout',
    emptyCart: 'Your cart is empty.',
    backToShop: 'Back to Shop',
    loading: 'Loading...',
    
    // Auth
    loginRequired: 'Authentication Required',
    loginPrompt: 'Please login or sign up to complete your checkout.',
    nameLabel: 'Full Name',
    emailLabel: 'Email Address',
    passwordLabel: 'Password',
    haveAccount: 'Already have an account?',
    noAccount: "Don't have an account?",
    signingIn: 'Signing in...',
    signingUp: 'Creating account...',
    
    // Checkout & Orders
    shippingInfo: 'Shipping Information',
    cityLabel: 'City',
    streetLabel: 'Street Address',
    phoneLabel: 'Phone Number',
    paymentMethod: 'Payment Method',
    stripeCard: 'Credit Card (Stripe)',
    kasheirPay: 'Kasheir Gateway (Meeza/Wallet)',
    placeOrder: 'Place Order & Pay',
    placingOrder: 'Processing Payment...',
    orderSuccess: 'Order Placed Successfully!',
    orderSuccessMsg: 'Thank you! Your order has been received and is being processed.',
    orderId: 'Order ID',
    orderDate: 'Date',
    orderTotal: 'Total Amount',
    orderStatus: 'Status',
    paymentDetails: 'Payment',
    shippingTo: 'Shipping To',
    timeline: 'Status Tracking Timeline',
    noOrders: 'You have not placed any orders yet.',
    viewDetails: 'View Details',
    hideDetails: 'Hide Details',
    trackOrder: 'Track Order',
    
    // Statuses
    pending: 'Pending',
    paid: 'Paid / Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    refunded: 'Refunded',
    cancelled: 'Cancelled',
    
    // Admin general
    adminDashboard: 'Dashboard',
    adminProducts: 'Products',
    adminCategories: 'Categories',
    adminOrders: 'Orders',
    adminUsers: 'Admin Staff',
    activityLogs: 'Activity Logs',
    backupRestore: 'Backup & Restore',
    usersManagement: 'Users Management',
    siteUsers: 'Customers',
    revenue: 'Revenue',
    kpiRevenue: 'Total Revenues',
    kpiOrders: 'Total Sales',
    kpiProducts: 'Total Catalog',
    kpiCustomers: 'Shoppers',
    topProductsTitle: 'Top Selling Products',
    salesOverTime: 'Revenues Over Months',
    actions: 'Actions',
    edit: 'Edit',
    delete: 'Delete',
    addNew: 'Add New',
    save: 'Save',
    cancel: 'Cancel',
    statusChange: 'Change Status',
    statusHistory: 'Status Log',
    refundOrder: 'Issue Full Refund',
    refunding: 'Processing Refund...',
    permissions: 'Staff Permissions',
    roles: 'Roles & Permissions',
    assignedPermissions: 'Assigned Permissions',
    roleLabel: 'Role',
    manageProducts: 'Manage Products',
    manageCategories: 'Manage Categories',
    manageOrders: 'Manage Orders',
    manageAdmins: 'Manage Admins/Staff',
    manageRefunds: 'Manage Refunds',
    customerOrdersTitle: 'Order History for Customer',
    totalSpent: 'Total Spent',
    regDate: 'Registered On',
    productFormTitle: 'Product Form',
    categoryFormTitle: 'Category Form',
  },
  ar: {
    // Nav / General
    appName: 'إي مارت',
    slogan: 'سوقك التجاري المتميز',
    home: 'الرئيسية',
    cart: 'السلة',
    myOrders: 'طلباتي',
    adminPanel: 'لوحة التحكم',
    login: 'تسجيل الدخول',
    logout: 'تسجيل الخروج',
    signUp: 'إنشاء حساب',
    welcome: 'مرحباً',
    language: 'English',
    searchPlaceholder: 'البحث عن المنتجات...',
    allCategories: 'جميع الفئات',
    priceRange: 'نطاق السعر',
    filter: 'تصفية',
    sort: 'ترتيب حسب',
    sortByPriceAsc: 'السعر: من الأقل للأعلى',
    sortByPriceDesc: 'السعر: من الأعلى للأقل',
    sortByName: 'أبجدي',
    sortByPopular: 'الأكثر شعبية',
    page: 'صفحة',
    of: 'من',
    addToCart: 'إضافة إلى السلة',
    outOfStock: 'غير متوفر',
    onlyLeft: 'متبقي {num} فقط!',
    items: 'قطع',
    total: 'الإجمالي',
    subtotal: 'المجموع الفرعي',
    checkout: 'إتمام الشراء',
    emptyCart: 'سلة المشتريات فارغة.',
    backToShop: 'العودة للتسوق',
    loading: 'جاري التحميل...',
    
    // Auth
    loginRequired: 'مطلوب تسجيل الدخول',
    loginPrompt: 'يرجى تسجيل الدخول أو إنشاء حساب لإتمام عملية الشراء.',
    nameLabel: 'الاسم الكامل',
    emailLabel: 'البريد الإلكتروني',
    passwordLabel: 'كلمة المرور',
    haveAccount: 'هل لديك حساب بالفعل؟',
    noAccount: 'ليس لديك حساب؟',
    signingIn: 'جاري تسجيل الدخول...',
    signingUp: 'جاري إنشاء الحساب...',
    
    // Checkout & Orders
    shippingInfo: 'معلومات الشحن',
    cityLabel: 'المدينة',
    streetLabel: 'اسم الشارع / العنوان',
    phoneLabel: 'رقم الهاتف',
    paymentMethod: 'طريقة الدفع',
    stripeCard: 'بطاقة ائتمان (Stripe)',
    kasheirPay: 'بوابة كاشير (ميزة / المحفظة الإلكترونية)',
    placeOrder: 'إتمام الطلب والدفع',
    placingOrder: 'جاري معالجة الدفع...',
    orderSuccess: 'تم تقديم طلبك بنجاح!',
    orderSuccessMsg: 'شكراً لك! تم استلام طلبك وهو قيد المعالجة الآن.',
    orderId: 'رقم الطلب',
    orderDate: 'التاريخ',
    orderTotal: 'المبلغ الإجمالي',
    orderStatus: 'حالة الطلب',
    paymentDetails: 'تفاصيل الدفع',
    shippingTo: 'الشحن إلى',
    timeline: 'مخطط تتبع حالة الطلب',
    noOrders: 'لم تقم بتقديم أي طلبات بعد.',
    viewDetails: 'عرض التفاصيل',
    hideDetails: 'إخفاء التفاصيل',
    trackOrder: 'تتبع الطلب',
    
    // Statuses
    pending: 'قيد الانتظار',
    paid: 'تم الدفع / مؤكد',
    processing: 'قيد التجهيز',
    shipped: 'تم الشحن',
    delivered: 'تم التوصيل',
    refunded: 'مسترجع',
    cancelled: 'ملغي',
    
    // Admin general
    adminDashboard: 'لوحة القيادة',
    adminProducts: 'المنتجات',
    adminCategories: 'الفئات',
    adminOrders: 'الطلبات',
    adminUsers: 'الموظفين',
    activityLogs: 'سجلات النشاط',
    backupRestore: 'النسخ الاحتياطي والاستعادة',
    usersManagement: 'إدارة المستخدمين',
    siteUsers: 'العملاء',
    revenue: 'الإيرادات',
    kpiRevenue: 'إجمالي الإيرادات',
    kpiOrders: 'إجمالي المبيعات',
    kpiProducts: 'إجمالي الكتالوج',
    kpiCustomers: 'شريحة العملاء',
    topProductsTitle: 'المنتجات الأكثر مبيعاً',
    salesOverTime: 'الإيرادات على مدار الأشهر',
    actions: 'الإجراءات',
    edit: 'تعديل',
    delete: 'حذف',
    addNew: 'إضافة جديد',
    save: 'حفظ',
    cancel: 'إلغاء',
    statusChange: 'تغيير الحالة',
    statusHistory: 'سجل الحالات',
    refundOrder: 'إصدار استرداد كامل للمبلغ',
    refunding: 'جاري معالجة الاسترداد...',
    permissions: 'صلاحيات الموظف',
    roles: 'الأدوار والصلاحيات',
    assignedPermissions: 'الصلاحيات الممنوحة',
    roleLabel: 'الدور',
    manageProducts: 'إدارة المنتجات',
    manageCategories: 'إدارة الفئات',
    manageOrders: 'إدارة الطلبات',
    manageAdmins: 'إدارة الموظفين والمسؤولين',
    manageRefunds: 'إدارة عمليات الاسترجاع',
    customerOrdersTitle: 'سجل طلبات العميل',
    totalSpent: 'إجمالي الإنفاق',
    regDate: 'تاريخ التسجيل',
    productFormTitle: 'نموذج المنتج',
    categoryFormTitle: 'نموذج الفئة',
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(
    () => (localStorage.getItem('emart_lang') as Language) || 'en'
  );
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('emart_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('emart_token')
  );
  const [cart, setCart] = useState<CartItem[]>(() => {
    const raw = localStorage.getItem('emart_cart');
    return raw ? JSON.parse(raw) : [];
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('store');
  const [adminSubTab, setAdminSubTab] = useState<AdminSubTab>('dashboard');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalCallback, setAuthModalCallback] = useState<(() => void) | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  const fetchSettings = async () => {
    try {
      const data = await apiFetch('/api/settings');
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [token]);

  const isPromoActive = (): boolean => {
    if (!settings || !settings.promoTimerEnabled) return false;
    if (!settings.promoTimerFrom || !settings.promoTimerTo) {
      return true;
    }
    const now = new Date();
    const from = new Date(settings.promoTimerFrom);
    const to = new Date(settings.promoTimerTo);
    return now >= from && now <= to;
  };

  const getProductPrice = (product: Product) => {
    const original = product.price;
    if (!isPromoActive()) {
      return { original, final: original, hasDiscount: false, discountText: '' };
    }

    let final = original;
    let hasDiscount = false;
    let discountText = '';

    if (product.discountPercent !== undefined && product.discountPercent > 0) {
      final = original * (1 - product.discountPercent / 100);
      hasDiscount = true;
      discountText = `-${product.discountPercent}%`;
    } else if (product.discountAmount !== undefined && product.discountAmount > 0) {
      final = Math.max(0, original - product.discountAmount);
      hasDiscount = true;
      const cur = settings?.currency || 'USD';
      discountText = `-${product.discountAmount} ${cur}`;
    }

    return { original, final, hasDiscount, discountText };
  };

  useEffect(() => {
    localStorage.setItem('emart_lang', language);
    // Apply HTML dir and lang attributes
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    localStorage.setItem('emart_cart', JSON.stringify(cart));
  }, [cart]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('emart_token', newToken);
    localStorage.setItem('emart_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('emart_token');
    localStorage.removeItem('emart_user');
    setActiveTab('store');
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const idx = prev.findIndex(item => item.product.id === product.id);
      const isStockLimited = product.stock !== undefined && product.stock !== null && (product.stock as any) !== '';
      const stockLimit = isStockLimited ? Number(product.stock) : Infinity;

      if (idx > -1) {
        const currentQty = prev[idx].quantity;
        if (currentQty >= stockLimit) {
          return prev; // cannot exceed stock limit
        }
        return prev.map((item, i) =>
          i === idx ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      if (stockLimit <= 0) {
        return prev; // out of stock
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          const isStockLimited = item.product.stock !== undefined && item.product.stock !== null && (item.product.stock as any) !== '';
          const stockLimit = isStockLimited ? Number(item.product.stock) : Infinity;
          const targetQty = Math.min(quantity, stockLimit);
          return { ...item, quantity: targetQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const apiFetch = async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }
    return data;
  };

  // Translation helper
  const t = (key: string): string => {
    const langDict = TRANSLATIONS[language];
    return langDict[key] || key;
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        user,
        token,
        login,
        logout,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        activeTab,
        setActiveTab,
        adminSubTab,
        setAdminSubTab,
        showAuthModal,
        setShowAuthModal,
        authModalCallback,
        setAuthModalCallback,
        apiFetch,
        t,
        settings,
        fetchSettings,
        isPromoActive,
        getProductPrice,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
