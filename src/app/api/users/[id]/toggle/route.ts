import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { assertSameOrigin, ApiError, jsonError, requireApiUser } from "@/server/http";
import { userToDto } from "@/server/serializers";

export const runtime = "nodejs";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireApiUser(["owner"]);
    const { id } = await context.params;
    const [existing] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!existing) throw new ApiError(404, "Akun tidak ditemukan.");
    if (existing.role === "owner" || existing.id === actor.id) {
      throw new ApiError(400, "Akun owner tidak dapat dinonaktifkan.");
    }

    const [record] = await db
      .update(users)
      .set({ isActive: !existing.isActive, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!record.isActive) {
      await db.delete(sessions).where(eq(sessions.userId, id));
    }

    return NextResponse.json({ user: userToDto(record) });
  } catch (error) {
    return jsonError(error);
  }
}
