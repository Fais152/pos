"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  Coffee,
  Lightbulb,
  ReceiptText,
  ShoppingBag,
  TrendingUp,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { HourlyChart, TrendChart } from "@/components/dashboard/sales-charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMockDb } from "@/hooks/use-mock-db";
import { formatRupiah, getWitaDateString } from "@/lib/format";
import {
  ORDER_TYPE_LABELS,
  dailyInsights,
  dailySeries,
  hourlySeries,
  lowStockAlerts,
  orderTypeBreakdown,
  ordersByDate,
  paidOnly,
  paymentBreakdown,
  summarize,
  topProducts,
} from "@/lib/report";
import { formatInTimeZone } from "date-fns-tz";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";

function CompositionBar({
  label,
  count,
  total,
  percent,
}: {
  label: string;
  count: number;
  total: number;
  percent?: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {formatRupiah(total)}{" "}
          <span className="text-xs font-normal text-muted-foreground">({percent ?? 0}%)</span>
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary/80"
          style={{ width: `${Math.max(0, Math.min(100, percent ?? 0))}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">{count} transaksi</p>
    </div>
  );
}

export default function DashboardPage() {
  const db = useMockDb();
  const today = getWitaDateString();
  const [date, setDate] = useState(today);
  const [trendDays, setTrendDays] = useState<7 | 30>(7);

  const dayOrders = useMemo(() => ordersByDate(db.orders, date), [db.orders, date]);
  const summary = useMemo(
    () => summarize(db.orders, db.orderItems, { dateKey: date }),
    [db.orders, db.orderItems, date]
  );

  const yesterdayKey = useMemo(() => {
    const d = new Date(`${date}T04:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
  }, [date]);
  const yesterdaySummary = useMemo(
    () => summarize(db.orders, db.orderItems, { dateKey: yesterdayKey }),
    [db.orders, db.orderItems, yesterdayKey]
  );

  const hourly = useMemo(() => hourlySeries(db.orders, date), [db.orders, date]);
  const trend = useMemo(
    () => dailySeries(db.orders, trendDays, date),
    [db.orders, trendDays, date]
  );
  const top = useMemo(
    () => topProducts(dayOrders, db.orderItems, 5),
    [dayOrders, db.orderItems]
  );
  const payments = useMemo(() => paymentBreakdown(dayOrders), [dayOrders]);
  const orderTypes = useMemo(() => orderTypeBreakdown(dayOrders), [dayOrders]);
  const alerts = useMemo(() => lowStockAlerts(db.ingredients), [db.ingredients]);
  const insights = useMemo(
    () =>
      dailyInsights(db.orders, db.orderItems, db.ingredients, db.products, date),
    [db.orders, db.orderItems, db.ingredients, db.products, date]
  );

  const dateLabel = formatInTimeZone(
    new Date(`${date}T04:00:00Z`),
    "Asia/Makassar",
    "EEEE, d MMMM yyyy",
    { locale: localeId }
  );
  const isToday = date === today;

  const revenueDelta =
    yesterdaySummary.revenue > 0
      ? Math.round(((summary.revenue - yesterdaySummary.revenue) / yesterdaySummary.revenue) * 100)
      : null;

  const cashierCount = new Set(paidOnly(dayOrders).map((o) => o.cashierId)).size;

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Dashboard"
        description={`Ringkasan penjualan ${dateLabel} (WITA).`}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="date"
                value={date}
                max={today}
                onChange={(e) => setDate(e.target.value || today)}
                className="h-10 rounded-md border border-input bg-card pl-9 pr-3 text-sm"
              />
            </div>
            {!isToday && (
              <Button variant="outline" size="sm" className="h-10" onClick={() => setDate(today)}>
                Hari ini
              </Button>
            )}
          </div>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Omzet"
          value={formatRupiah(summary.revenue)}
          hint={
            revenueDelta === null
              ? "Belum ada pembanding kemarin"
              : `${revenueDelta >= 0 ? "Naik" : "Turun"} ${Math.abs(revenueDelta)}% vs kemarin`
          }
          icon={<Wallet className="h-4 w-4" />}
          tone="primary"
        />
        <StatCard
          label="Transaksi Lunas"
          value={String(summary.orderCount)}
          hint={`${summary.voidCount} transaksi void`}
          icon={<ReceiptText className="h-4 w-4" />}
        />
        <StatCard
          label="Rata-rata / Transaksi"
          value={formatRupiah(summary.avgPerOrder)}
          hint="Di luar transaksi void"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="Item Terjual"
          value={String(summary.itemCount)}
          hint={`${cashierCount} kasir aktif · laba kotor ${formatRupiah(summary.grossProfit)}`}
          icon={<ShoppingBag className="h-4 w-4" />}
          tone="success"
        />
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Penjualan per Jam</h2>
              <p className="text-xs text-muted-foreground">{dateLabel}</p>
            </div>
            <Badge className="border-border bg-muted text-muted-foreground">
              {summary.orderCount} transaksi
            </Badge>
          </div>
          {summary.orderCount === 0 ? (
            <div className="flex h-[260px] flex-col items-center justify-center text-center">
              <Coffee className="mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm font-medium">Belum ada penjualan pada tanggal ini</p>
              <p className="text-xs text-muted-foreground">Grafik akan muncul setelah ada transaksi.</p>
            </div>
          ) : (
            <HourlyChart data={hourly} />
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Top 5 Menu</h2>
          </div>
          {top.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Belum ada menu terjual.
            </p>
          ) : (
            <div className="space-y-3">
              {top.map((item, idx) => {
                const maxQty = top[0]?.qty || 1;
                return (
                  <div key={item.productId}>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                            idx === 0
                              ? "bg-primary-solid text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {idx + 1}
                        </span>
                        <span className="truncate font-medium">{item.productName}</span>
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {item.qty} porsi
                      </span>
                    </div>
                    <div className="mt-1 ml-7 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary/80"
                        style={{ width: `${(item.qty / maxQty) * 100}%` }}
                      />
                    </div>
                    <p className="ml-7 mt-0.5 text-[11px] text-muted-foreground">
                      {formatRupiah(item.revenue)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold">Tren Omzet</h2>
              <p className="text-xs text-muted-foreground">
                {trendDays} hari terakhir hingga {dateLabel.split(",")[0]}
              </p>
            </div>
            <div className="flex rounded-md border border-border p-0.5">
              {([7, 30] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setTrendDays(d)}
                  className={cn(
                    "rounded px-3 py-1 text-xs font-medium transition-colors",
                    trendDays === d
                      ? "bg-primary-solid text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {d} hari
                </button>
              ))}
            </div>
          </div>
          <TrendChart data={trend} />
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <Banknote className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Metode Bayar</h2>
            </div>
            <div className="space-y-3">
              {payments.map((p) => (
                <CompositionBar
                  key={p.key}
                  label={p.label}
                  count={p.count}
                  total={p.total}
                  percent={p.percent}
                />
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Tipe Pesanan</h2>
            </div>
            <div className="space-y-3">
              {orderTypes.map((t) => (
                <CompositionBar
                  key={t.key}
                  label={ORDER_TYPE_LABELS[t.key as keyof typeof ORDER_TYPE_LABELS]}
                  count={t.count}
                  total={t.total}
                  percent={t.percent}
                />
              ))}
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Total metode bayar: {formatRupiah(
                payments.reduce((sum, p) => sum + p.total, 0)
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <h2 className="font-semibold">Bahan Hampir Habis</h2>
            </div>
            <Link href="/stok" className="text-xs font-medium text-primary hover:underline">
              Lihat semua
            </Link>
          </div>
          {alerts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Semua bahan berada di atas batas minimum.
            </p>
          ) : (
            <div className="space-y-2.5">
              {alerts.slice(0, 5).map(({ ingredient, deficit }) => (
                <div key={ingredient.id} className="rounded-lg border border-border/70 p-2.5">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate font-medium">{ingredient.name}</span>
                    <Badge className="shrink-0 border-warning/40 bg-warning/10 text-warning">
                      kurang {Math.round(deficit)} {ingredient.unit}
                    </Badge>
                  </div>
                  <div className="mt-1.5 text-xs text-muted-foreground">
                    Tersisa {Math.round(ingredient.currentStock)} {ingredient.unit} dari minimum{" "}
                    {ingredient.minStock} {ingredient.unit}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Insight</h2>
          </div>
          {insights.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Belum ada insight untuk periode ini.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {insights.map((insight, idx) => (
                <li
                  key={idx}
                  className="flex gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm leading-relaxed text-muted-foreground"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                  {insight}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-[11px] text-muted-foreground">
            Insight dihitung otomatis dari data transaksi (rule-based).
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Performa Kasir</h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {db.users
            .filter((u) => u.role === "kasir")
            .map((user) => {
              const orders = paidOnly(dayOrders).filter((o) => o.cashierId === user.id);
              const revenue = orders.reduce((sum, o) => sum + o.total, 0);
              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2.5 text-sm"
                >
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{orders.length} transaksi</p>
                  </div>
                  <span className="font-semibold tabular-nums">{formatRupiah(revenue)}</span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
