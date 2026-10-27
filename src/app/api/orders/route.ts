import { NextResponse } from "next/server";
import { and, desc, eq, gte, inArray, lt, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { assertSameOrigin, ApiError, jsonError, readJson, requireApiUser } from "@/server/http";
import { createOrder } from "@/server/orders";
import { isValidDateKey, witaDateKey, witaDayRange } from "@/server/date";
import { orderItemToDto, orderToDto } from "@/server/serializers";
import type { OrderType, PaymentMethod } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  id: z.string().min(1).max(80).optional(),
  orderType: z.enum(["dine_in", "takeaway"]),
  tableLabel: z.string().trim().max(60).nullable().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        qty: z.number().int().min(1).max(99),
        note: z.string().trim().max(200).optional(),
      }),
    )
    .min(1, "Keranjang tidak boleh kosong."),
  discount: z.number().min(0).max(1_000_000_000).default(0),
  clientTotal: z.number().int().min(0).max(1_000_000_000).optional(),
  paymentMethod: z.enum(["cash", "qris", "transfer"]),
  cashReceived: z.number().min(0).max(1_000_000_000).default(0),
});

export async function GET(request: Request) {
  try {
    const user = await requireApiUser();
    const params = new URL(request.url).searchParams;
    const from = params.get("from") ?? witaDateKey();
    const to = params.get("to") ?? from;
    if (!isValidDateKey(from) || !isValidDateKey(to)) {
      throw new ApiError(400, "Format tanggal tidak valid.");
    }

    const start = witaDayRange(user.role === "kasir" ? witaDateKey() : from).start;
    const end = witaDayRange(user.role === "kasir" ? witaDateKey() : to).end;
    const conditions: SQL[] = [gte(orders.createdAt, start), lt(orders.createdAt, end)];

    if (user.role === "kasir") {
      conditions.push(eq(orders.cashierId, user.id));
    } else {
      const cashierId = params.get("cashierId");
      const paymentMethod = params.get("paymentMethod") as PaymentMethod | null;
      const orderType = params.get("orderType") as OrderType | null;
      const status = params.get("status");
      if (cashierId && cashierId !== "all") conditions.push(eq(orders.cashierId, cashierId));
      if (paymentMethod && ["cash", "qris", "transfer"].includes(paymentMethod)) {
        conditions.push(eq(orders.paymentMethod, paymentMethod));
      }
      if (orderType && ["dine_in", "takeaway"].includes(orderType)) {
        conditions.push(eq(orders.orderType, orderType));
      }
      if (status === "paid" || status === "void") conditions.push(eq(orders.status, status));
    }

    const orderRows = await db
      .select()
      .from(orders)
      .where(and(...conditions))
      .orderBy(desc(orders.createdAt))
      .limit(500);

    const itemRows = orderRows.length
      ? await db.select().from(orderItems).where(inArray(orderItems.orderId, orderRows.map((row) => row.id)))
      : [];

    return NextResponse.json(
      {
        orders: orderRows.map(orderToDto),
        orderItems: itemRows.map(orderItemToDto),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser(["owner", "kasir"]);
    const input = createSchema.parse(await readJson(request));
    const result = await createOrder(input, user.id);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(new ApiError(400, error.issues[0]?.message ?? "Data transaksi tidak valid."));
    }
    return jsonError(error);
  }
}
