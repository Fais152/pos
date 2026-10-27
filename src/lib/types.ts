export type Role = 'owner' | 'kasir';

export interface User {
  id: string;
  name: string;
  username: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  isActive: boolean;
  createdAt: string;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: 'g' | 'ml' | 'pcs';
  currentStock: number;
  minStock: number;
  costPerUnit: number;
  isActive: boolean;
}

export interface Recipe {
  id: string;
  productId: string;
  ingredientId: string;
  qtyPerPortion: number;
}

export type StockMovementType = 'purchase' | 'sale' | 'void_return' | 'adjustment' | 'waste';

export interface StockMovement {
  id: string;
  ingredientId: string;
  type: StockMovementType;
  qtyChange: number;
  unitCost: number;
  note: string;
  orderId?: string | null;
  createdBy: string;
  createdAt: string;
}

export type OrderType = 'dine_in' | 'takeaway';
export type OrderStatus = 'paid' | 'void';
export type PaymentMethod = 'cash' | 'qris' | 'transfer';

export interface Order {
  id: string;
  orderNo: string;
  orderType: OrderType;
  tableLabel?: string | null;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  tax: number;
  serviceCharge: number;
  total: number;
  paymentMethod: PaymentMethod;
  cashReceived: number;
  changeAmount: number;
  cashierId: string;
  createdAt: string;
  voidedAt?: string | null;
  voidReason?: string | null;
  voidedBy?: string | null;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  unitPrice: number;
  qty: number;
  lineTotal: number;
  note?: string;
  unitCogs: number;
}

export interface Settings {
  cafeName: string;
  address: string;
  phone: string;
  taxPercent: number;
  servicePercent: number;
  receiptFooter: string;
  timezone: string;
}

export interface DatabaseState {
  users: User[];
  categories: Category[];
  products: Product[];
  ingredients: Ingredient[];
  recipes: Recipe[];
  orders: Order[];
  orderItems: OrderItem[];
  stockMovements: StockMovement[];
  settings: Settings;
}
