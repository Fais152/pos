import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { ingredients, recipes, stockMovements } from "@/db/schema";
import { assertSameOrigin, ApiError, jsonError, readJson, requireApiUser } from "@/server/http";
import { ingredientToDto } from "@/server/serializers";

export const runtime = "nodejs";

const schema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(120),
  unit: z.enum(["g", "ml", "pcs"]),
  currentStock: z.number().min(-1_000_000).max(1_000_000_000),
  minStock: z.number().min(0).max(1_000_000_000),
  costPerUnit: z.number().min(0).max(1_000_000_000),
  isActive: z.boolean().default(true),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser(["owner"]);
    const input = schema.parse(await readJson(request));

    const result = await db.transaction(async (tx) => {
      const [existing] = input.id
        ? await tx.select().from(ingredients).where(eq(ingredients.id, input.id)).limit(1)
        : [];

      if (!existing) {
        if (input.currentStock < 0) {
          throw new ApiError(400, "Stok awal tidak boleh negatif.");
        }
        const [record] = await tx
          .insert(ingredients)
          .values({
            ...(input.id ? { id: input.id } : {}),
            name: input.name,
            unit: input.unit,
            currentStock: input.currentStock,
            minStock: input.minStock,
            costPerUnit: input.costPerUnit,
            isActive: input.isActive,
          })
          .returning();

        if (input.currentStock !== 0) {
          await tx.insert(stockMovements).values({
            ingredientId: record.id,
            type: "purchase",
            qtyChange: input.currentStock,
            unitCost: input.costPerUnit,
            note: "Stok awal bahan baru",
            createdBy: user.id,
          });
        }
        return record;
      }

      const [record] = await tx
        .update(ingredients)
        .set({
          name: input.name,
          unit: input.unit,
          minStock: input.minStock,
          costPerUnit: input.costPerUnit,
          isActive: input.isActive,
          updatedAt: new Date(),
        })
        .where(eq(ingredients.id, existing.id))
        .returning();

      if (input.unit !== existing.unit) {
        const [usedInRecipe] = await tx
          .select({ id: recipes.id })
          .from(recipes)
          .where(eq(recipes.ingredientId, existing.id))
          .limit(1);
        const [hasMovement] = await tx
          .select({ id: stockMovements.id })
          .from(stockMovements)
          .where(eq(stockMovements.ingredientId, existing.id))
          .limit(1);
        if (usedInRecipe || hasMovement) {
          throw new ApiError(
            400,
            "Satuan tidak dapat diubah karena bahan sudah dipakai di resep atau punya riwayat stok.",
          );
        }
      }

      return record;
    });

    return NextResponse.json({ ingredient: ingredientToDto(result) });
  } catch (error) {
    if (error instanceof z.ZodError) return jsonError(new ApiError(400, "Data bahan baku tidak valid."));
    return jsonError(error);
  }
}

