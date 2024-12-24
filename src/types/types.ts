export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  enterpriseId: string;
  products?: Product[];
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description?: string;
  categoryId: string;
  imageUrl?: string;
  enterpriseId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  enterpriseId: string;
  createdAt: string;
  updatedAt: string;
  totalPurchases?: number;
  totalDebts?: number;
}

export interface Debt {
  id: string;
  saleId: string;
  customerId: string;
  amount: number;
  settled: boolean;
  dueDate: string;
  createdAt: string;
  settledAt?: string;
  enterpriseId: string;
  customer?: Customer;
  sale?: Sale;
}

export interface Sale {
  id: string;
  customerId: string;
  customer?: Customer;
  total: number;
  paid_amount: number;
  remaining_amount: number;
  created_at: string;
  date: string;
  paymentMethod: 'cash' | 'card' | 'debt';
  status: 'pending' | 'completed' | 'cancelled';
  items: SaleItem[];
  enterpriseId: string;
  dueDate?: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product?: Product;
  enterpriseId: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface PaymentDetails {
  method: 'cash' | 'card' | 'debt';
  amount: number;
  customer_id?: string;
}

export interface Payment {
  id: string;
  debtId: string;
  amount: number;
  date: string;
  enterpriseId: string;
  createdAt: string;
}

export interface DashboardStats {
  totalSales: number;
  totalItemsSold: number;
  totalDebts: number;
  uniqueCustomers: number;
  recentSales: Sale[];
  topProducts: {
    id: string;
    name: string;
    totalQuantity: number;
    totalAmount: number;
  }[];
  salesByPeriod: {
    period: string;
    amount: number;
  }[];
}

export interface Enterprise {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  password?: string;
  subscriptionStatus: 'active' | 'inactive' | 'trial';
  subscriptionEndDate: string;
  createdAt: string;
  updatedAt: string;
  settings?: EnterpriseSettings;
}

export interface EnterpriseSettings {
  defaultPaymentMethod: 'cash' | 'card';
  defaultDueDateDays: number;
  allowNegativeStock: boolean;
  requireCustomerForSale: boolean;
  currency: string;
  timezone: string;
}

export interface EnterpriseUser {
  id: string;
  enterpriseId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  isFirstLogin?: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export type UserRole = 'admin' | 'seller';

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
  error?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface Users {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface EnterpriseRegistrationData {
  enterprise: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  user: RegisterData;
}

export interface Session {
  token: string;
  enterprise: Omit<Enterprise, 'password'>; // Exclude password for security
  expiresAt: number;
}
