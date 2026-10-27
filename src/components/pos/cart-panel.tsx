"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Minus,
  NotebookPen,
  Plus,
  ShoppingBag,
  Trash2,
  Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { MoneyInput } from "@/components/ui/money-input";
import { formatRupiah } from "@/lib/format";
import type { Settings } from "@/lib/types";
import type { CartState } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";

export interface Shortage {
  name: string;
  unit: string;
  needed: number;
  available: number;
}

export function CartPanel({
  cart,
  settings,
  shortages,
  onQtyChange,
  onRemove,
  onNoteChange,
  onOrderTypeChange,
  onTableLabelChange,
  onDiscountChange,
  onClear,
  onPay,
  className,
}: {
  cart: CartState;
  settings: Settings;
  shortages: Shortage[];
  onQtyChange: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
  onNoteChange: (productId: string, note: string) => void;
  onOrderTypeChange: (type: "dine_in" | "takeaway") => void;
  onTableLabelChange: (label: string) => void;
  onDiscountChange: (type: "nominal" | "percent", value: number) => void;
  onClear: () => void;
  onPay: () => void;
  className?: string;
}) {
  const [noteEditing, setNoteEditing] = useState<string | null>(null);

  const subtotal = cart.items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
  const discountAmount =
    cart.discountType === "percent"
      ? Math.min(subtotal, Math.round((subtotal * cart.discountValue) / 100))
      : Math.min(subtotal, cart.discountValue);

  function changeDiscountType(type: "nominal" | "percent") {
    if (cart.discountType === type) return;
    const value =
      type === "percent"
        ? subtotal > 0
          ? Math.min(100, Math.round((cart.discountValue / subtotal) * 100))
          : 0
        : Math.round((subtotal * cart.discountValue) / 100);
    onDiscountChange(type, value);
  }
  const base = Math.max(0, subtotal - discountAmount);
  const tax = Math.round((base * settings.taxPercent) / 100);
  const service = Math.round((base * settings.servicePercent) / 100);
  const total = base + tax + service;
  const itemCount = cart.items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Pesanan</h2>
          {itemCount > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {itemCount} item
            </span>
          )}
        </div>
        {cart.items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-destructive"
            onClick={onClear}
          >
            Kosongkan
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-3 p-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onOrderTypeChange("dine_in")}
              className={cn(
                "flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                cart.orderType === "dine_in"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:bg-muted"
              )}
            >
              <Utensils className="h-4 w-4" />
              Dine-in
            </button>
            <button
              type="button"
              onClick={() => onOrderTypeChange("takeaway")}
              className={cn(
                "flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                cart.orderType === "takeaway"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:bg-muted"
              )}
            >
              <ShoppingBag className="h-4 w-4" />
              Takeaway
            </button>
          </div>

          {cart.orderType === "dine_in" && (
            <Input
              placeholder="Label meja (opsional), mis. Meja 4"
              value={cart.tableLabel}
              onChange={(e) => onTableLabelChange(e.target.value)}
              className="h-10"
              maxLength={60}
            />
          )}

          {cart.items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center">
              <ShoppingBag className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">Keranjang masih kosong</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Pilih menu di sebelah kiri untuk mulai transaksi.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.items.map((item) => (
                <div key={item.productId} className="rounded-xl border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatRupiah(item.unitPrice)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(item.productId)}
                      className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Hapus ${item.productName}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onQtyChange(item.productId, item.qty - 1)}
                        aria-label="Kurangi"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="w-8 text-center text-sm font-semibold tabular-nums">
                        {item.qty}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onQtyChange(item.productId, item.qty + 1)}
                        disabled={item.qty >= 99}
                        aria-label="Tambah"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">
                      {formatRupiah(item.unitPrice * item.qty)}
                    </span>
                  </div>

                  {noteEditing === item.productId ? (
                    <div className="mt-2 space-y-2">
                      <Textarea
                        autoFocus
                        rows={2}
                        className="min-h-0 text-xs"
                        placeholder="Catatan item, mis. tanpa gula, less ice…"
                        value={item.note ?? ""}
                        onChange={(e) => onNoteChange(item.productId, e.target.value)}
                        maxLength={200}
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 text-xs"
                        onClick={() => setNoteEditing(null)}
                      >
                        Simpan catatan
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setNoteEditing(item.productId)}
                      className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                    >
                      <NotebookPen className="h-3 w-3" />
                      {item.note ? `Catatan: ${item.note}` : "Tambah catatan"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {shortages.length > 0 && (
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs">
              <p className="flex items-center gap-1.5 font-semibold text-foreground">
                <AlertTriangle className="h-3.5 w-3.5 text-warning" /> Stok bahan tidak cukup
              </p>
              <ul className="mt-1.5 space-y-0.5 text-muted-foreground">
                {shortages.map((s) => (
                  <li key={s.name}>
                    {s.name}: butuh {Math.round(s.needed)} {s.unit}, tersedia{" "}
                    {Math.round(s.available)} {s.unit}
                  </li>
                ))}
              </ul>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Transaksi tetap bisa dilanjutkan; stok dapat menjadi negatif.
              </p>
            </div>
          )}

          {cart.items.length > 0 && (
            <div className="space-y-3 rounded-xl bg-muted/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">Diskon</span>
                <div className="flex items-center gap-1.5">
                  <div className="flex rounded-md border border-border bg-background p-0.5">
                    {(["nominal", "percent"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => changeDiscountType(type)}
                        className={cn(
                          "rounded px-2 py-1 text-[11px] font-medium",
                          cart.discountType === type
                            ? "bg-primary-solid text-primary-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {type === "nominal" ? "Rp" : "%"}
                      </button>
                    ))}
                  </div>
                  {cart.discountType === "nominal" ? (
                    <MoneyInput
                      className="h-8 w-28 text-xs"
                      value={cart.discountValue}
                      onValueChange={(v) => onDiscountChange("nominal", v)}
                    />
                  ) : (
                    <div className="relative">
                      <Input
                        inputMode="numeric"
                        className="h-8 w-20 pr-7 text-right text-xs"
                        value={cart.discountValue || ""}
                        placeholder="0"
                        onChange={(e) => {
                          const v = Number(e.target.value.replace(/\D/g, "")) || 0;
                          onDiscountChange("percent", Math.min(100, v));
                        }}
                      />
                      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        %
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">{formatRupiah(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Diskon</span>
                    <span className="tabular-nums">-{formatRupiah(discountAmount)}</span>
                  </div>
                )}
                {settings.taxPercent > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Pajak ({settings.taxPercent}%)</span>
                    <span className="tabular-nums">{formatRupiah(tax)}</span>
                  </div>
                )}
                {settings.servicePercent > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Service ({settings.servicePercent}%)</span>
                    <span className="tabular-nums">{formatRupiah(service)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                  <span>Total</span>
                  <span className="tabular-nums">{formatRupiah(total)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border p-4">
        <Button
          className="h-12 w-full text-base font-semibold"
          disabled={cart.items.length === 0}
          onClick={onPay}
        >
          Bayar · {formatRupiah(total)}
        </Button>
      </div>
    </div>
  );
}
