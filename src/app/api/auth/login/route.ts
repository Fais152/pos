import { NextResponse } from "next/server";
import { z } from "zod";
import { loginWithPassword } from "@/server/auth";
import { ApiError, assertSameOrigin, jsonError, readJson } from "@/server/http";
import { checkRateLimit, clearRateLimit } from "@/server/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  username: z.string().min(1).max(80),
  password: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "local";
    const limit = checkRateLimit(`login:${ip}`);
    if (!limit.allowed) {
      throw new ApiError(429, `Terlalu banyak percobaan. Coba lagi dalam ${limit.retryAfter} detik.`);
    }

    const body = schema.parse(await readJson(request));
    const result = await loginWithPassword(body.username, body.password);
    if (!result.ok) {
      throw new ApiError(401, result.error);
    }

    clearRateLimit(`login:${ip}`);
    return NextResponse.json({ user: result.user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(new ApiError(400, "Data login tidak valid."));
    }
    return jsonError(error);
  }
}
