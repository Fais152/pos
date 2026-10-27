import { NextResponse } from "next/server";
import { logoutSession } from "@/server/auth";
import { assertSameOrigin, jsonError } from "@/server/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await logoutSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
