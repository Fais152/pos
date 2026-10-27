import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { ingredients, stockMovements } from "@/db/schema";
import { assertSameOrigin, ApiError, jsonError, readJson, requireApiUser } from "@/server/http";
import { ingredientToDto } from "@/server/serializers";

export const runtime = "nodejs";

const schema = z.object({
  ingredientId: z.string().min(1),
  qty: z.number().positive().max(1_000_000),
  unitCost: z.number().min(0).max(1_000_000_000).optional(),
  note: z.string().trim().max(300).optional(),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser(["owner"]);
    const input = schema.parse(await readJson(request));

    const result = await db.transaction(async (tx) => {
      const [existing] = await tx.select().from(ingredients).where(eq(ingredients.id, input.ingredientId)).limit(1);
      if (!existing) throw new ApiError(404, "Bahan baku tidak ditemukan.");

      const unitCost = input.unitCost ?? Number(existing.costPerUnit);
      const [record] = await tx
        .update(ingredients)
        .set({
          currentStock: sql`${ingredients.currentStock} + ${input.qty}`,
          costPerUnit: unitCost,
          updatedAt: new Date(),
        })
        .where(eq(ingredients.id, input.ingredientId))
        .returning();

      await tx.insert(stockMovements).values({
        ingredientId: input.ingredientId,
        type: "purchase",
        qtyChange: input.qty,
        unitCost,
        note: input.note || "Restock pembelian bahan",
        createdBy: user.id,
      });

      return record;
    });

    return NextResponse.json({ ingredient: ingredientToDto(result) });
  } catch (error) {
    if (error instanceof z.ZodError) return jsonError(new ApiError(400, "Data restock tidak valid."));
    return jsonError(error);
  }
}
