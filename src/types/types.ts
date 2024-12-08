export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description?: string;
  categoryId: string; // Changed category_id to categoryId
  imageUrl?: string; // Changed image_url to imageUrl
  category?: Category;
}

// types.ts

export interface Customer {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
}

// types.ts

export interface Debt {
  id: string;
  saleId: string; // Changed sale_id to saleId
  customerId: string; // Changed customer_id to customerId
  amount: number;
  settled: boolean;
  dueDate: string; // Changed due_date to dueDate
  createdAt: string; // Changed created_at to createdAt
  settledAt?: string;
}
export interface Sale {
  date: string | number | Date;
  id: string;
  customer_id: string;
  customer?: Customer;
  total: number;
  paid_amount: number;
  remaining_amount: number;
  created_at: string;
  payment_method: string;
  status: string;
  items: SaleItem[];
}

export interface SaleItem {
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product?: Product;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface PaymentDetails {
  method: string;
  amount: number;
  customer_id?: string;
}
export interface Payment {
  id: string;
  debtId: string; // Changed debt_id to debtId
  amount: number;
  date: string; // Format de chaîne ISO (ex. "2023-10-05T14:48:00.000Z")
}

export interface DashboardStats {
    total_sales: number;
    total_items_sold: number;
    total_debts: number;
    unique_customers: number;
    recent_sales: Sale[]; // ou le type approprié
}

export interface Enterprise {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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