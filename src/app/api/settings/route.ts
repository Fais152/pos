import { NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, ApiError, jsonError, readJson, requireApiUser } from "@/server/http";
import { getSettings, saveSettings } from "@/server/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  cafeName: z.string().trim().min(1).max(120),
  address: z.string().trim().max(300),
  phone: z.string().trim().max(40),
  taxPercent: z.number().min(0).max(100),
  servicePercent: z.number().min(0).max(100),
  receiptFooter: z.string().trim().max(500),
  timezone: z.string().trim().min(1).max(80),
});

export async function GET() {
  try {
    await requireApiUser();
    const settings = await getSettings();
    return NextResponse.json({ settings }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
    await requireApiUser(["owner"]);
    const input = schema.parse(await readJson(request));
    await saveSettings(input);
    return NextResponse.json({ settings: await getSettings() });
  } catch (error) {
    if (error instanceof z.ZodError) return jsonError(new ApiError(400, "Pengaturan tidak valid."));
    return jsonError(error);
  }
}
