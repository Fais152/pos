"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Coffee,
  Cookie,
  CupSoda,
  Printer,
  Search,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CartPanel, type Shortage } from "@/components/pos/cart-panel";
import { PaymentDialog } from "@/components/pos/payment-dialog";
import { ReceiptView } from "@/components/orders/receipt-view";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/layout/empty-state";
import { useMockDb } from "@/hooks/use-mock-db";
import { useCart } from "@/hooks/use-cart";
import { useSession } from "@/hooks/use-session";
import { formatRupiah } from "@/lib/format";
import { getWitaDateString } from "@/lib/format";
import { summarize } from "@/lib/report";
import { printSection } from "@/lib/print";
import type { Category, Order, OrderItem, Product } from "@/lib/types";
import { cn, createId } from "@/lib/utils";

function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const lower = name.toLowerCase();
  if (lower.includes("kopi")) return <Coffee className={className} />;
  if (lower.includes("non") || lower.includes("teh") || lower.includes("jus"))
    return <CupSoda className={className} />;
  if (lower.includes("snack") || lower.includes("dessert") || lower.includes("kue"))
    return <Cookie className={className} />;
  return <UtensilsCrossed className={className} />;
}

function ProductTile({
  product,
  category,
  qtyInCart,
  onAdd,
}: {
  product: Product;
  category?: Category;
  qtyInCart: number;
  onAdd: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="group relative flex min-h-[132px] flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 active:translate-y-0"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CategoryIcon name={category?.name ?? ""} className="h-5 w-5" />
        </div>
        {qtyInCart > 0 && (
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary-solid px-1.5 text-xs font-bold text-primary-foreground">
            {qtyInCart}
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug">{product.name}</p>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-sm font-bold text-primary">{formatRupiah(product.price)}</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-primary transition-colors group-hover:bg-primary-solid group-hover:text-primary-foreground">
            <span className="text-base leading-none">+</span>
          </span>
        </div>
      </div>
    </button>
  );
}

export default function KasirPage() {
  const db = useMockDb();
  const cart = useCart();
  const { user } = useSession();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [cartOpen, setCartOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [orderId, setOrderId] = useState(() => createId("order"));
  const [receipt, setReceipt] = useState<{ order: Order; items: OrderItem[] } | null>(null);

  const categories = [...db.categories].sort((a, b) => a.sortOrder - b.sortOrder);
  const activeProducts = db.products.filter((p) => p.isActive);

  const syncedCart = {
    ...cart.state,
    items: cart.state.items.map((item) => {
      const product = db.products.find((p) => p.id === item.productId);
      return product
        ? { ...item, productName: product.name, unitPrice: product.price }
        : item;
    }),
  };

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return activeProducts.filter((p) => {
      if (activeCategory !== "all" && p.categoryId !== activeCategory) return false;
      if (query && !p.name.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [activeProducts, activeCategory, search]);

  const subtotal = syncedCart.items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
  const discountAmount =
    cart.state.discountType === "percent"
      ? Math.min(subtotal, Math.round((subtotal * cart.state.discountValue) / 100))
      : Math.min(subtotal, cart.state.discountValue);
  const base = Math.max(0, subtotal - discountAmount);
  const tax = Math.round((base * db.settings.taxPercent) / 100);
  const service = Math.round((base * db.settings.servicePercent) / 100);
  const total = base + tax + service;
  const itemCount = syncedCart.items.reduce((sum, i) => sum + i.qty, 0);

  const shortages = useMemo<Shortage[]>(() => {
    const needed = new Map<string, number>();
    cart.state.items.forEach((item) => {
      db.recipes
        .filter((r) => r.productId === item.productId)
        .forEach((r) => {
          needed.set(
            r.ingredientId,
            (needed.get(r.ingredientId) ?? 0) + r.qtyPerPortion * item.qty
          );
        });
    });
    return db.ingredients
      .filter((ing) => (needed.get(ing.id) ?? 0) > ing.currentStock)
      .map((ing) => ({
        name: ing.name,
        unit: ing.unit,
        needed: needed.get(ing.id) ?? 0,
        available: ing.currentStock,
      }));
  }, [cart.state.items, db.recipes, db.ingredients]);

  const todaySummary = useMemo(
    () =>
      summarize(db.orders, db.orderItems, {
        dateKey: getWitaDateString(),
      }),
    [db.orders, db.orderItems]
  );

  const cashierName =
    db.users.find((u) => u.id === user?.id)?.name ?? user?.name ?? "Kasir";

  function qtyInCart(productId: string) {
    return cart.state.items.find((i) => i.productId === productId)?.qty ?? 0;
  }

  const cartPanel = (
    <CartPanel
      cart={syncedCart}
      settings={db.settings}
      shortages={shortages}
      onQtyChange={cart.setQty}
      onRemove={cart.removeItem}
      onNoteChange={cart.setNote}
      onOrderTypeChange={cart.setOrderType}
      onTableLabelChange={cart.setTableLabel}
      onDiscountChange={cart.setDiscount}
      onClear={() => {
        cart.clear();
        setOrderId(createId("order"));
      }}
      onPay={() => setPaymentOpen(true)}
    />
  );

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <PageHeader
          title="Kasir"
          description="Pilih menu, atur pesanan, lalu selesaikan pembayaran."
          className="mb-0"
        />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border border-border bg-card px-3 py-1.5">
            Hari ini: <strong className="text-foreground">{todaySummary.orderCount}</strong>{" "}
            transaksi
          </span>
          <span className="hidden rounded-full border border-border bg-card px-3 py-1.5 sm:inline">
            Omzet: <strong className="text-foreground">{formatRupiah(todaySummary.revenue)}</strong>
          </span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="min-w-0">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama menu…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 bg-card pl-9"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              {filteredProducts.length} menu tersedia
            </div>
          </div>

          <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={cn(
                "flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors",
                activeCategory === "all"
                  ? "border-primary bg-primary-solid text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              )}
            >
              Semua
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors",
                  activeCategory === cat.id
                    ? "border-primary bg-primary-solid text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                )}
              >
                <CategoryIcon name={cat.name} className="h-3.5 w-3.5" />
                {cat.name}
              </button>
            ))}
          </div>

          {filteredProducts.length === 0 ? (
            <EmptyState
              icon={<Search className="h-8 w-8" />}
              title="Menu tidak ditemukan"
              description="Coba kata kunci lain atau pilih kategori berbeda."
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <ProductTile
                  key={product.id}
                  product={product}
                  category={categories.find((c) => c.id === product.categoryId)}
                  qtyInCart={qtyInCart(product.id)}
                  onAdd={() => cart.addItem(product)}
                />
              ))}
            </div>
          )}
        </section>

        <aside className="hidden lg:block">
          <div className="sticky top-24 h-[calc(100dvh-7.5rem)]">{cartPanel}</div>
        </aside>
      </div>

      {itemCount > 0 && (
        <div className="fixed inset-x-3 bottom-[72px] z-20 lg:hidden">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="flex w-full items-center justify-between gap-3 rounded-xl bg-primary-solid px-4 py-3 text-primary-foreground shadow-xl shadow-black/10"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <ShoppingBag className="h-4 w-4" />
              {itemCount} item
            </span>
            <span className="flex items-center gap-2 text-sm font-bold">
              {formatRupiah(total)}
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">Lihat</span>
            </span>
          </button>
        </div>
      )}

      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="left-0 top-0 h-[100dvh] w-full max-w-md translate-x-0 translate-y-0 rounded-none border-0 p-0 sm:left-1/2 sm:top-1/2 sm:h-[90dvh] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Keranjang pesanan</DialogTitle>
            <DialogDescription>Atur item dan lanjutkan pembayaran.</DialogDescription>
          </DialogHeader>
          {cartPanel}
        </DialogContent>
      </Dialog>

      {user && paymentOpen && (
        <PaymentDialog
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          cart={syncedCart}
          total={total}
          cashierId={user.id}
          shortages={shortages}
          orderId={orderId}
          onSuccess={(order, items) => {
            setPaymentOpen(false);
            setCartOpen(false);
            setReceipt({ order, items });
            cart.clear();
            setOrderId(createId("order"));
          }}
        />
      )}

      <Dialog open={!!receipt} onOpenChange={(open) => !open && setReceipt(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transaksi berhasil</DialogTitle>
            <DialogDescription>
              {receipt?.order.orderNo} · {formatRupiah(receipt?.order.total ?? 0)}
            </DialogDescription>
          </DialogHeader>

          {receipt && (
            <div className="max-h-[55dvh] overflow-y-auto rounded-lg border border-border bg-muted/40 p-2">
              <ReceiptView
                id="receipt-print"
                order={receipt.order}
                items={receipt.items}
                cashierName={cashierName}
                settings={db.settings}
              />
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setReceipt(null)}>
              Transaksi Baru
            </Button>
            <Link href="/transaksi">
              <Button variant="secondary" className="w-full sm:w-auto">
                Lihat Riwayat
              </Button>
            </Link>
            <Button onClick={() => printSection("receipt-print")}>
              <Printer className="mr-2 h-4 w-4" /> Cetak Struk
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
