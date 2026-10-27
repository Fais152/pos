import "server-only";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import {
  categories,
  ingredients,
  orderItems,
  orders,
  products,
  stockMovements,
  users,
} from "@/db/schema";
import {
  buildDailyReport,
  buildMonthlyReport,
  type DailyReportData,
  type MonthlyReportData,
} from "@/lib/report";
import {
  categoryToDto,
  ingredientToDto,
  movementToDto,
  orderItemToDto,
  orderToDto,
  productToDto,
  userToDto,
} from "./serializers";
import { getSettings } from "./settings";

async function loadData() {
  const [categoryRows, productRows, ingredientRows, orderRows] = await Promise.all([
    db.select().from(categories),
    db.select().from(products),
    db.select().from(ingredients),
    db.select().from(orders).orderBy(desc(orders.createdAt)),
  ]);

  const [itemRows, movementRows, userRows] = await Promise.all([
    db.select().from(orderItems),
    db.select().from(stockMovements),
    db.select().from(users),
  ]);

  return {
    categories: categoryRows.map(categoryToDto),
    products: productRows.map(productToDto),
    ingredients: ingredientRows.map(ingredientToDto),
    orders: orderRows.map(orderToDto),
    orderItems: itemRows.map(orderItemToDto),
    movements: movementRows.map(movementToDto),
    users: userRows.map(userToDto),
  };
}

export async function getDailyReport(dateKey: string): Promise<DailyReportData> {
  const data = await loadData();
  return buildDailyReport(
    dateKey,
    data.orders,
    data.orderItems,
    data.ingredients,
    data.movements,
    data.users,
    data.products,
  );
}

export async function getMonthlyReport(monthKey: string): Promise<MonthlyReportData> {
  const data = await loadData();
  return buildMonthlyReport(
    monthKey,
    data.orders,
    data.orderItems,
    data.ingredients,
    data.movements,
    data.users,
    data.categories,
    data.products,
  );
}

export async function getReportSettings() {
  return getSettings();
}
