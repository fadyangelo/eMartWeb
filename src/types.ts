export type Role = 'admin' | 'manager' | 'customer';

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'refunded' | 'cancelled';

export interface StatusHistoryItem {
  status: OrderStatus;
  updatedAt: string;
  updatedBy: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  permissions?: string[]; // e.g. ['manage_products', 'manage_categories', 'manage_orders', 'manage_admins', 'manage_refunds']
  createdAt: string;
}

export interface Category {
  id: string;
  nameEn: string;
  nameAr: string;
  slug: string;
}

export interface Product {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  price: number;
  categoryId: string;
  stock: number;
  imageUrl: string;
  topSelling?: boolean;
  salesCount: number;
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
  paymentMethod: 'stripe' | 'kasheir';
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
  };
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProductsCount: number;
  totalUsersCount: number;
  monthlyRevenue: { month: string; revenue: number; orders: number }[];
  topProducts: { id: string; nameEn: string; nameAr: string; sales: number; revenue: number }[];
}
