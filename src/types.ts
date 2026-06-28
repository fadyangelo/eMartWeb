export type Role = 'admin' | 'manager' | 'customer' | 'staff';

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'refunded' | 'cancelled';

export interface StatusHistoryItem {
  status: OrderStatus;
  updatedAt: string;
  updatedBy: string;
}

export interface User {
  id?: string;
  name: string;
  email: string;
  role: Role;
  password?: string;
  permissions?: string[]; // e.g. ['manage_products', 'manage_categories', 'manage_orders', 'manage_admins', 'manage_refunds']
  disabled?: boolean;
  createdAt?: string;
  priceMultiplier?: number;
  // Granular Access Rights
  canSeeAllOrders?: boolean;
  canEditOrders?: boolean;
  canEditOwnOrders?: boolean;
  canEditAllOrders?: boolean;
  canEditOwnStatus?: boolean;
  canEditAllStatus?: boolean;
  canDeleteOrders?: boolean;
  canDeleteOwnOrders?: boolean;
  canDeleteAllOrders?: boolean;
  canSeeReviewsPage?: boolean;
  canViewFullDashboard?: boolean;
  canViewPaymentTerms?: boolean;
  canAddPaymentTerms?: boolean;
  canEditPaymentTerms?: boolean;
  canDeletePaymentTerms?: boolean;
  canViewBackups?: boolean;
  canManageBackups?: boolean;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userEmail: string;
  userName: string;
  userRole?: string;
  action: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface BackupFile {
  filename: string;
  size: number;
  createdAt: string;
  isAutomatic?: boolean;
  description?: string;
  createdByEmail?: string;
  createdByName?: string;
}

export interface RestoreEvent {
  id: string;
  filename: string;
  size?: number;
  createdAt: string;
  createdByEmail: string;
  createdByName: string;
  description?: string;
}

export interface Category {
  id: string;
  nameEn: string;
  nameAr: string;
  slug: string;
  imageUrl?: string; // Support uploaded image
}

export interface ProductReview {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Product {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  price: number;
  categoryId: string;
  stock?: number | null; // optional: null/undefined/empty => unlimited, 0 => out of stock, positive => qty
  imageUrl: string; // URL or Base64 string from upload
  topSelling?: boolean;
  salesCount: number;
  enabled?: boolean; // Default true if not defined
  discountPercent?: number;
  discountAmount?: number;
  // Extended fields
  rating?: number;
  reviewsCount?: number;
  specificationsEn?: string;
  specificationsAr?: string;
  datasheetUrl?: string;
  videoUrl?: string;
  images?: string[]; // Multiple images
  coverImageIndex?: number; // Cover index
  reviews?: ProductReview[]; // Customer reviews
}

export interface OrderItem {
  productId: string;
  productNameEn: string;
  productNameAr: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: 'cod' | 'stripe' | 'kasheir' | 'card'; // 'cod' or 'card' from user perspective, but records gateway or cod
  paymentGateway?: 'stripe' | 'kasheir';
  gatewayMode?: 'live' | 'test';
  transactionNumber?: string;
  last4?: string;
  transactionStatus?: 'Success' | 'Failed';
  paymentDetails?: {
    paymentIntentId?: string;
    refundId?: string;
    refundedAmount?: number;
    last4?: string;
    brand?: string;
  };
  statusHistory: StatusHistoryItem[];
  createdAt: string;
  shippingAddress: {
    city: string;
    street: string;
    phone: string;
    nearestLandmark?: string;
    buildingFloor?: string;
    preferredDeliveryTime?: string;
  };
  shippingFee?: number;
  shippingDiscount?: number;
  codCharge?: number;
}

export interface SystemSettings {
  paymentOptions: ('cod' | 'card')[];
  paymentGateway: 'stripe' | 'kasheir';
  gatewayMode: 'test' | 'live';
  stripeTestSecretKey: string;
  stripeLiveSecretKey: string;
  kasheirTestKey: string;
  kasheirLiveKey: string;
  currency: string;
  promoTimerEnabled: boolean;
  promoTimerFrom: string;
  promoTimerTo: string;
  promoTimerTextEn: string;
  promoTimerTextAr: string;
  codExtraChargeEnabled?: boolean;
  codExtraChargeAmount?: number;
  mailUser?: string;
  mailPass?: string;
  baseUrl?: string;
  salesEmail?: string;
  logoUrl?: string;
  storeNameEn?: string;
  storeNameAr?: string;
  sloganEn?: string;
  sloganAr?: string;
  primaryColor?: string;
  secondaryColor?: string;
  defaultLanguage?: 'en' | 'ar';
  allowMultiLanguage?: boolean;
  isOnline?: boolean;
}

export interface Transaction {
  id: string;
  orderId: string;
  clientName: string;
  clientMobile: string;
  amount: number;
  paymentMethod: 'cod' | 'card';
  paymentGateway?: 'stripe' | 'kasheir';
  gatewayMode?: 'live' | 'test';
  transactionNumber?: string;
  last4?: string;
  status: 'Pending' | 'Success' | 'Failed' | 'Refund';
  type: 'payment' | 'refund';
  createdAt: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProductsCount: number;
  totalUsersCount: number;
  monthlyRevenue: { month: string; revenue: number; orders: number }[];
  topProducts: { id: string; nameEn: string; nameAr: string; sales: number; revenue: number }[];
}

export interface ShippingCity {
  id: string;
  nameEn: string;
  nameAr: string;
  defaultShippingFee: number;
  minOrderAmount: number;
  discountAmount: number;
  minOrderForDiscount: number;
}
