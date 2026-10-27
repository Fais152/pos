import "server-only";
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { formatInTimeZone } from "date-fns-tz";
import { id as localeId } from "date-fns/locale";
import type { DailyReportData, MonthlyReportData } from "@/lib/report";
import type { Settings } from "@/lib/types";
import { formatRupiah } from "@/lib/format";

const TZ = "Asia/Makassar";
const colors = {
  ink: "#1f2937",
  muted: "#6b7280",
  line: "#d1d5db",
  soft: "#f3f4f6",
  primary: "#8b5e34",
  danger: "#b91c1c",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingHorizontal: 32,
    paddingBottom: 32,
    fontSize: 8,
    color: colors.ink,
    fontFamily: "Helvetica",
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cafeName: { fontSize: 15, fontFamily: "Helvetica-Bold" },
  title: { fontSize: 13, fontFamily: "Helvetica-Bold", marginTop: 2 },
  meta: { fontSize: 7.5, color: colors.muted, textAlign: "right", lineHeight: 1.5 },
  headerRule: { borderBottomWidth: 2, borderBottomColor: colors.ink, marginTop: 8, marginBottom: 10 },
  section: { marginTop: 9 },
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    borderBottomWidth: 0.7,
    borderBottomColor: colors.line,
    paddingBottom: 3,
    marginBottom: 5,
  },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  metric: {
    width: "31.8%",
    borderWidth: 0.6,
    borderColor: colors.line,
    borderRadius: 3,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  metricLabel: { fontSize: 6.5, color: colors.muted, textTransform: "uppercase" },
  metricValue: { fontSize: 10, fontFamily: "Helvetica-Bold", marginTop: 2 },
  table: { borderTopWidth: 0.6, borderTopColor: colors.line },
  tr: { flexDirection: "row", borderBottomWidth: 0.6, borderBottomColor: colors.line, minHeight: 14, alignItems: "center" },
  th: { fontSize: 6.8, fontFamily: "Helvetica-Bold", color: colors.muted, textTransform: "uppercase" },
  td: { fontSize: 7.4, paddingVertical: 2.5, paddingRight: 3 },
  right: { textAlign: "right" },
  barRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 2.5 },
  barLabel: { width: 38, fontSize: 6.8, color: colors.muted },
  barTrack: { flex: 1, height: 5, backgroundColor: colors.soft, borderRadius: 2 },
  barFill: { height: 5, backgroundColor: colors.primary, borderRadius: 2 },
  barValue: { width: 64, fontSize: 6.8, textAlign: "right" },
  twoCols: { flexDirection: "row", gap: 14 },
  col: { flex: 1 },
  insight: { fontSize: 7.4, lineHeight: 1.45, marginBottom: 2.5 },
  footer: {
    position: "absolute",
    bottom: 16,
    left: 32,
    right: 32,
    borderTopWidth: 0.6,
    borderTopColor: colors.line,
    paddingTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 6.5,
    color: colors.muted,
  },
});

function nowLabel() {
  return formatInTimeZone(new Date(), TZ, "d MMM yyyy, HH:mm", { locale: localeId });
}

function dateLabel(dateKey: string) {
  return formatInTimeZone(new Date(`${dateKey}T04:00:00Z`), TZ, "EEEE, d MMMM yyyy", {
    locale: localeId,
  });
}

function monthLabel(monthKey: string) {
  return formatInTimeZone(new Date(`${monthKey}-01T04:00:00Z`), TZ, "MMMM yyyy", {
    locale: localeId,
  });
}

function Header({
  settings,
  title,
  subtitle,
}: {
  settings: Settings;
  title: string;
  subtitle: string;
}) {
  return (
    <>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.cafeName}>{settings.cafeName}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={{ fontSize: 8, marginTop: 2, color: colors.muted }}>{subtitle}</Text>
        </View>
        <View>
          <Text style={styles.meta}>{settings.address}</Text>
          <Text style={styles.meta}>{settings.phone}</Text>
          <Text style={styles.meta}>Dibuat: {nowLabel()} WITA</Text>
        </View>
      </View>
      <View style={styles.headerRule} />
    </>
  );
}

