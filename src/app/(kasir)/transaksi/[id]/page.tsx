"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  Printer,
  ReceiptText,
  Store,
  UserRound,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReceiptView } from "@/components/orders/receipt-view";
import { useAppSession } from "@/components/auth/session-provider";
import { useMockDb } from "@/hooks/use-mock-db";
import { formatRupiah, formatWitaDate, getWitaDateString } from "@/lib/format";
import {
  ORDER_TYPE_LABELS,
  PAYMENT_LABELS,
  dateKeyOf,
} from "@/lib/report";
import { printSection } from "@/lib/print";
import { mockDb } from "@/lib/mock-service";

export default function TransaksiDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const db = useMockDb();
  const { user } = useAppSession();
  const [voidOpen, setVoidOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;
  const order = db.orders.find((o) => o.id === orderId);
  const items = useMemo(
    () => db.orderItems.filter((i) => i.orderId === orderId),
    [db.orderItems, orderId]
  );

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Detail Transaksi" />
        <EmptyState
          icon={<ReceiptText className="h-8 w-8" />}
          title="Transaksi tidak ditemukan"
          description="Transaksi mungkin sudah dihapus atau tautannya tidak valid."
          action={
            <Link href="/transaksi">
              <Button variant="outline">Kembali ke Riwayat</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const isKasir = user?.role === "kasir";
  const isOwnToday =
    order.cashierId === user?.id && dateKeyOf(order.createdAt) === getWitaDateString();
  if (isKasir && !isOwnToday) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Detail Transaksi" />
        <EmptyState
          icon={<Ban className="h-8 w-8" />}
          title="Akses terbatas"
          description="Kasir hanya dapat melihat transaksi miliknya pada hari ini."
          action={
            <Link href="/transaksi">
              <Button variant="outline">Kembali ke Riwayat</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const cashier = db.users.find((u) => u.id === order.cashierId);
  const voider = db.users.find((u) => u.id === order.voidedBy);
  const cashierName = cashier?.name ?? "Kasir";

  async function handleVoid() {
    if (!order) return;
    if (!user || reason.trim().length < 3) {
      toast.error("Alasan void wajib diisi minimal 3 karakter.");
      return;
    }
    setSubmitting(true);
    try {
      const ok = await mockDb.voidOrder(order.id, reason.trim(), user.id);
      if (!ok) throw new Error("Transaksi gagal dibatalkan.");
      toast.success("Transaksi dibatalkan. Stok bahan telah dikembalikan.");
      setVoidOpen(false);
      setReason("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Transaksi gagal dibatalkan.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-4">
        <button
          onClick={() => router.push("/transaksi")}
          className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Riwayat Transaksi
        </button>
        <PageHeader
          title={order.orderNo}
          description={`Dibuat ${formatWitaDate(order.createdAt)} WITA`}
          className="mb-0"
          actions={
            <>
              <Button variant="outline" onClick={() => printSection("receipt-print")}>
                <Printer className="mr-2 h-4 w-4" /> Cetak Ulang
              </Button>
              {user?.role === "owner" && order.status === "paid" && (
                <Button variant="destructive" onClick={() => setVoidOpen(true)}>
                  <Ban className="mr-2 h-4 w-4" /> Void Transaksi
                </Button>
              )}
            </>
          }
        />
      </div>

      {order.status === "void" && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div className="text-sm">
            <p className="font-semibold text-destructive">Transaksi dibatalkan (void)</p>
            <p className="mt-0.5 text-muted-foreground">
              {formatWitaDate(order.voidedAt ?? order.createdAt)} oleh{" "}
              {voider?.name ?? "owner"} · Alasan: {order.voidReason}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Transaksi tidak dihitung dalam omzet. Stok bahan telah dikembalikan.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Informasi Transaksi
              </h2>
              {order.status === "paid" ? (
                <Badge className="border-success/30 bg-success/10 text-success">Lunas</Badge>
              ) : (
                <Badge className="border-destructive/30 bg-destructive/10 text-destructive">
                  Void
                </Badge>
              )}
            </div>

            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Tipe Pesanan</dt>
                <dd className="mt-0.5 flex items-center gap-1.5 font-medium">
                  <Store className="h-3.5 w-3.5 text-muted-foreground" />
                  {ORDER_TYPE_LABELS[order.orderType]}
                  {order.tableLabel ? ` · ${order.tableLabel}` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Kasir</dt>
                <dd className="mt-0.5 flex items-center gap-1.5 font-medium">
                  <UserRound className="h-3.5 w-3.5 text-muted-foreground" />
                  {cashierName}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Metode Bayar</dt>
                <dd className="mt-0.5 font-medium">{PAYMENT_LABELS[order.paymentMethod]}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Waktu</dt>
                <dd className="mt-0.5 font-medium">
                  {formatWitaDate(order.createdAt, "d MMMM yyyy, HH:mm")} WITA
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Uang Diterima</dt>
                <dd className="mt-0.5 font-medium tabular-nums">
                  {formatRupiah(order.cashReceived)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Kembalian</dt>
                <dd className="mt-0.5 font-medium tabular-nums">
                  {formatRupiah(order.changeAmount)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
              <h2 className="font-semibold">Item Pesanan</h2>
              <span className="text-xs text-muted-foreground">
                {items.reduce((sum, i) => sum + i.qty, 0)} item
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs font-medium text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium sm:px-5">Menu</th>
                    <th className="px-3 py-2.5 text-center font-medium">Qty</th>
                    <th className="px-3 py-2.5 text-right font-medium">Harga</th>
                    <th className="px-4 py-2.5 text-right font-medium sm:px-5">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t border-border/70">
                      <td className="px-4 py-3 sm:px-5">
                        <p className="font-medium">{item.productName}</p>
                        {item.note && (
                          <p className="text-xs italic text-muted-foreground">
                            Catatan: {item.note}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center tabular-nums">{item.qty}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-muted-foreground">
                        {formatRupiah(item.unitPrice)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums sm:px-5">
                        {formatRupiah(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border p-4 sm:p-5">
              <dl className="ml-auto max-w-xs space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="tabular-nums">{formatRupiah(order.subtotal)}</dd>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-success">
                    <dt>Diskon</dt>
                    <dd className="tabular-nums">-{formatRupiah(order.discount)}</dd>
                  </div>
                )}
                {order.tax > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <dt>Pajak</dt>
                    <dd className="tabular-nums">{formatRupiah(order.tax)}</dd>
                  </div>
                )}
                {order.serviceCharge > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <dt>Service</dt>
                    <dd className="tabular-nums">{formatRupiah(order.serviceCharge)}</dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatRupiah(order.total)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <aside>
          <div className="sticky top-24 space-y-3">
            <div className="rounded-xl border border-border bg-muted/40 p-2">
              <ReceiptView
                id="receipt-print"
                order={order}
                items={items}
                cashierName={cashierName}
                settings={db.settings}
                className="rounded-lg"
              />
            </div>
            <p className="px-1 text-center text-xs text-muted-foreground">
              Struk digital. Gunakan tombol cetak untuk mencetak atau menyimpan PDF.
            </p>
          </div>
        </aside>
      </div>

      <Dialog open={voidOpen} onOpenChange={setVoidOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Void transaksi {order.orderNo}?</DialogTitle>
            <DialogDescription>
              Transaksi tetap tersimpan dengan status void. Stok bahan yang sempat
              berkurang akan dikembalikan dan transaksi dikeluarkan dari omzet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="void-reason">Alasan void (wajib)</Label>
            <Textarea
              id="void-reason"
              placeholder="Contoh: salah input pesanan pelanggan"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVoidOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" disabled={submitting} onClick={handleVoid}>
              {submitting ? "Memproses…" : "Void Transaksi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
