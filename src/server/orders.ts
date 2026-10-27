import "server-only";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  ingredients,
  orderItems,
  orders,
  products,
  recipes,
  stockMovements,
} from "@/db/schema";
import type { Order, OrderItem, OrderType, PaymentMethod } from "@/lib/types";
import { ApiError } from "./http";
import { orderItemToDto, orderToDto } from "./serializers";
import { getSettings } from "./settings";
import { witaDateKey } from "./date";

export interface CreateOrderInput {
  id?: string;
  orderType: OrderType;
  tableLabel?: string | null;
  items: Array<{ productId: string; qty: number; note?: string }>;
  discount: number;
  clientTotal?: number;
  paymentMethod: PaymentMethod;
  cashReceived: number;
}

export async function createOrder(
  input: CreateOrderInput,
  cashierId: string,
): Promise<{ order: Order; items: OrderItem[]; replayed?: boolean }> {
  const settings = await getSettings();
  const now = new Date();
  const dayKey = witaDateKey(now);
  const [year, month, day] = dayKey.split("-");
  const prefix = `INV-${year}${month}${day}`;
  const productIds = Array.from(new Set(input.items.map((item) => item.productId)));

  if (input.id) {
    const [existing] = await db.select().from(orders).where(eq(orders.id, input.id)).limit(1);
    if (existing) {
      if (existing.cashierId !== cashierId) {
        throw new ApiError(409, "Transaksi sudah digunakan oleh pengguna lain.");
      }
      const existingItems = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, existing.id));
      return {
        order: orderToDto(existing),
        items: existingItems.map(orderItemToDto),
        replayed: true,
      };
    }
  }

  const result = await db.transaction(async (tx) => {
    const productRows = await tx
      .select()
      .from(products)
      .where(inArray(products.id, productIds));
    const productMap = new Map(productRows.map((row) => [row.id, row]));

    for (const id of productIds) {
      const product = productMap.get(id);
      if (!product) throw new ApiError(400, "Salah satu menu tidak ditemukan.");
      if (!product.isActive) throw new ApiError(400, `Menu ${product.name} sedang tidak aktif.`);
    }

    const recipeRows = await tx
      .select()
      .from(recipes)
      .where(inArray(recipes.productId, productIds));
    const ingredientIds = Array.from(new Set(recipeRows.map((row) => row.ingredientId)));
    const ingredientRows = ingredientIds.length
      ? await tx.select().from(ingredients).where(inArray(ingredients.id, ingredientIds))
      : [];
    const ingredientMap = new Map(ingredientRows.map((row) => [row.id, row]));
    const recipesByProduct = new Map<string, typeof recipeRows>();
    for (const recipe of recipeRows) {
      const list = recipesByProduct.get(recipe.productId) ?? [];
      list.push(recipe);
      recipesByProduct.set(recipe.productId, list);
    }

    let subtotal = 0;
    const itemDrafts = input.items.map((item) => {
      const product = productMap.get(item.productId)!;
      const unitCogs = Math.round(
        (recipesByProduct.get(product.id) ?? []).reduce((sum, recipe) => {
          const ingredient = ingredientMap.get(recipe.ingredientId);
          return sum + Number(ingredient?.costPerUnit ?? 0) * Number(recipe.qtyPerPortion);
        }, 0),
      );
      const lineTotal = product.price * item.qty;
      subtotal += lineTotal;
      return {
        product,
        qty: item.qty,
        note: item.note?.trim() || "",
        unitCogs,
        lineTotal,
      };
    });

    const discount = Math.max(0, Math.min(subtotal, Math.round(input.discount)));
    const base = Math.max(0, subtotal - discount);
    const tax = Math.round((base * settings.taxPercent) / 100);
    const serviceCharge = Math.round((base * settings.servicePercent) / 100);
    const total = base + tax + serviceCharge;
    if (input.clientTotal !== undefined && Math.round(input.clientTotal) !== total) {
      throw new ApiError(409, "Total pembayaran berubah. Periksa nominal terbaru.", { total });
    }
    const isCash = input.paymentMethod === "cash";
    const cashReceived = isCash ? Math.round(input.cashReceived) : total;

    if (isCash && cashReceived < total) {
      throw new ApiError(400, "Uang diterima kurang dari total pembayaran.");
    }

    const sequenceResult = await tx.execute(sql`
      INSERT INTO order_sequences (day, last_seq)
      VALUES (${dayKey}, 1)
      ON CONFLICT (day) DO UPDATE SET last_seq = order_sequences.last_seq + 1
      RETURNING last_seq
    `);
    const seqRow = (sequenceResult as unknown as Array<{ last_seq: number | string }>)[0];
    const sequence = Number(seqRow?.last_seq ?? 1);
    const orderNo = `${prefix}-${String(sequence).padStart(4, "0")}`;

    const [orderRow] = await tx
      .insert(orders)
      .values({
        ...(input.id ? { id: input.id } : {}),
        orderNo,
        orderType: input.orderType,
        tableLabel: input.orderType === "dine_in" ? input.tableLabel?.trim() || null : null,
        status: "paid",
        subtotal,
        discount,
        tax,
        serviceCharge,
        total,
        paymentMethod: input.paymentMethod,
        cashReceived,
        changeAmount: isCash ? cashReceived - total : 0,
        cashierId,
        createdAt: now,
      })
      .onConflictDoNothing({ target: orders.id })
      .returning();

    if (!orderRow) {
      if (!input.id) throw new ApiError(500, "Transaksi gagal dibuat. Coba lagi.");
      const [existing] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, input.id))
        .limit(1);
      if (!existing) throw new ApiError(409, "Transaksi gagal dibuat. Coba lagi.");
      if (existing.cashierId !== cashierId) {
        throw new ApiError(409, "Transaksi sudah digunakan oleh pengguna lain.");
      }
      const existingItems = await tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, existing.id));
      return {
        order: orderToDto(existing),
        items: existingItems.map(orderItemToDto),
        replayed: true,
      };
    }

    const itemRows = await tx
      .insert(orderItems)
      .values(
        itemDrafts.map((draft) => ({
          orderId: orderRow.id,
          productId: draft.product.id,
          productName: draft.product.name,
          unitPrice: draft.product.price,
          qty: draft.qty,
          lineTotal: draft.lineTotal,
          note: draft.note,
          unitCogs: draft.unitCogs,
        })),
      )
      .returning();

    const needed = new Map<string, number>();
    for (const draft of itemDrafts) {
      for (const recipe of recipesByProduct.get(draft.product.id) ?? []) {
        needed.set(
          recipe.ingredientId,
          (needed.get(recipe.ingredientId) ?? 0) + Number(recipe.qtyPerPortion) * draft.qty,
        );
      }
    }

    for (const [ingredientId, qty] of needed) {
      const ingredient = ingredientMap.get(ingredientId);
      if (!ingredient) continue;
      await tx
        .update(ingredients)
        .set({
          currentStock: sql`${ingredients.currentStock} - ${qty}`,
          updatedAt: now,
        })
        .where(eq(ingredients.id, ingredientId));

      await tx.insert(stockMovements).values({
        ingredientId,
        type: "sale",
        qtyChange: -qty,
        unitCost: Number(ingredient.costPerUnit),
        note: `Penjualan ${orderNo}`,
        orderId: orderRow.id,
        createdBy: cashierId,
        createdAt: now,
      });
    }

    return {
      order: orderToDto(orderRow),
      items: itemRows.map(orderItemToDto),
    };
  });

  return result;
}

