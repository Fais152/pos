import { gzipSync } from "node:zlib";
import { and, desc, eq, gte, inArray, lt } from "drizzle-orm";
import { db } from "@/db";
import {
  categories,
  ingredients,
  orderItems,
  orders,
  products,
  recipes,
  stockMovements,
  users,
} from "@/db/schema";
import { getSessionUser } from "@/server/auth";
import { witaDateKey, witaDayRange } from "@/server/date";
import {
  categoryToDto,
  ingredientToDto,
  movementToDto,
  orderItemToDto,
  orderToDto,
  productToDto,
  recipeToDto,
  userToDto,
} from "@/server/serializers";
import { getSettings } from "@/server/settings";
import type { DatabaseState } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const emptyState = (settings: DatabaseState["settings"]): DatabaseState => ({
  users: [],
  categories: [],
  products: [],
  ingredients: [],
  recipes: [],
  orders: [],
  orderItems: [],
  stockMovements: [],
  settings,
});

function jsonResponse(payload: DatabaseState, request: Request) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    Vary: "Accept-Encoding",
  };

  if (request.headers.get("accept-encoding")?.includes("gzip")) {
    const compressed = gzipSync(JSON.stringify(payload));
    return new Response(compressed, {
      headers: {
        ...headers,
        "Content-Encoding": "gzip",
        "Content-Length": String(compressed.byteLength),
      },
    });
  }

  return new Response(JSON.stringify(payload), { headers });
}

export async function GET(request: Request) {
  const user = await getSessionUser({ refreshCookie: true });
  const settings = await getSettings();

  if (!user) {
    return jsonResponse(emptyState(settings), request);
  }

  const [categoryRows, productRows, ingredientRows, recipeRows] = await Promise.all([
    db.select().from(categories).orderBy(categories.sortOrder, categories.name),
    db.select().from(products).orderBy(products.name),
    db.select().from(ingredients).orderBy(ingredients.name),
    db.select().from(recipes),
  ]);

  let orderRows: Array<typeof orders.$inferSelect> = [];
  let itemRows: Array<typeof orderItems.$inferSelect> = [];
  let movementRows: Array<typeof stockMovements.$inferSelect> = [];
  let userRows: Array<typeof users.$inferSelect> = [];

  if (user.role === "owner") {
    [orderRows, itemRows, movementRows, userRows] = await Promise.all([
      db.select().from(orders).orderBy(desc(orders.createdAt)),
      db.select().from(orderItems),
      db.select().from(stockMovements).orderBy(desc(stockMovements.createdAt)),
      db.select().from(users).orderBy(users.name),
    ]);
  } else {
    const { start, end } = witaDayRange(witaDateKey());
    orderRows = await db
      .select()
      .from(orders)
      .where(and(eq(orders.cashierId, user.id), gte(orders.createdAt, start), lt(orders.createdAt, end)))
      .orderBy(desc(orders.createdAt));

    if (orderRows.length) {
      itemRows = await db
        .select()
        .from(orderItems)
        .where(inArray(orderItems.orderId, orderRows.map((order) => order.id)));
    }

    const [self] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    userRows = self ? [self] : [];
  }

  const payload: DatabaseState = {
    users: userRows.map(userToDto),
    categories: categoryRows.map(categoryToDto),
    products: productRows.map(productToDto),
    ingredients: ingredientRows.map(ingredientToDto),
    recipes: recipeRows.map(recipeToDto),
    orders: orderRows.map(orderToDto),
    orderItems: itemRows.map(orderItemToDto),
    stockMovements: movementRows.map(movementToDto),
    settings,
  };

  return jsonResponse(payload, request);
}
