import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { assertSameOrigin, ApiError, jsonError, requireApiUser } from "@/server/http";
import { productToDto } from "@/server/serializers";

export const runtime = "nodejs";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    await requireApiUser(["owner"]);
    const { id } = await context.params;
    const [current] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!current) throw new ApiError(404, "Menu tidak ditemukan.");

    const [record] = await db
      .update(products)
      .set({ isActive: !current.isActive, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();

    return NextResponse.json({ product: productToDto(record) });
  } catch (error) {
    return jsonError(error);
  }
}