export async function voidOrder(orderId: string, reason: string, voidedBy: string): Promise<Order> {
  return db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1).for("update");
    if (!order) throw new ApiError(404, "Transaksi tidak ditemukan.");
    if (order.status === "void") throw new ApiError(409, "Transaksi sudah dibatalkan.");

    const saleMovements = await tx
      .select()
      .from(stockMovements)
      .where(eq(stockMovements.orderId, orderId));

    const restores = saleMovements.filter((movement) => movement.type === "sale");
    const now = new Date();

    for (const movement of restores) {
      const restoreQty = Math.abs(Number(movement.qtyChange));
      await tx
        .update(ingredients)
        .set({
          currentStock: sql`${ingredients.currentStock} + ${restoreQty}`,
          updatedAt: now,
        })
        .where(eq(ingredients.id, movement.ingredientId));

      await tx.insert(stockMovements).values({
        ingredientId: movement.ingredientId,
        type: "void_return",
        qtyChange: restoreQty,
        unitCost: Number(movement.unitCost),
        note: `Void transaksi ${order.orderNo}: ${reason}`,
        orderId,
        createdBy: voidedBy,
        createdAt: now,
      });
    }

    const [updated] = await tx
      .update(orders)
      .set({
        status: "void",
        voidedAt: now,
        voidReason: reason,
        voidedBy,
      })
      .where(eq(orders.id, orderId))
      .returning();

    return orderToDto(updated);
  });
}
