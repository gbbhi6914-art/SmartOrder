export interface UserProfile {
  uid: string;
  businessName: string;
  logoUrl?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  currency: string;
  invoicePrefix: string;
  language: string;
  theme: 'light' | 'dark';
  colorTheme?: 'indigo' | 'emerald' | 'rose' | 'amber' | 'violet' | 'cyan';
  orderNotifications?: boolean;
  paymentAlerts?: boolean;
  pin?: string;
  biometricLock?: boolean;
}

export interface Customer {
  id: string;
  ownerUid: string;
  name: string;
  phone: string;
  whatsapp?: string;
  address?: string;
  notes?: string;
  isVip: boolean;
  totalOrders: number;
  unpaidBalance: number;
  lastOrderDate?: string;
  favoriteItems: string[];
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  ownerUid: string;
  customerId: string;
  customerName: string;
  date: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  deliveryCharges: number;
  tax: number;
  total: number;
  advancePaid: number;
  balance: number;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'JazzCash' | 'EasyPaisa' | 'Card';
  paymentStatus: 'Paid' | 'Partial' | 'Unpaid';
  deliveryStatus: 'Pending' | 'Ready' | 'Delivered' | 'Cancelled';
  notes?: string;
}

export interface Offer {
  id: string;
  ownerUid: string;
  title: string;
  description: string;
  discountCode?: string;
  imageUrl?: string;
  expiryDate?: string;
}

export type Tab = 'dashboard' | 'orders' | 'customers' | 'invoices' | 'settings' | 'offers';
