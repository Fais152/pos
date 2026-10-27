"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Boxes,
  ClipboardList,
  Package,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { EmptyState } from "@/components/layout/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMockDb } from "@/hooks/use-mock-db";
import { formatRupiah, formatWitaDate } from "@/lib/format";
import { MOVEMENT_LABELS } from "@/lib/report";
import type { StockMovementType } from "@/lib/types";
import { cn } from "@/lib/utils";

const MOVEMENT_STYLES: Record<StockMovementType, string> = {
  purchase: "border-success/30 bg-success/10 text-success",
  sale: "border-primary/30 bg-primary/10 text-primary",
  void_return: "border-border bg-muted text-muted-foreground",
  adjustment: "border-warning/40 bg-warning/10 text-foreground",
  waste: "border-destructive/30 bg-destructive/10 text-destructive",
};

export default function KartuStokPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const db = useMockDb();
  const [typeFilter, setTypeFilter] = useState<"all" | StockMovementType>("all");

  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const ingredient = db.ingredients.find((i) => i.id === id);
  const movements = useMemo(
    () =>
      db.stockMovements
        .filter((m) => m.ingredientId === id)
        .filter((m) => typeFilter === "all" || m.type === typeFilter)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [db.stockMovements, id, typeFilter]
  );

  if (!ingredient) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Kartu Stok" />
        <EmptyState
          icon={<Package className="h-8 w-8" />}
          title="Bahan tidak ditemukan"
          description="Bahan mungkin sudah dihapus atau tautannya tidak valid."
          action={
            <Link href="/stok">
              <Button variant="outline">Kembali ke Stok</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const low = ingredient.currentStock <= ingredient.minStock;
  const negative = ingredient.currentStock < 0;

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-4">
        <button
          onClick={() => router.push("/stok")}
          className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Stok Bahan Baku
        </button>
        <PageHeader
          title={ingredient.name}
          description={`Satuan ${ingredient.unit} · pergerakan stok bersifat append-only`}
          className="mb-0"
          actions={
            <Badge
              className={cn(
                "text-sm",
                negative
                  ? "border-destructive/30 bg-destructive/10 text-destructive"
                  : low
                    ? "border-warning/40 bg-warning/10 text-foreground"
                    : "border-success/30 bg-success/10 text-success"
              )}
            >
              {negative ? "Stok negatif" : low ? "Di bawah minimum" : "Stok aman"}
            </Badge>
          }
        />
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Stok Saat Ini"
          value={`${Math.round(ingredient.currentStock)} ${ingredient.unit}`}
          tone={negative ? "destructive" : low ? "default" : "success"}
          icon={<Boxes className="h-4 w-4" />}
        />
        <StatCard
          label="Batas Minimum"
          value={`${ingredient.minStock} ${ingredient.unit}`}
          icon={<ClipboardList className="h-4 w-4" />}
        />
        <StatCard
          label="Harga Beli / Satuan"
          value={formatRupiah(ingredient.costPerUnit)}
          icon={<Wallet className="h-4 w-4" />}
        />
        <StatCard
          label="Nilai Stok (est.)"
          value={formatRupiah(
            Math.round(Math.max(0, ingredient.currentStock) * ingredient.costPerUnit)
          )}
          icon={<Package className="h-4 w-4" />}
        />
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-semibold">Riwayat Pergerakan Stok</h2>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as "all" | StockMovementType)}
          className="h-10 rounded-md border border-input bg-card px-3 text-sm"
        >
          <option value="all">Semua jenis</option>
          {(Object.keys(MOVEMENT_LABELS) as StockMovementType[]).map((type) => (
            <option key={type} value={type}>
              {MOVEMENT_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      {movements.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-8 w-8" />}
          title="Belum ada pergerakan stok"
          description="Pergerakan akan tercatat saat restock, penjualan, void, opname, atau bahan terbuang."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs font-medium text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Waktu</th>
                  <th className="px-4 py-3 font-medium">Jenis</th>
                  <th className="px-4 py-3 text-right font-medium">Perubahan</th>
                  <th className="px-4 py-3 text-right font-medium">Harga / Satuan</th>
                  <th className="px-4 py-3 font-medium">Catatan</th>
                  <th className="px-4 py-3 font-medium">Oleh</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => {
                  const user = db.users.find((u) => u.id === m.createdBy);
                  const order = m.orderId
                    ? db.orders.find((o) => o.id === m.orderId)
                    : null;
                  return (
                    <tr key={m.id} className="border-t border-border/70">
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {formatWitaDate(m.createdAt, "d MMM yyyy, HH:mm")}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={MOVEMENT_STYLES[m.type]}>
                          {MOVEMENT_LABELS[m.type]}
                        </Badge>
                      </td>
                      <td
                        className={cn(
                          "whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums",
                          m.qtyChange >= 0 ? "text-success" : "text-destructive"
                        )}
                      >
                        <span className="inline-flex items-center gap-1">
                          {m.qtyChange >= 0 ? (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDownLeft className="h-3.5 w-3.5" />
                          )}
                          {m.qtyChange > 0 ? "+" : ""}
                          {Math.round(m.qtyChange * 100) / 100} {ingredient.unit}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {formatRupiah(m.unitCost)}
                      </td>
                      <td className="max-w-[280px] px-4 py-3">
                        <p className="truncate text-muted-foreground" title={m.note}>
                          {m.note}
                        </p>
                        {order && (
                          <Link
                            href={`/transaksi/${order.id}`}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            {order.orderNo}
                          </Link>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {user?.name ?? "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Catatan: kartu stok tidak mengubah catatan lama. Koreksi stok selalu dibuat sebagai
        pergerakan baru agar jejak audit tetap utuh.
      </p>
    </div>
  );
}
