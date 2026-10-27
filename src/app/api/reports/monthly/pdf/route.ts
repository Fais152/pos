import { ApiError, jsonError, requireApiUser } from "@/server/http";
import { isValidMonthKey, witaDateKey } from "@/server/date";
import { getMonthlyReport, getReportSettings } from "@/server/reports";
import { renderMonthlyPdf } from "@/server/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireApiUser(["owner"]);
    const month = new URL(request.url).searchParams.get("month") ?? witaDateKey().slice(0, 7);
    if (!isValidMonthKey(month)) throw new ApiError(400, "Bulan tidak valid.");

    const [report, settings] = await Promise.all([getMonthlyReport(month), getReportSettings()]);
    const buffer = await renderMonthlyPdf(report, settings);

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="rekap-bulanan-${month}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
