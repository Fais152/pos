import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { hashPassword } from "@/server/auth";
import { assertSameOrigin, ApiError, jsonError, readJson, requireApiUser } from "@/server/http";
import { userToDto } from "@/server/serializers";

export const runtime = "nodejs";

const schema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(120),
  username: z.string().trim().min(3).max(80).regex(/^[a-zA-Z0-9._-]+$/),
  password: z.string().min(4).max(200).optional(),
  isActive: z.boolean().default(true),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await requireApiUser(["owner"]);
    const input = schema.parse(await readJson(request));
    const username = input.username.toLowerCase();

    const [duplicate] = await db
      .select({ id: users.id })
      .from(users)
      .where(input.id ? and(eq(users.username, username), ne(users.id, input.id)) : eq(users.username, username))
      .limit(1);
    if (duplicate) throw new ApiError(409, "Username sudah dipakai.");

    const [existing] = input.id
      ? await db.select().from(users).where(eq(users.id, input.id)).limit(1)
      : [];

    if (!existing) {
      if (!input.password) throw new ApiError(400, "Password wajib diisi untuk akun baru.");
      const [record] = await db
        .insert(users)
        .values({
          ...(input.id ? { id: input.id } : {}),
          name: input.name,
          username,
          passwordHash: await hashPassword(input.password),
          role: "kasir",
          isActive: input.isActive,
        })
        .returning();
      return NextResponse.json({ user: userToDto(record) });
    }

    if (existing.role === "owner" && !input.isActive) {
      throw new ApiError(400, "Akun owner tidak dapat dinonaktifkan.");
    }

    const [record] = await db
      .update(users)
      .set({
        name: input.name,
        username,
        isActive: input.isActive,
        ...(input.password ? { passwordHash: await hashPassword(input.password) } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id))
      .returning();

    if (input.password || !input.isActive) {
      await db.delete(sessions).where(eq(sessions.userId, existing.id));
    }

    return NextResponse.json({ user: userToDto(record) });
  } catch (error) {
    if (error instanceof z.ZodError) return jsonError(new ApiError(400, "Data akun tidak valid."));
    return jsonError(error);
  }
}

