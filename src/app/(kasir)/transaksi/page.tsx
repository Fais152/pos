"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Eye,
  ReceiptText,
  TrendingUp,
  Wallet,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { EmptyState } from "@/components/layout/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppSession } from "@/components/auth/session-provider";
import { useMockDb } from "@/hooks/use-mock-db";
import { formatRupiah, formatWitaDate, getWitaDateString } from "@/lib/format";
import {
  ORDER_TYPE_LABELS,
  PAYMENT_LABELS,
  dateKeyOf,
  summarize,
} from "@/lib/report";
import type { OrderType, PaymentMethod } from "@/lib/types";

function shiftDate(dateKey: string, days: number) {
  const d = new Date(`${dateKey}T04:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function TransaksiPage() {
  const db = useMockDb();
  const { user } = useAppSession();
  const router = useRouter();
  const today = getWitaDateString();

  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [cashierId, setCashierId] = useState("all");
  const [payment, setPayment] = useState<"all" | PaymentMethod>("all");
  const [orderType, setOrderType] = useState<"all" | OrderType>("all");
  const [status, setStatus] = useState<"all" | "paid" | "void">("all");

  const isKasir = user?.role === "kasir";
  const cashiers = db.users.filter((u) => u.role === "kasir" || u.role === "owner");

  const filtered = useMemo(() => {
    if (!user) return [];
    if (isKasir) {
      return db.orders
        .filter((o) => o.cashierId === user.id && dateKeyOf(o.createdAt) === today)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return db.orders
      .filter((o) => {
        const key = dateKeyOf(o.createdAt);
        if (from && key < from) return false;
        if (to && key > to) return false;
        if (cashierId !== "all" && o.cashierId !== cashierId) return false;
        if (payment !== "all" && o.paymentMethod !== payment) return false;
        if (orderType !== "all" && o.orderType !== orderType) return false;
        if (status !== "all" && o.status !== status) return false;
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [db.orders, from, to, cashierId, payment, orderType, status, isKasir, user, today]);

  const summary = useMemo(
    () => summarize(filtered, db.orderItems),
    [filtered, db.orderItems]
  );

  function setPreset(preset: "today" | "7d" | "month") {
    if (preset === "today") {
      setFrom(today);
      setTo(today);
    } else if (preset === "7d") {
      setFrom(shiftDate(today, -6));
      setTo(today);
    } else {
      setFrom(`${today.slice(0, 7)}-01`);
      setTo(today);
    }
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Riwayat Transaksi"
        description={
          isKasir
            ? "Menampilkan transaksi milik Anda hari ini."
            : "Telusuri transaksi berdasarkan tanggal, kasir, metode bayar, dan status."
        }
        actions={
          <Link href="/kasir">
            <Button className="gap-2">
              <ReceiptText className="h-4 w-4" /> Transaksi Baru
            </Button>
          </Link>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Omzet"
          value={formatRupiah(summary.revenue)}
          icon={<Wallet className="h-4 w-4" />}
          tone="primary"
        />
        <StatCard
          label="Transaksi Lunas"
          value={String(summary.orderCount)}
          hint={`${summary.itemCount} item terjual`}
          icon={<ReceiptText className="h-4 w-4" />}
        />
        <StatCard
          label="Rata-rata / Transaksi"
          value={formatRupiah(summary.avgPerOrder)}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="Transaksi Void"
          value={String(summary.voidCount)}
          hint="Tidak dihitung dalam omzet"
          tone="destructive"
          icon={<XCircle className="h-4 w-4" />}
        />
      </div>

      {!isKasir && (
        <div className="mb-4 rounded-xl border border-border bg-card p-3.5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Dari tanggal</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Sampai tanggal</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Kasir</label>
              <select
                value={cashierId}
                onChange={(e) => setCashierId(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="all">Semua kasir</option>
                {cashiers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Metode bayar</label>
              <select
                value={payment}
                onChange={(e) => setPayment(e.target.value as "all" | PaymentMethod)}
                className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="all">Semua metode</option>
                <option value="cash">Tunai</option>
                <option value="qris">QRIS</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Tipe pesanan</label>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as "all" | OrderType)}
                className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="all">Semua tipe</option>
                <option value="dine_in">Dine-in</option>
                <option value="takeaway">Takeaway</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "all" | "paid" | "void")}
                className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="all">Semua status</option>
                <option value="paid">Lunas</option>
                <option value="void">Void</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" /> Cepat:
            </span>
            <button
              className="rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-muted"
              onClick={() => setPreset("today")}
            >
              Hari ini
            </button>
            <button
              className="rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-muted"
              onClick={() => setPreset("7d")}
            >
              7 hari terakhir
            </button>
            <button
              className="rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-muted"
              onClick={() => setPreset("month")}
            >
              Bulan ini
            </button>
            <span className="ml-auto text-xs text-muted-foreground">
              {filtered.length} transaksi ditemukan
            </span>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ReceiptText className="h-8 w-8" />}
          title="Belum ada transaksi"
          description={
            isKasir
              ? "Transaksi yang Anda buat hari ini akan muncul di sini."
              : "Coba ubah filter tanggal atau buat transaksi baru di halaman Kasir."
          }
          action={
            <Link href="/kasir">
              <Button variant="outline">Buka Kasir</Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-left text-xs font-medium text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">No. Transaksi</th>
                    <th className="px-4 py-3 font-medium">Waktu</th>
                    <th className="px-4 py-3 font-medium">Tipe</th>
                    <th className="px-4 py-3 font-medium">Kasir</th>
                    <th className="px-4 py-3 font-medium">Metode</th>
                    <th className="px-4 py-3 text-right font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order) => {
                    const cashier = db.users.find((u) => u.id === order.cashierId);
                    return (
                      <tr
                        key={order.id}
                        className="cursor-pointer border-t border-border/70 transition-colors hover:bg-muted/40"
                        onClick={() => router.push(`/transaksi/${order.id}`)}
                      >
                        <td className="px-4 py-3 font-medium">{order.orderNo}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {formatWitaDate(order.createdAt, "d MMM yyyy, HH:mm")}
                        </td>
                        <td className="px-4 py-3">
                          {ORDER_TYPE_LABELS[order.orderType]}
                          {order.tableLabel ? ` · ${order.tableLabel}` : ""}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {cashier?.name ?? "-"}
                        </td>
                        <td className="px-4 py-3">{PAYMENT_LABELS[order.paymentMethod]}</td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">
                          {formatRupiah(order.total)}
                        </td>
                        <td className="px-4 py-3">
                          {order.status === "paid" ? (
                            <Badge className="border-success/30 bg-success/10 text-success">
                              Lunas
                            </Badge>
                          ) : (
                            <Badge className="border-destructive/30 bg-destructive/10 text-destructive">
                              Void
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/transaksi/${order.id}`);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" /> Detail
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-2.5 md:hidden">
            {filtered.map((order) => {
              const cashier = db.users.find((u) => u.id === order.cashierId);
              const itemCount = db.orderItems
                .filter((i) => i.orderId === order.id)
                .reduce((sum, i) => sum + i.qty, 0);
              return (
                <Link
                  key={order.id}
                  href={`/transaksi/${order.id}`}
                  className="block rounded-xl border border-border bg-card p-3.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{order.orderNo}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatWitaDate(order.createdAt, "d MMM, HH:mm")} ·{" "}
                        {cashier?.name ?? "-"}
                      </p>
                    </div>
                    {order.status === "paid" ? (
                      <Badge className="border-success/30 bg-success/10 text-success">
                        Lunas
                      </Badge>
                    ) : (
                      <Badge className="border-destructive/30 bg-destructive/10 text-destructive">
                        Void
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {ORDER_TYPE_LABELS[order.orderType]}
                      {order.tableLabel ? ` · ${order.tableLabel}` : ""} ·{" "}
                      {PAYMENT_LABELS[order.paymentMethod]} · {itemCount} item
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-foreground">
                      {formatRupiah(order.total)}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
