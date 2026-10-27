import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser({ refreshCookie: true });
  return NextResponse.json({ user }, { headers: { "Cache-Control": "no-store" } });
}
