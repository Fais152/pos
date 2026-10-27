import "server-only";
import { NextResponse } from "next/server";
import type { Role, User } from "@/lib/types";
import { getSessionUser } from "./auth";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function jsonError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, details: error.details ?? null },
      { status: error.status },
    );
  }
  console.error(error instanceof Error ? error.stack : error);
  return NextResponse.json({ error: "Terjadi kesalahan pada server." }, { status: 500 });
}

export async function requireApiUser(roles?: Role[]): Promise<User> {
  const user = await getSessionUser({ refreshCookie: true });
  if (!user) {
    throw new ApiError(401, "Sesi tidak valid atau sudah berakhir.");
  }
  if (roles && !roles.includes(user.role)) {
    throw new ApiError(403, "Anda tidak memiliki akses ke aksi ini.");
  }
  return user;
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const host = request.headers.get("host");
  try {
    if (!host || new URL(origin).host !== host) {
      throw new ApiError(403, "Permintaan lintas origin ditolak.");
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(403, "Origin permintaan tidak valid.");
  }
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiError(400, "Payload JSON tidak valid.");
  }
}
