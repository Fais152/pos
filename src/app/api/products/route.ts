import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { categories, ingredients, products, recipes } from "@/db/schema";
import { assertSameOrigin, ApiError, jsonError, readJson, requireApiUser } from "@/server/http";
import { productToDto } from "@/server/serializers";

export const runtime = "nodejs";

const schema = z.object({
  id: z.string().optional(),
  categoryId: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  price: z.number().int().min(0).max(1_000_000_000),
  isActive: z.boolean().default(true),
  recipes: z
    .array(
      z.object({
        ingredientId: z.string().min(1),
        qtyPerPortion: z.number().positive().max(1_000_000),
      }),
    )
    .optional(),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await requireApiUser(["owner"]);
    const input = schema.parse(await readJson(request));
    const recipeByIngredient = new Map<string, number>();
    for (const recipe of input.recipes ?? []) {
      recipeByIngredient.set(
        recipe.ingredientId,
        (recipeByIngredient.get(recipe.ingredientId) ?? 0) + recipe.qtyPerPortion,
      );
    }
    const recipeIngredientIds = Array.from(recipeByIngredient.keys());

    const result = await db.transaction(async (tx) => {
      const [category] = await tx
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.id, input.categoryId))
        .limit(1);
      if (!category) throw new ApiError(400, "Kategori menu tidak ditemukan.");

      if (recipeIngredientIds.length) {
        const found = await tx
          .select({ id: ingredients.id })
          .from(ingredients)
          .where(inArray(ingredients.id, recipeIngredientIds));
        if (found.length !== recipeIngredientIds.length) {
          throw new ApiError(400, "Salah satu bahan pada resep tidak ditemukan.");
        }
      }

      const updated = input.id
        ? await tx
            .update(products)
            .set({
              categoryId: input.categoryId,
              name: input.name,
              price: input.price,
              isActive: input.isActive,
              updatedAt: new Date(),
            })
            .where(eq(products.id, input.id))
            .returning()
        : [];

      const [record] = updated.length
        ? updated
        : await tx
            .insert(products)
            .values({
              ...(input.id ? { id: input.id } : {}),
              categoryId: input.categoryId,
              name: input.name,
              price: input.price,
              isActive: input.isActive,
            })
            .returning();

      if (input.recipes) {
        await tx.delete(recipes).where(eq(recipes.productId, record.id));
        if (recipeByIngredient.size) {
          await tx.insert(recipes).values(
            Array.from(recipeByIngredient, ([ingredientId, qtyPerPortion]) => ({
              productId: record.id,
              ingredientId,
              qtyPerPortion,
            })),
          );
        }
      }

      return record;
    });

    return NextResponse.json({ product: productToDto(result) });
  } catch (error) {
    if (error instanceof z.ZodError) return jsonError(new ApiError(400, "Data menu tidak valid."));
    return jsonError(error);
  }
}
