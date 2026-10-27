import { NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, ApiError, jsonError, readJson, requireApiUser } from "@/server/http";
import { voidOrder } from "@/server/orders";

export const runtime = "nodejs";

const schema = z.object({
  reason: z.string().trim().min(3).max(300),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser(["owner"]);
    const { id } = await context.params;
    const input = schema.parse(await readJson(request));
    const order = await voidOrder(id, input.reason, user.id);
    return NextResponse.json({ order });
  } catch (error) {
    if (error instanceof z.ZodError) return jsonError(new ApiError(400, "Alasan void minimal 3 karakter."));
    return jsonError(error);
  }
}
