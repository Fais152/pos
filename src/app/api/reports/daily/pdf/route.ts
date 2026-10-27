import { ApiError, jsonError, requireApiUser } from "@/server/http";
import { isValidDateKey, witaDateKey } from "@/server/date";
import { getDailyReport, getReportSettings } from "@/server/reports";
import { renderDailyPdf } from "@/server/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireApiUser(["owner"]);
    const date = new URL(request.url).searchParams.get("date") ?? witaDateKey();
    if (!isValidDateKey(date)) throw new ApiError(400, "Tanggal tidak valid.");

    const [report, settings] = await Promise.all([getDailyReport(date), getReportSettings()]);
    const buffer = await renderDailyPdf(report, settings);

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="rekap-harian-${date}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}


