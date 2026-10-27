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
  type: z.enum(["adjustment", "waste"]),
  qtyChange: z.number().min(-1_000_000).max(1_000_000).optional(),
  countedQty: z.number().min(0).max(1_000_000_000).optional(),
  note: z.string().trim().min(3).max(300),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser(["owner"]);
    const input = schema.parse(await readJson(request));
    const countedQty = input.countedQty;
    const isOpname = countedQty !== undefined;

    if (isOpname && input.type !== "adjustment") {
      throw new ApiError(400, "Opname hanya untuk penyesuaian.");
    }
    if (!isOpname && input.qtyChange === undefined) {
      throw new ApiError(400, "Jumlah perubahan wajib diisi.");
    }

    const result = await db.transaction(async (tx) => {
      const [existing] = await tx.select().from(ingredients).where(eq(ingredients.id, input.ingredientId)).limit(1);
      if (!existing) throw new ApiError(404, "Bahan baku tidak ditemukan.");

      const qtyChange =
        countedQty !== undefined ? countedQty - Number(existing.currentStock) : input.qtyChange!;
      if (qtyChange === 0) {
        throw new ApiError(
          400,
          isOpname
            ? "Stok sistem sudah sesuai dengan jumlah fisik."
            : "Jumlah perubahan tidak boleh nol.",
        );
      }
      if (input.type === "waste" && qtyChange > 0) {
        throw new ApiError(400, "Jumlah bahan terbuang harus negatif.");
      }

      const [record] = await tx
        .update(ingredients)
        .set({
          currentStock:
            countedQty !== undefined
              ? countedQty
              : sql`${ingredients.currentStock} + ${input.qtyChange}`,
          updatedAt: new Date(),
        })
        .where(eq(ingredients.id, input.ingredientId))
        .returning();

      await tx.insert(stockMovements).values({
        ingredientId: input.ingredientId,
        type: input.type,
        qtyChange,
        unitCost: Number(existing.costPerUnit),
        note: input.note,
        createdBy: user.id,
      });

      return record;
    });

    return NextResponse.json({ ingredient: ingredientToDto(result) });
  } catch (error) {
    if (error instanceof z.ZodError) return jsonError(new ApiError(400, "Data penyesuaian tidak valid."));
    return jsonError(error);
  }
}
