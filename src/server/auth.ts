import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import type { Role, User } from "@/lib/types";

export const SESSION_COOKIE = "pos_session";
export const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;
const TOUCH_INTERVAL_MS = 5 * 60 * 1000;

export type DbUser = typeof users.$inferSelect;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function serializeUser(user: DbUser): User {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    isActive: user.isActive,
    createdAt: new Date(user.createdAt).toISOString(),
  };
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function loginWithPassword(username: string, password: string) {
  const normalized = username.trim().toLowerCase();
  if (!normalized || !password) {
    return { ok: false as const, error: "Username dan password wajib diisi." };
  }

  const [user] = await db.select().from(users).where(eq(users.username, normalized)).limit(1);

  if (!user) {
    await bcrypt.compare(password, "$2a$12$C6UzMDM.H6dfI/f/IKcEe.5h2cM5rF0cG5p8y3wQ0n1kQ2rZ3s4u6");
    return { ok: false as const, error: "Username atau password salah." };
  }

  if (!user.isActive) {
    return { ok: false as const, error: "Akun ini sedang dinonaktifkan." };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { ok: false as const, error: "Username atau password salah." };
  }

  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  await db.insert(sessions).values({
    tokenHash: hashToken(token),
    userId: user.id,
    expiresAt: new Date(now.getTime() + SESSION_DURATION_MS),
    lastSeenAt: now,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });

  return { ok: true as const, user: serializeUser(user) };
}

export async function getSessionUser(
  options: { refreshCookie?: boolean } = {},
): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const [row] = await db
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (!row) {
    return null;
  }

  if (!row.user.isActive) {
    await db.delete(sessions).where(eq(sessions.id, row.session.id));
    return null;
  }

  const now = new Date();
  if (now.getTime() - row.session.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
    await db
      .update(sessions)
      .set({
        lastSeenAt: now,
        expiresAt: new Date(now.getTime() + SESSION_DURATION_MS),
      })
      .where(eq(sessions.id, row.session.id));

    if (options.refreshCookie) {
      cookieStore.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_DURATION_MS / 1000,
      });
    }
  }

  return serializeUser(row.user);
}

export async function logoutSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function requireRole(roles: Role[]): Promise<User> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  if (!roles.includes(user.role)) {
    redirect(user.role === "owner" ? "/dashboard" : "/kasir");
  }
  return user;
}

export async function requireOwner() {
  return requireRole(["owner"]);
}
