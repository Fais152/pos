import "server-only";
import type { InferSelectModel } from "drizzle-orm";
import type {
  Category,
  Ingredient,
  Order,
  OrderItem,
  Product,
  Recipe,
  StockMovement,
  User,
} from "@/lib/types";
import type {
  categories,
  ingredients,
  orderItems,
  orders,
  products,
  recipes,
  stockMovements,
  users,
} from "@/db/schema";

type UserRow = InferSelectModel<typeof users>;
type CategoryRow = InferSelectModel<typeof categories>;
type ProductRow = InferSelectModel<typeof products>;
type IngredientRow = InferSelectModel<typeof ingredients>;
type RecipeRow = InferSelectModel<typeof recipes>;
type OrderRow = InferSelectModel<typeof orders>;
type OrderItemRow = InferSelectModel<typeof orderItems>;
type MovementRow = InferSelectModel<typeof stockMovements>;

function toIso(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    console.error("Invalid date value in serializer", value, typeof value);
    return new Date(0).toISOString();
  }
  return date.toISOString();
}

function toIsoOrNull(value: Date | string | null) {
  return value == null ? null : toIso(value);
}

export function userToDto(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    role: row.role,
    isActive: row.isActive,
    createdAt: toIso(row.createdAt),
  };
}

export function categoryToDto(row: CategoryRow): Category {
  return { id: row.id, name: row.name, sortOrder: row.sortOrder };
}

export function productToDto(row: ProductRow): Product {
  return {
    id: row.id,
    categoryId: row.categoryId,
    name: row.name,
    price: row.price,
    isActive: row.isActive,
    createdAt: toIso(row.createdAt),
  };
}

export function ingredientToDto(row: IngredientRow): Ingredient {
  return {
    id: row.id,
    name: row.name,
    unit: row.unit,
    currentStock: Number(row.currentStock),
    minStock: Number(row.minStock),
    costPerUnit: Number(row.costPerUnit),
    isActive: row.isActive,
  };
}

export function recipeToDto(row: RecipeRow): Recipe {
  return {
    id: row.id,
    productId: row.productId,
    ingredientId: row.ingredientId,
    qtyPerPortion: Number(row.qtyPerPortion),
  };
}

export function orderToDto(row: OrderRow): Order {
  return {
    id: row.id,
    orderNo: row.orderNo,
    orderType: row.orderType,
    tableLabel: row.tableLabel,
    status: row.status,
    subtotal: row.subtotal,
    discount: row.discount,
    tax: row.tax,
    serviceCharge: row.serviceCharge,
    total: row.total,
    paymentMethod: row.paymentMethod,
    cashReceived: row.cashReceived,
    changeAmount: row.changeAmount,
    cashierId: row.cashierId,
    createdAt: toIso(row.createdAt),
    voidedAt: toIsoOrNull(row.voidedAt),
    voidReason: row.voidReason,
    voidedBy: row.voidedBy,
  };
}

export function orderItemToDto(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    orderId: row.orderId,
    productId: row.productId,
    productName: row.productName,
    unitPrice: row.unitPrice,
    qty: row.qty,
    lineTotal: row.lineTotal,
    note: row.note ?? "",
    unitCogs: row.unitCogs,
  };
}

export function movementToDto(row: MovementRow): StockMovement {
  return {
    id: row.id,
    ingredientId: row.ingredientId,
    type: row.type,
    qtyChange: Number(row.qtyChange),
    unitCost: Number(row.unitCost),
    note: row.note,
    orderId: row.orderId,
    createdBy: row.createdBy,
    createdAt: toIso(row.createdAt),
  };
}

