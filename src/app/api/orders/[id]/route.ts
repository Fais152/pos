import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { ApiError, jsonError, requireApiUser } from "@/server/http";
import { witaDateKey, witaDayRange } from "@/server/date";
import { orderItemToDto, orderToDto } from "@/server/serializers";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser();
    const { id } = await context.params;
    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order) throw new ApiError(404, "Transaksi tidak ditemukan.");

    if (user.role === "kasir") {
      const { start, end } = witaDayRange(witaDateKey());
      const ownToday =
        order.cashierId === user.id && order.createdAt >= start && order.createdAt < end;
      if (!ownToday) throw new ApiError(403, "Anda hanya dapat melihat transaksi Anda hari ini.");
    }

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    return NextResponse.json(
      { order: orderToDto(order), items: items.map(orderItemToDto) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return jsonError(error);
  }
}