function Footer({ cafeName }: { cafeName: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>{cafeName}</Text>
      <Text
        render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} dari ${totalPages}`}
      />
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function Table({
  headers,
  rows,
  widths,
  alignRight = [],
}: {
  headers: string[];
  rows: Array<Array<string | number>>;
  widths: number[];
  alignRight?: number[];
}) {
  return (
    <View style={styles.table}>
      <View style={[styles.tr, { backgroundColor: colors.soft }]}>
        {headers.map((header, index) => (
          <Text
            key={`${header}-${index}`}
            style={[styles.th, { width: `${widths[index]}%` }, alignRight.includes(index) ? styles.right : {}]}
          >
            {header}
          </Text>
        ))}
      </View>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.tr} wrap={false}>
          {row.map((cell, cellIndex) => (
            <Text
              key={cellIndex}
              style={[
                styles.td,
                { width: `${widths[cellIndex]}%` },
                alignRight.includes(cellIndex) ? styles.right : {},
              ]}
            >
              {cell}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

function BreakdownTable({
  rows,
}: {
  rows: Array<{ label: string; count: number; total: number; percent?: number }>;
}) {
  return (
    <Table
      headers={["Keterangan", "Transaksi", "Nominal", "%"]}
      widths={[46, 16, 25, 13]}
      alignRight={[1, 2, 3]}
      rows={rows.map((row) => [row.label, row.count, formatRupiah(row.total), `${row.percent ?? 0}%`])}
    />
  );
}

function Bars({ data }: { data: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...data.map((item) => item.value));
  return (
    <View>
      {data.map((item) => (
        <View key={item.label} style={styles.barRow}>
          <Text style={styles.barLabel}>{item.label}</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${(item.value / max) * 100}%` }]} />
          </View>
          <Text style={styles.barValue}>{formatRupiah(item.value)}</Text>
        </View>
      ))}
    </View>
  );
}

function Insights({ items }: { items: string[] }) {
  if (!items.length) return <Text style={{ fontSize: 7.4, color: colors.muted }}>Belum ada insight.</Text>;
  return (
    <View>
      {items.map((item, index) => (
        <Text key={index} style={styles.insight}>
          • {item}
        </Text>
      ))}
    </View>
  );
}

