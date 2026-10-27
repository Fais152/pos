import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { assertSameOrigin, ApiError, jsonError, readJson, requireApiUser } from "@/server/http";
import { categoryToDto } from "@/server/serializers";

export const runtime = "nodejs";

const schema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(80),
  sortOrder: z.number().int().min(0).max(9999),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await requireApiUser(["owner"]);
    const input = schema.parse(await readJson(request));

    const updated = input.id
      ? await db
          .update(categories)
          .set({ name: input.name, sortOrder: input.sortOrder })
          .where(eq(categories.id, input.id))
          .returning()
      : [];

    const [record] = updated.length
      ? updated
      : await db
          .insert(categories)
          .values({
            ...(input.id ? { id: input.id } : {}),
            name: input.name,
            sortOrder: input.sortOrder,
          })
          .returning();
    return NextResponse.json({ category: categoryToDto(record) });
  } catch (error) {
    if (error instanceof z.ZodError) return jsonError(new ApiError(400, "Data kategori tidak valid."));
    return jsonError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    await requireApiUser(["owner"]);
    const id = new URL(request.url).searchParams.get("id");
    if (!id) throw new ApiError(400, "ID kategori wajib diisi.");

    const [used] = await db.select({ id: products.id }).from(products).where(eq(products.categoryId, id)).limit(1);
    if (used) throw new ApiError(409, "Kategori tidak dapat dihapus karena masih memiliki menu.");

    const [deleted] = await db.delete(categories).where(eq(categories.id, id)).returning();
    if (!deleted) throw new ApiError(404, "Kategori tidak ditemukan.");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
