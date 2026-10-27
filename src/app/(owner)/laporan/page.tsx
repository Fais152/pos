"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Download,
  FileBarChart2,
  Info,

} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { useMockDb } from "@/hooks/use-mock-db";
import { formatRupiah, getWitaDateString } from "@/lib/format";
import {
  ORDER_TYPE_LABELS,
  buildDailyReport,
  buildMonthlyReport,
  labelOfKey,
  monthLabel,
  type BreakdownItem,
  type DailyReportData,
  type MonthlyReportData,
} from "@/lib/report";
import { formatInTimeZone } from "date-fns-tz";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 mt-5 border-b border-neutral-300 pb-1 text-[13px] font-bold uppercase tracking-wide text-neutral-800">
      {children}
    </h3>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-neutral-200 px-2.5 py-2">
      <p className="text-[10px] uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-0.5 text-sm font-bold tabular-nums text-neutral-900">{value}</p>
    </div>
  );
}

function MiniTable({
  headers,
  rows,
  alignRight = [],
}: {
  headers: string[];
  rows: Array<Array<string | number>>;
  alignRight?: number[];
}) {
  return (
    <table className="w-full text-[11px]">
      <thead>
        <tr className="border-b border-neutral-300 text-left text-neutral-500">
          {headers.map((h, i) => (
            <th
              key={h}
              className={cn("py-1 font-semibold", alignRight.includes(i) && "text-right")}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri} className="border-b border-neutral-100">
            {row.map((cell, ci) => (
              <td
                key={ci}
                className={cn("py-1", alignRight.includes(ci) && "text-right tabular-nums")}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function BreakdownTable({ items }: { items: BreakdownItem[] }) {
  return (
    <MiniTable
      headers={["Keterangan", "Transaksi", "Nominal", "%"]}
      alignRight={[1, 2, 3]}
      rows={items.map((i) => [i.label, i.count, formatRupiah(i.total), `${i.percent ?? 0}%`])}
    />
  );
}

function ReportHeader({
  cafeName,
  address,
  phone,
  title,
  subtitle,
}: {
  cafeName: string;
  address: string;
  phone: string;
  title: string;
  subtitle: string;
}) {
  const created = formatInTimeZone(new Date(), "Asia/Makassar", "d MMM yyyy, HH:mm", {
    locale: localeId,
  });
  return (
    <div className="mb-4 border-b-2 border-neutral-800 pb-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-bold uppercase tracking-wide">{cafeName}</p>
          <p className="text-[11px] text-neutral-600">{address}</p>
          <p className="text-[11px] text-neutral-600">Telp. {phone}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold uppercase">{title}</p>
          <p className="text-[11px] text-neutral-600">{subtitle}</p>
          <p className="text-[10px] text-neutral-500">Dibuat: {created} WITA</p>
        </div>
      </div>
    </div>
  );
}

function DailyPreview({
  report,
  cafeName,
  address,
  phone,
}: {
  report: DailyReportData;
  cafeName: string;
  address: string;
  phone: string;
}) {
  const dateTitle = formatInTimeZone(
    new Date(`${report.date}T04:00:00Z`),
    "Asia/Makassar",
    "EEEE, d MMMM yyyy",
    { locale: localeId }
  );
  const activeHours = report.hourly.filter((h) => h.hour >= 6 && h.revenue > 0);
  const maxHour = Math.max(1, ...activeHours.map((h) => h.revenue));
  const previousDate = new Date(`${report.date}T04:00:00Z`);
  previousDate.setUTCDate(previousDate.getUTCDate() - 1);
  const yesterday = previousDate.toISOString().slice(0, 10);

  return (
    <div>
      <ReportHeader
        cafeName={cafeName}
        address={address}
        phone={phone}
        title="Rekap Penjualan Harian"
        subtitle={dateTitle}
      />

      <SectionTitle>Ringkasan</SectionTitle>
      <div className="grid grid-cols-3 gap-2">
        <Metric label="Total Omzet" value={formatRupiah(report.summary.revenue)} />
        <Metric label="Transaksi Lunas" value={String(report.summary.orderCount)} />
        <Metric label="Rata-rata / Transaksi" value={formatRupiah(report.summary.avgPerOrder)} />
        <Metric label="Item Terjual" value={String(report.summary.itemCount)} />
        <Metric label="Transaksi Void" value={String(report.summary.voidCount)} />
        <Metric label="Estimasi Laba Kotor" value={formatRupiah(report.summary.grossProfit)} />
      </div>
      <p className="mt-1.5 text-[10px] text-neutral-500">
        Laba kotor adalah estimasi (omzet item − HPP resep), bukan laporan keuangan resmi.
        Omzet tidak termasuk transaksi void.
      </p>

      <div className="grid grid-cols-2 gap-5">
        <div>
          <SectionTitle>Metode Bayar</SectionTitle>
          <BreakdownTable items={report.payments} />
        </div>
        <div>
          <SectionTitle>Tipe Pesanan</SectionTitle>
          <BreakdownTable items={report.orderTypes} />
        </div>
      </div>

      <SectionTitle>Menu Terjual</SectionTitle>
      {report.topProducts.length === 0 ? (
        <p className="py-2 text-[11px] text-neutral-500">Belum ada menu terjual.</p>
      ) : (
        <MiniTable
          headers={["Menu", "Qty", "Subtotal"]}
          alignRight={[1, 2]}
          rows={report.topProducts.map((p) => [p.productName, p.qty, formatRupiah(p.revenue)])}
        />
      )}

      <SectionTitle>Penjualan per Jam</SectionTitle>
      {activeHours.length === 0 ? (
        <p className="py-2 text-[11px] text-neutral-500">Belum ada penjualan.</p>
      ) : (
        <div className="space-y-1">
          {activeHours.map((h) => (
            <div key={h.hour} className="flex items-center gap-2 text-[10px]">
              <span className="w-10 shrink-0 text-neutral-500">{h.label}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-sm bg-neutral-100">
                <div
                  className="h-full rounded-sm bg-neutral-700"
                  style={{ width: `${(h.revenue / maxHour) * 100}%` }}
                />
              </div>
              <span className="w-20 shrink-0 text-right tabular-nums">
                {formatRupiah(h.revenue)}
              </span>
              <span className="w-14 shrink-0 text-right text-neutral-500">
                {h.transactions} trx
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-5">
        <div>
          <SectionTitle>Per Kasir</SectionTitle>
          {report.cashiers.length === 0 ? (
            <p className="py-2 text-[11px] text-neutral-500">Tidak ada transaksi.</p>
          ) : (
            <MiniTable
              headers={["Kasir", "Trx", "Omzet"]}
              alignRight={[1, 2]}
              rows={report.cashiers.map((c) => [c.label, c.count, formatRupiah(c.total)])}
            />
          )}
        </div>
        <div>
          <SectionTitle>Catatan Stok</SectionTitle>
          <p className="text-[10px] font-semibold text-neutral-600">Bahan di bawah minimum</p>
          {report.lowStock.length === 0 ? (
            <p className="text-[10px] text-neutral-500">Semua bahan aman.</p>
          ) : (
            <ul className="mt-1 space-y-0.5 text-[10px]">
              {report.lowStock.map((i) => (
                <li key={i.id}>
                  {i.name}: {Math.round(i.currentStock)} {i.unit} (min. {i.minStock} {i.unit})
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-[10px] font-semibold text-neutral-600">Bahan terbuang hari ini</p>
          {report.waste.length === 0 ? (
            <p className="text-[10px] text-neutral-500">Tidak ada catatan bahan terbuang.</p>
          ) : (
            <ul className="mt-1 space-y-0.5 text-[10px]">
              {report.waste.map((w, idx) => (
                <li key={idx}>
                  {w.ingredientName}: {Math.round(w.qty)} {w.unit} · {formatRupiah(w.value)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <SectionTitle>Insight</SectionTitle>
      {report.insights.length === 0 ? (
        <p className="py-2 text-[11px] text-neutral-500">Belum ada insight untuk hari ini.</p>
      ) : (
        <ul className="list-disc space-y-0.5 pl-4 text-[11px]">
          {report.insights.map((insight, idx) => (
            <li key={idx}>{insight}</li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-[9px] text-neutral-400">
        Perbandingan rata-rata hari yang sama menggunakan 4 minggu sebelumnya. Tanggal
        pembanding: {labelOfKey(yesterday, "d MMM yyyy")}.
      </p>
    </div>
  );
}

function MonthlyPreview({
  report,
  cafeName,
  address,
  phone,
}: {
  report: MonthlyReportData;
  cafeName: string;
  address: string;
  phone: string;
}) {
  const maxDay = Math.max(1, ...report.daily.map((d) => d.revenue));
  const topCategories = report.categories.slice(0, 6);

  return (
    <div>
      <ReportHeader
        cafeName={cafeName}
        address={address}
        phone={phone}
        title="Rekap Penjualan Bulanan"
        subtitle={monthLabel(report.month)}
      />

      <SectionTitle>Ringkasan</SectionTitle>
      <div className="grid grid-cols-3 gap-2">
        <Metric label="Total Omzet" value={formatRupiah(report.summary.revenue)} />
        <Metric label="Transaksi Lunas" value={String(report.summary.orderCount)} />
        <Metric label="Rata-rata per Hari" value={formatRupiah(report.avgPerDay)} />
        <Metric label="Rata-rata / Transaksi" value={formatRupiah(report.summary.avgPerOrder)} />
        <Metric label="Estimasi Laba Kotor" value={formatRupiah(report.summary.grossProfit)} />
        <Metric
          label="vs Bulan Lalu"
          value={
            report.comparisonPercent === null
              ? "-"
              : `${report.comparisonPercent >= 0 ? "+" : ""}${report.comparisonPercent}%`
          }
        />
      </div>
      <p className="mt-1.5 text-[10px] text-neutral-500">
        Omzet bulan lalu: {formatRupiah(report.previousSummary.revenue)} ·{" "}
        {report.previousSummary.orderCount} transaksi.
      </p>

      <SectionTitle>Grafik Tren Omzet Harian</SectionTitle>
      <div className="flex h-32 items-end gap-[3px] border-b border-neutral-300 pb-0">
        {report.daily.map((d) => (
          <div key={d.date} className="group relative flex h-full flex-1 items-end">
            <div
              className="w-full rounded-t-sm bg-neutral-700"
              style={{ height: `${Math.max(2, (d.revenue / maxDay) * 100)}%` }}
              title={`${d.label}: ${formatRupiah(d.revenue)}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-0.5 flex justify-between text-[9px] text-neutral-500">
        <span>{report.daily[0]?.date ?? ""}</span>
        <span>{report.daily[report.daily.length - 1]?.date ?? ""}</span>
      </div>

      <SectionTitle>Rekap per Hari</SectionTitle>
      <div className="grid grid-cols-2 gap-x-6">
        <MiniTable
          headers={["Tgl", "Trx", "Omzet"]}
          alignRight={[1, 2]}
          rows={report.daily
            .slice(0, Math.ceil(report.daily.length / 2))
            .map((d) => [d.label, d.transactions, formatRupiah(d.revenue)])}
        />
        <MiniTable
          headers={["Tgl", "Trx", "Omzet"]}
          alignRight={[1, 2]}
          rows={report.daily
            .slice(Math.ceil(report.daily.length / 2))
            .map((d) => [d.label, d.transactions, formatRupiah(d.revenue)])}
        />
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div>
          <SectionTitle>Hari Terbaik & Terendah</SectionTitle>
          <MiniTable
            headers={["Keterangan", "Tanggal", "Omzet"]}
            alignRight={[2]}
            rows={[
              [
                "Terbaik",
                report.bestDay ? labelOfKey(report.bestDay.date, "d MMM") : "-",
                report.bestDay ? formatRupiah(report.bestDay.revenue) : "-",
              ],
              [
                "Terendah",
                report.worstDay ? labelOfKey(report.worstDay.date, "d MMM") : "-",
                report.worstDay ? formatRupiah(report.worstDay.revenue) : "-",
              ],
            ]}
          />
        </div>
        <div>
          <SectionTitle>Pola Hari dalam Minggu</SectionTitle>
          <MiniTable
            headers={["Hari", "Trx", "Omzet"]}
            alignRight={[1, 2]}
            rows={report.weekday.map((d) => [d.label, d.transactions, formatRupiah(d.revenue)])}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div>
          <SectionTitle>Top 10 Menu</SectionTitle>
          <MiniTable
            headers={["Menu", "Qty", "Omzet"]}
            alignRight={[1, 2]}
            rows={report.topProducts.map((p) => [
              p.productName,
              p.qty,
              formatRupiah(p.revenue),
            ])}
          />
          {report.quietest && (
            <p className="mt-1.5 text-[10px] text-neutral-600">
              Menu paling sepi: {report.quietest.productName} ({report.quietest.qty} porsi).
            </p>
          )}
        </div>
        <div>
          <SectionTitle>Kontribusi Kategori</SectionTitle>
          <MiniTable
            headers={["Kategori", "Qty", "Omzet", "%"]}
            alignRight={[1, 2, 3]}
            rows={topCategories.map((c) => [
              c.label,
              c.count,
              formatRupiah(c.total),
              `${c.percent ?? 0}%`,
            ])}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div>
          <SectionTitle>Metode Bayar</SectionTitle>
          <BreakdownTable items={report.payments} />
        </div>
        <div>
          <SectionTitle>Tipe Pesanan</SectionTitle>
          <BreakdownTable items={report.orderTypes} />
        </div>
      </div>

      <SectionTitle>Per Kasir</SectionTitle>
      <MiniTable
        headers={["Kasir", "Transaksi", "Omzet"]}
        alignRight={[1, 2]}
        rows={report.cashiers.map((c) => [c.label, c.count, formatRupiah(c.total)])}
      />

      <SectionTitle>Ringkasan Stok</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <MiniTable
            headers={["Keterangan", "Nilai"]}
            alignRight={[1]}
            rows={[
              ["Total pembelian bahan", formatRupiah(report.purchasesValue)],
              ["Total bahan terbuang", formatRupiah(report.wasteValue)],
            ]}
          />
        </div>
        <div>
          <p className="mb-1 text-[10px] font-semibold text-neutral-600">
            5 bahan pemakaian terbesar
          </p>
          {report.topUsed.length === 0 ? (
            <p className="text-[10px] text-neutral-500">Belum ada data pemakaian.</p>
          ) : (
            <ul className="space-y-0.5 text-[10px]">
              {report.topUsed.map((u) => (
                <li key={u.name} className="flex justify-between">
                  <span>{u.name}</span>
                  <span className="tabular-nums">
                    {u.qty} {u.unit}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <SectionTitle>Insight</SectionTitle>
      {report.insights.length === 0 ? (
        <p className="py-2 text-[11px] text-neutral-500">Belum ada insight bulan ini.</p>
      ) : (
        <ul className="list-disc space-y-0.5 pl-4 text-[11px]">
          {report.insights.map((insight, idx) => (
            <li key={idx}>{insight}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function LaporanPage() {
  const db = useMockDb();
  const today = getWitaDateString();
  const [mode, setMode] = useState<"daily" | "monthly">("daily");
  const [date, setDate] = useState(today);
  const [month, setMonth] = useState(today.slice(0, 7));

  const dailyReport = useMemo(
    () =>
      buildDailyReport(
        date,
        db.orders,
        db.orderItems,
        db.ingredients,
        db.stockMovements,
        db.users,
        db.products
      ),
    [date, db.orders, db.orderItems, db.ingredients, db.stockMovements, db.users, db.products]
  );

  const monthlyReport = useMemo(
    () =>
      buildMonthlyReport(
        month,
        db.orders,
        db.orderItems,
        db.ingredients,
        db.stockMovements,
        db.users,
        db.categories,
        db.products
      ),
    [
      month,
      db.orders,
      db.orderItems,
      db.ingredients,
      db.stockMovements,
      db.users,
      db.categories,
      db.products,
    ]
  );

  function downloadPdf() {
    const url =
      mode === "daily"
        ? `/api/reports/daily/pdf?date=${encodeURIComponent(date)}`
        : `/api/reports/monthly/pdf?month=${encodeURIComponent(month)}`;
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  function shiftMonth(delta: number) {
    const d = new Date(`${month}-01T04:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() + delta);
    setMonth(d.toISOString().slice(0, 7));
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Laporan & Rekap"
        description="Pratinjau rekap harian dan bulanan, lalu unduh sebagai PDF."
        actions={
          <Button onClick={downloadPdf} className="gap-2">
            <Download className="h-4 w-4" /> Unduh PDF
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-border bg-card p-1">
          <button
            onClick={() => setMode("daily")}
            className={cn(
              "flex min-h-9 items-center gap-1.5 rounded-md px-3.5 text-sm font-medium transition-colors",
              mode === "daily" ? "bg-primary-solid text-primary-foreground" : "text-muted-foreground"
            )}
          >
            <FileBarChart2 className="h-3.5 w-3.5" /> Harian
          </button>
          <button
            onClick={() => setMode("monthly")}
            className={cn(
              "flex min-h-9 items-center gap-1.5 rounded-md px-3.5 text-sm font-medium transition-colors",
              mode === "monthly" ? "bg-primary-solid text-primary-foreground" : "text-muted-foreground"
            )}
          >
            <CalendarDays className="h-3.5 w-3.5" /> Bulanan
          </button>
        </div>

        {mode === "daily" ? (
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value || today)}
            className="h-10 rounded-md border border-input bg-card px-3 text-sm"
          />
        ) : (
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => shiftMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value || today.slice(0, 7))}
              className="h-10 rounded-md border border-input bg-card px-3 text-sm"
            />
            <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => shiftMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5" />
          Angka rekap dihitung dari sumber yang sama dengan dashboard.
        </p>
      </div>

      <div className="rounded-2xl bg-muted/40 p-2 sm:p-5 lg:p-8">
        <div
          id="report-print"
          className="report-sheet mx-auto w-full max-w-[210mm] rounded-xl bg-white p-5 text-neutral-900 shadow-md sm:p-8 print:p-0 print:shadow-none"
        >
          <div className="mb-4 flex items-center justify-between border-b border-neutral-200 pb-3 print:hidden">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-neutral-500">
              <Coffee className="h-3.5 w-3.5" /> Pratinjau A4 · {mode === "daily" ? "Rekap Harian" : "Rekap Bulanan"}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs"
              onClick={downloadPdf}
            >
              <Download className="h-3.5 w-3.5" /> Unduh PDF
            </Button>
          </div>

          {mode === "daily" ? (
            <DailyPreview
              report={dailyReport}
              cafeName={db.settings.cafeName}
              address={db.settings.address}
              phone={db.settings.phone}
            />
          ) : (
            <MonthlyPreview
              report={monthlyReport}
              cafeName={db.settings.cafeName}
              address={db.settings.address}
              phone={db.settings.phone}
            />
          )}

          <div className="mt-6 border-t border-neutral-200 pt-2 text-center text-[9px] text-neutral-400">
            {db.settings.cafeName} · Rekap dibuat otomatis oleh sistem ·{" "}
            {ORDER_TYPE_LABELS.dine_in} & {ORDER_TYPE_LABELS.takeaway}
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        PDF dibuat di server agar angka dan tata letak konsisten di semua perangkat.
      </p>
    </div>
  );
}