export function DailyReportDocument({
  report,
  settings,
}: {
  report: DailyReportData;
  settings: Settings;
}) {
  const hourly = report.hourly.filter((hour) => hour.revenue > 0);
  return (
    <Document title={`Rekap Harian ${report.date}`} author={settings.cafeName}>
      <Page size="A4" style={styles.page} wrap>
        <Header
          settings={settings}
          title="Rekap Penjualan Harian"
          subtitle={dateLabel(report.date)}
        />

        <View style={styles.metricGrid}>
          <Metric label="Total Omzet" value={formatRupiah(report.summary.revenue)} />
          <Metric label="Transaksi Lunas" value={String(report.summary.orderCount)} />
          <Metric label="Rata-rata / Transaksi" value={formatRupiah(report.summary.avgPerOrder)} />
          <Metric label="Item Terjual" value={String(report.summary.itemCount)} />
          <Metric label="Transaksi Void" value={String(report.summary.voidCount)} />
          <Metric label="Estimasi Laba Kotor" value={formatRupiah(report.summary.grossProfit)} />
        </View>

        <View style={styles.twoCols}>
          <View style={styles.col}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Metode Pembayaran</Text>
              <BreakdownTable rows={report.payments} />
            </View>
          </View>
          <View style={styles.col}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tipe Pesanan</Text>
              <BreakdownTable rows={report.orderTypes} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Menu Terjual</Text>
          <Table
            headers={["Menu", "Qty", "Subtotal"]}
            widths={[62, 12, 26]}
            alignRight={[1, 2]}
            rows={report.topProducts.map((item) => [item.productName, item.qty, formatRupiah(item.revenue)])}
          />
        </View>

        <View style={styles.twoCols}>
          <View style={styles.col}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Penjualan per Jam</Text>
              <Bars data={hourly.map((hour) => ({ label: hour.label, value: hour.revenue }))} />
            </View>
          </View>
          <View style={styles.col}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Per Kasir</Text>
              <BreakdownTable rows={report.cashiers} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Catatan Stok</Text>
          {report.lowStock.length ? (
            <Table
              headers={["Bahan di bawah minimum", "Stok", "Minimum", "Satuan"]}
              widths={[52, 16, 16, 16]}
              alignRight={[1, 2, 3]}
              rows={report.lowStock.map((item) => [
                item.name,
                Math.round(item.currentStock),
                item.minStock,
                item.unit,
              ])}
            />
          ) : (
            <Text style={{ fontSize: 7.4, color: colors.muted }}>Semua bahan di atas batas minimum.</Text>
          )}
          {report.waste.length > 0 && (
            <View style={{ marginTop: 5 }}>
              <Table
                headers={["Bahan terbuang", "Qty", "Nilai", "Catatan"]}
                widths={[34, 12, 20, 34]}
                alignRight={[1, 2]}
                rows={report.waste.map((item) => [
                  item.ingredientName,
                  `${item.qty} ${item.unit}`,
                  formatRupiah(item.value),
                  item.note,
                ])}
              />
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insight</Text>
          <Insights items={report.insights} />
        </View>

        <Footer cafeName={settings.cafeName} />
      </Page>
    </Document>
  );
}

export function MonthlyReportDocument({
  report,
  settings,
}: {
  report: MonthlyReportData;
  settings: Settings;
}) {
  return (
    <Document title={`Rekap Bulanan ${report.month}`} author={settings.cafeName}>
      <Page size="A4" style={styles.page} wrap>
        <Header
          settings={settings}
          title="Rekap Penjualan Bulanan"
          subtitle={monthLabel(report.month)}
        />

        <View style={styles.metricGrid}>
          <Metric label="Total Omzet" value={formatRupiah(report.summary.revenue)} />
          <Metric label="Transaksi Lunas" value={String(report.summary.orderCount)} />
          <Metric label="Rata-rata / Hari" value={formatRupiah(report.avgPerDay)} />
          <Metric label="Rata-rata / Transaksi" value={formatRupiah(report.summary.avgPerOrder)} />
          <Metric label="Estimasi Laba Kotor" value={formatRupiah(report.summary.grossProfit)} />
          <Metric
            label="Vs Bulan Lalu"
            value={
              report.comparisonPercent === null
                ? "Belum ada data"
                : `${report.comparisonPercent >= 0 ? "+" : ""}${report.comparisonPercent}%`
            }
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tren Omzet Harian</Text>
          <Bars
            data={report.daily.map((day) => ({
              label: day.date.slice(8, 10),
              value: day.revenue,
            }))}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tabel Per Hari</Text>
          <Table
            headers={["Tanggal", "Transaksi", "Omzet"]}
            widths={[30, 18, 52]}
            alignRight={[1, 2]}
            rows={report.daily.map((day) => [day.date, day.transactions, formatRupiah(day.revenue)])}
          />
        </View>

        <View style={styles.twoCols}>
          <View style={styles.col}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hari Terbaik & Terendah</Text>
              <Text style={styles.insight}>
                Terbaik: {report.bestDay ? `${report.bestDay.date} (${formatRupiah(report.bestDay.revenue)})` : "-"}
              </Text>
              <Text style={styles.insight}>
                Terendah: {report.worstDay ? `${report.worstDay.date} (${formatRupiah(report.worstDay.revenue)})` : "-"}
              </Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pola Hari dalam Minggu</Text>
              <Table
                headers={["Hari", "Transaksi", "Omzet"]}
                widths={[34, 18, 48]}
                alignRight={[1, 2]}
                rows={report.weekday.map((day) => [day.label, day.transactions, formatRupiah(day.revenue)])}
              />
            </View>
          </View>
          <View style={styles.col}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Metode Bayar</Text>
              <BreakdownTable rows={report.payments} />
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tipe Pesanan</Text>
              <BreakdownTable rows={report.orderTypes} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top 10 Menu</Text>
          <Table
            headers={["Menu", "Qty", "Omzet"]}
            widths={[60, 14, 26]}
            alignRight={[1, 2]}
            rows={report.topProducts.map((item) => [item.productName, item.qty, formatRupiah(item.revenue)])}
          />
          {report.quietest && (
            <Text style={{ fontSize: 7.4, marginTop: 4 }}>
              Menu paling sepi: {report.quietest.productName} ({report.quietest.qty} porsi)
            </Text>
          )}
        </View>

        <View style={styles.twoCols}>
          <View style={styles.col}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Per Kategori</Text>
              <BreakdownTable rows={report.categories} />
            </View>
          </View>
          <View style={styles.col}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Per Kasir</Text>
              <BreakdownTable rows={report.cashiers} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ringkasan Stok</Text>
          <View style={styles.metricGrid}>
            <Metric label="Total Pembelian Bahan" value={formatRupiah(report.purchasesValue)} />
            <Metric label="Total Bahan Terbuang" value={formatRupiah(report.wasteValue)} />
            <Metric label="Menu Terjual" value={String(report.summary.itemCount)} />
          </View>
          <View style={{ marginTop: 5 }}>
            <Table
              headers={["5 Bahan Pemakaian Terbesar", "Qty", "Satuan"]}
              widths={[62, 20, 18]}
              alignRight={[1, 2]}
              rows={report.topUsed.map((item) => [item.name, Math.round(item.qty), item.unit])}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insight Bulanan</Text>
          <Insights items={report.insights} />
        </View>

        <Footer cafeName={settings.cafeName} />
      </Page>
    </Document>
  );
}

export function renderDailyPdf(report: DailyReportData, settings: Settings) {
  return renderToBuffer(<DailyReportDocument report={report} settings={settings} />);
}

export function renderMonthlyPdf(report: MonthlyReportData, settings: Settings) {
  return renderToBuffer(<MonthlyReportDocument report={report} settings={settings} />);
}
