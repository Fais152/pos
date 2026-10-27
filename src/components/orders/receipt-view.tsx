import type { Order, OrderItem, Settings } from "@/lib/types";
import { formatRupiah } from "@/lib/format";
import { ORDER_TYPE_LABELS, PAYMENT_LABELS } from "@/lib/report";
import { formatInTimeZone } from "date-fns-tz";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";

export function ReceiptView({
  order,
  items,
  cashierName,
  settings,
  className,
  id,
}: {
  order: Order;
  items: OrderItem[];
  cashierName: string;
  settings: Settings;
  className?: string;
  id?: string;
}) {
  const createdAt = formatInTimeZone(
    new Date(order.createdAt),
    "Asia/Makassar",
    "d MMM yyyy, HH:mm",
    { locale: localeId }
  );

  return (
    <div
      id={id}
      className={cn(
        "receipt-sheet mx-auto w-full max-w-[360px] bg-white p-5 text-[12px] leading-relaxed text-neutral-900",
        className
      )}
    >
      <div className="text-center">
        <p className="text-sm font-bold uppercase tracking-wide">{settings.cafeName}</p>
        {settings.address && <p className="mt-0.5 text-[11px]">{settings.address}</p>}
        {settings.phone && <p className="text-[11px]">Telp. {settings.phone}</p>}
      </div>

      <div className="my-3 border-t border-dashed border-neutral-400" />

      <div className="space-y-0.5">
        <div className="flex justify-between">
          <span>No.</span>
          <span className="font-semibold">{order.orderNo}</span>
        </div>
        <div className="flex justify-between">
          <span>Waktu</span>
          <span>{createdAt} WITA</span>
        </div>
        <div className="flex justify-between">
          <span>Tipe</span>
          <span>
            {ORDER_TYPE_LABELS[order.orderType]}
            {order.orderType === "dine_in" && order.tableLabel
              ? ` · ${order.tableLabel}`
              : ""}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Kasir</span>
          <span>{cashierName}</span>
        </div>
      </div>

      <div className="my-3 border-t border-dashed border-neutral-400" />

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id}>
            <div className="flex justify-between gap-2">
              <span className="font-medium">{item.productName}</span>
              <span className="shrink-0 tabular-nums">{formatRupiah(item.lineTotal)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-neutral-600">
              <span>
                {item.qty} x {formatRupiah(item.unitPrice)}
              </span>
            </div>
            {item.note && (
              <p className="text-[11px] italic text-neutral-600">Catatan: {item.note}</p>
            )}
          </div>
        ))}
      </div>

      <div className="my-3 border-t border-dashed border-neutral-400" />

      <div className="space-y-1 tabular-nums">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatRupiah(order.subtotal)}</span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between">
            <span>Diskon</span>
            <span>-{formatRupiah(order.discount)}</span>
          </div>
        )}
        {order.tax > 0 && (
          <div className="flex justify-between">
            <span>Pajak</span>
            <span>{formatRupiah(order.tax)}</span>
          </div>
        )}
        {order.serviceCharge > 0 && (
          <div className="flex justify-between">
            <span>Service</span>
            <span>{formatRupiah(order.serviceCharge)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-neutral-400 pt-1 text-sm font-bold">
          <span>TOTAL</span>
          <span>{formatRupiah(order.total)}</span>
        </div>
        <div className="flex justify-between">
          <span>Bayar ({PAYMENT_LABELS[order.paymentMethod]})</span>
          <span>{formatRupiah(order.cashReceived)}</span>
        </div>
        {order.paymentMethod === "cash" && (
          <div className="flex justify-between">
            <span>Kembali</span>
            <span>{formatRupiah(order.changeAmount)}</span>
          </div>
        )}
      </div>

      {order.status === "void" && (
        <div className="mt-3 rounded border border-neutral-400 p-2 text-center text-[11px] font-bold uppercase">
          Transaksi dibatalkan (VOID)
          {order.voidReason ? <div className="font-normal normal-case">Alasan: {order.voidReason}</div> : null}
        </div>
      )}

      <div className="my-3 border-t border-dashed border-neutral-400" />

      <p className="text-center text-[11px]">{settings.receiptFooter}</p>
      <p className="mt-2 text-center text-[10px] text-neutral-500">
        Struk digital · {settings.cafeName}
      </p>
    </div>
  );
}
