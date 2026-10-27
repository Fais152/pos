import { randomUUID } from "node:crypto";
import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("user_role", ["owner", "kasir"]);
export const unitEnum = pgEnum("ingredient_unit", ["g", "ml", "pcs"]);
export const movementTypeEnum = pgEnum("stock_movement_type", [
  "purchase",
  "sale",
  "void_return",
  "adjustment",
  "waste",
]);
export const orderTypeEnum = pgEnum("order_type", ["dine_in", "takeaway"]);
export const orderStatusEnum = pgEnum("order_status", ["paid", "void"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "qris", "transfer"]);

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID());

const createdAt = () =>
  timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow();

export const users = pgTable(
  "users",
  {
    id: id(),
    name: text("name").notNull(),
    username: text("username").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: roleEnum("role").notNull().default("kasir"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("users_username_unique").on(table.username)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: id(),
    tokenHash: text("token_hash").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true, mode: "date" }).notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("sessions_token_hash_unique").on(table.tokenHash),
    index("sessions_user_id_idx").on(table.userId),
  ],
);

export const categories = pgTable("categories", {
  id: id(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const products = pgTable(
  "products",
  {
    id: id(),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    price: integer("price").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("products_category_id_idx").on(table.categoryId)],
);

export const ingredients = pgTable("ingredients", {
  id: id(),
  name: text("name").notNull(),
  unit: unitEnum("unit").notNull(),
  currentStock: numeric("current_stock", { precision: 14, scale: 3, mode: "number" })
    .notNull()
    .default(0),
  minStock: numeric("min_stock", { precision: 14, scale: 3, mode: "number" })
    .notNull()
    .default(0),
  costPerUnit: numeric("cost_per_unit", { precision: 14, scale: 2, mode: "number" })
    .notNull()
    .default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const recipes = pgTable(
  "recipes",
  {
    id: id(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    ingredientId: text("ingredient_id")
      .notNull()
      .references(() => ingredients.id, { onDelete: "restrict" }),
    qtyPerPortion: numeric("qty_per_portion", { precision: 14, scale: 3, mode: "number" })
      .notNull(),
  },
  (table) => [
    uniqueIndex("recipes_product_ingredient_unique").on(table.productId, table.ingredientId),
    index("recipes_ingredient_id_idx").on(table.ingredientId),
  ],
);

export const orders = pgTable(
  "orders",
  {
    id: id(),
    orderNo: text("order_no").notNull(),
    orderType: orderTypeEnum("order_type").notNull(),
    tableLabel: text("table_label"),
    status: orderStatusEnum("status").notNull().default("paid"),
    subtotal: integer("subtotal").notNull(),
    discount: integer("discount").notNull().default(0),
    tax: integer("tax").notNull().default(0),
    serviceCharge: integer("service_charge").notNull().default(0),
    total: integer("total").notNull(),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    cashReceived: integer("cash_received").notNull().default(0),
    changeAmount: integer("change_amount").notNull().default(0),
    cashierId: text("cashier_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: createdAt(),
    voidedAt: timestamp("voided_at", { withTimezone: true, mode: "date" }),
    voidReason: text("void_reason"),
    voidedBy: text("voided_by").references(() => users.id, { onDelete: "restrict" }),
  },
  (table) => [
    uniqueIndex("orders_order_no_unique").on(table.orderNo),
    index("orders_created_at_idx").on(table.createdAt),
    index("orders_status_created_at_idx").on(table.status, table.createdAt),
    index("orders_cashier_id_idx").on(table.cashierId),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: id(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    productName: text("product_name").notNull(),
    unitPrice: integer("unit_price").notNull(),
    qty: integer("qty").notNull(),
    lineTotal: integer("line_total").notNull(),
    note: text("note"),
    unitCogs: integer("unit_cogs").notNull().default(0),
  },
  (table) => [
    index("order_items_order_id_idx").on(table.orderId),
    index("order_items_product_id_idx").on(table.productId),
  ],
);

export const stockMovements = pgTable(
  "stock_movements",
  {
    id: id(),
    ingredientId: text("ingredient_id")
      .notNull()
      .references(() => ingredients.id, { onDelete: "restrict" }),
    type: movementTypeEnum("type").notNull(),
    qtyChange: numeric("qty_change", { precision: 14, scale: 3, mode: "number" }).notNull(),
    unitCost: numeric("unit_cost", { precision: 14, scale: 2, mode: "number" })
      .notNull()
      .default(0),
    note: text("note").notNull().default(""),
    orderId: text("order_id").references(() => orders.id, { onDelete: "set null" }),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: createdAt(),
  },
  (table) => [
    index("stock_movements_ingredient_created_idx").on(table.ingredientId, table.createdAt),
    index("stock_movements_order_id_idx").on(table.orderId),
  ],
);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
});

export const orderSequences = pgTable("order_sequences", {
  day: text("day").primaryKey(),
  lastSeq: integer("last_seq").notNull().default(0),
});
