"use client";

import { useState } from "react";
import { mutate } from "swr";
import { AlertTriangle, Banknote, Landmark, QrCode, Wallet } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/ui/money-input";
import { formatRupiah } from "@/lib/format";
import { mockDb } from "@/lib/mock-service";
import { ApiClientError } from "@/lib/api-client";
import type { Order, OrderItem, PaymentMethod } from "@/lib/types";
import type { CartState } from "@/hooks/use-cart";
import type { Shortage } from "./cart-panel";
import { cn } from "@/lib/utils";

const METHODS: Array<{
  key: PaymentMethod;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "cash", label: "Tunai", icon: Banknote },
  { key: "qris", label: "QRIS", icon: QrCode },
  { key: "transfer", label: "Transfer", icon: Landmark },
];

function roundUp(value: number, step: number) {
  return Math.ceil(value / step) * step;
}

export function PaymentDialog({
  open,
  onOpenChange,
  cart,
  total,
  cashierId,
  shortages,
  orderId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartState;
  total: number;
  cashierId: string;
  shortages: Shortage[];
  orderId: string;
  onSuccess: (order: Order, items: OrderItem[]) => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [cashReceived, setCashReceived] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const change = Math.max(0, cashReceived - total);
  const insufficientCash = method === "cash" && cashReceived < total;
  const itemCount = cart.items.reduce((sum, i) => sum + i.qty, 0);

  const quickAmounts = Array.from(
    new Set([
      total,
      roundUp(total, 5000),
      roundUp(total, 10000),
      roundUp(total, 50000),
      100000,
      200000,
    ])
  )
    .filter((v) => v >= total)
    .sort((a, b) => a - b)
    .slice(0, 4);

  async function submit() {
    if (!cart.items.length) return;
    if (insufficientCash) {
      toast.error("Uang diterima kurang dari total pembayaran.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await mockDb.createOrder({
        orderId,
        orderType: cart.orderType,
        tableLabel: cart.tableLabel || null,
        items: cart.items.map((i) => ({
          productId: i.productId,
          qty: i.qty,
          note: i.note,
        })),
        discount: discountAmount,
        clientTotal: total,
        paymentMethod: method,
        cashReceived: method === "cash" ? cashReceived : total,
        cashierId,
      });
      if (result.replayed) {
        toast.info("Transaksi ini sudah tersimpan sebelumnya.");
      } else {
        if (result.order.total !== total) {
          toast.warning(`Total disesuaikan menjadi ${formatRupiah(result.order.total)}.`);
        }
        toast.success(`Transaksi ${result.order.orderNo} berhasil disimpan.`);
      }
      onSuccess(result.order, result.items);
    } catch (err) {
      console.error(err);
      if (err instanceof ApiClientError && err.status === 409) {
        mutate("/api/bootstrap").catch(() => {});
        toast.error(err.message);
      } else {
        const message =
          err instanceof ApiClientError && err.status === 0
            ? "Koneksi terputus. Transaksi mungkin sudah tersimpan; periksa Riwayat sebelum mengulang."
            : err instanceof Error
              ? err.message
              : "Gagal menyimpan transaksi.";
        toast.error(message);
      }
      setSubmitting(false);
    }
  }

  const subtotal = cart.items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
  const discountAmount =
    cart.discountType === "percent"
      ? Math.min(subtotal, Math.round((subtotal * cart.discountValue) / 100))
      : Math.min(subtotal, cart.discountValue);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!submitting) onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pembayaran</DialogTitle>
          <DialogDescription>
            {itemCount} item ·{" "}
            {cart.orderType === "dine_in"
              ? `Dine-in${cart.tableLabel ? ` · ${cart.tableLabel}` : ""}`
              : "Takeaway"}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl bg-muted/70 p-4 text-center">
          <p className="text-xs font-medium text-muted-foreground">
            Total tagihan
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{formatRupiah(total)}</p>
          {discountAmount > 0 && (
            <p className="mt-1 text-xs text-success">
              Diskon {formatRupiah(discountAmount)} sudah diterapkan
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {METHODS.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setMethod(m.key)}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2 text-xs font-medium transition-colors",
                  method === m.key
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-5 w-5" />
                {m.label}
              </button>
            );
          })}
        </div>

        {method === "cash" ? (
          <div className="space-y-3">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium">Uang diterima</label>
                <span className="text-xs text-muted-foreground">Wajib tunai</span>
              </div>
              <MoneyInput
                value={cashReceived}
                onValueChange={setCashReceived}
                placeholder={String(total)}
                className="h-12 text-lg"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setCashReceived(amount)}
                  className={cn(
                    "min-h-9 rounded-md border px-3 text-xs font-medium transition-colors",
                    cashReceived === amount
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background hover:bg-muted"
                  )}
                >
                  {amount === total ? "Uang pas" : formatRupiah(amount)}
                </button>
              ))}
            </div>
            <div
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm",
                insufficientCash
                  ? "bg-destructive/10 text-destructive"
                  : "bg-success/10 text-success"
              )}
            >
              <span className="flex items-center gap-1.5 font-medium">
                <Wallet className="h-4 w-4" />
                {insufficientCash ? "Kurang" : "Kembalian"}
              </span>
              <span className="font-bold tabular-nums">
                {formatRupiah(
                  insufficientCash ? total - cashReceived : change
                )}
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Pembayaran {method === "qris" ? "QRIS" : "transfer"} dicatat manual. Pastikan dana
            sudah diterima sebelum menyimpan transaksi.
          </div>
        )}

        {shortages.length > 0 && (
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs">
            <p className="flex items-center gap-1.5 font-semibold text-foreground">
              <AlertTriangle className="h-3.5 w-3.5 text-warning" /> Stok bahan akan menjadi negatif
            </p>
            <p className="mt-1 text-muted-foreground">
              {shortages.map((s) => s.name).join(", ")}. Transaksi tetap dapat dilanjutkan.
            </p>
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Batal
          </Button>
          <Button
            className="sm:min-w-40"
            onClick={submit}
            disabled={submitting || insufficientCash}
          >
            {submitting ? "Menyimpan…" : "Konfirmasi Pembayaran"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

