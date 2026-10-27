"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Package,
  ReceiptText,
  Settings,
  ShoppingCart,
  UtensilsCrossed,
  FileBarChart2,
  X,
} from "lucide-react";
import { useState } from "react";
import { BrandLogo, BrandMark } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useSession } from "@/hooks/use-session";
import { SessionProvider } from "@/components/auth/session-provider";
import { useMockDb } from "@/hooks/use-mock-db";
import { lowStockAlerts } from "@/lib/report";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  href: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/kasir", label: "Kasir", shortLabel: "Kasir", icon: ShoppingCart, roles: ["owner", "kasir"] },
  { href: "/transaksi", label: "Riwayat Transaksi", shortLabel: "Transaksi", icon: ReceiptText, roles: ["owner", "kasir"] },
  { href: "/menu", label: "Menu & Kategori", shortLabel: "Menu", icon: UtensilsCrossed, roles: ["owner"] },
  { href: "/stok", label: "Stok Bahan Baku", shortLabel: "Stok", icon: Package, roles: ["owner", "kasir"] },
  { href: "/dashboard", label: "Dashboard", shortLabel: "Dashboard", icon: LayoutDashboard, roles: ["owner"] },
  { href: "/laporan", label: "Laporan & Rekap", shortLabel: "Laporan", icon: FileBarChart2, roles: ["owner"] },
  { href: "/pengaturan", label: "Pengaturan", shortLabel: "Atur", icon: Settings, roles: ["owner"] },
];

export function AppShell({
  children,
  roles = ["owner", "kasir"],
}: {
  children: React.ReactNode;
  roles?: Role[];
}) {
  const session = useSession();
  const { user, loading, logout } = session;
  const router = useRouter();
  const pathname = usePathname();
  const db = useMockDb();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          <p className="text-sm">Menyiapkan aplikasi...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (!roles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full rounded-xl border border-border bg-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <X className="h-6 w-6 text-destructive" />
          </div>
          <h1 className="text-lg font-semibold">Akses ditolak</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Halaman ini hanya dapat dibuka oleh owner. Anda masuk sebagai kasir.
          </p>
          <Button className="mt-6" onClick={() => router.replace("/kasir")}>
            Kembali ke Kasir
          </Button>
        </div>
      </div>
    );
  }

  const allowedNav = NAV_ITEMS.filter((item) => item.roles.includes(user.role));
  const alerts = lowStockAlerts(db.ingredients);

  return (
    <SessionProvider value={session}>
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="px-5 py-5">
          <BrandLogo className="h-12 w-44" priority />
          <p className="mt-2 text-xs text-sidebar-foreground/60">Kasir & Analitik</p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {allowedNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-white"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.href === "/stok" && alerts.length > 0 && (
                  <span className="rounded-full bg-destructive-solid px-1.5 py-0.5 text-[10px] font-bold text-destructive-foreground">
                    {alerts.length}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="mb-3 flex items-center gap-3 rounded-lg bg-sidebar-accent/50 px-3 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-solid text-sm font-bold text-primary-foreground">
              {user.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="text-[11px] capitalize text-sidebar-foreground/60">
                {user.role === "owner" ? "Owner" : "Kasir"}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur">
          <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 lg:hidden"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Buka navigasi"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold sm:text-base">
                {db.settings.cafeName}
              </p>
              <p className="hidden text-xs text-muted-foreground sm:block">
                {new Intl.DateTimeFormat("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  timeZone: "Asia/Makassar",
                }).format(new Date())}{" "}
                · WITA
              </p>
            </div>
            {alerts.length > 0 && (
              <Link href="/stok">
                <Badge className="hidden border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15 sm:inline-flex">
                  {alerts.length} stok menipis
                </Badge>
              </Link>
            )}
            <ThemeToggle />
            <Badge className="hidden border-primary/25 bg-primary/10 text-primary sm:inline-flex">
              {user.role === "owner" ? "Owner" : "Kasir"}
            </Badge>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-solid text-sm font-bold text-primary-foreground lg:hidden">
              {user.name.slice(0, 1).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="px-4 pb-28 pt-5 sm:px-6 sm:pt-6 lg:pb-10">{children}</main>
      </div>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/40"
            aria-label="Tutup navigasi"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto bg-sidebar p-4 text-sidebar-foreground shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BrandMark className="h-10 w-10" />
                <div>
                  <p className="font-semibold leading-tight">Koetaw</p>
                  <p className="text-xs text-sidebar-foreground/60">Kasir & Analitik</p>
                </div>
              </div>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="rounded-md p-2 hover:bg-sidebar-accent"
                aria-label="Tutup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-1">
              {allowedNav.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                      active
                        ? "bg-sidebar-accent text-white"
                        : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-white"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1">{item.label}</span>
                    {item.href === "/stok" && alerts.length > 0 && (
                      <span className="rounded-full bg-destructive-solid px-1.5 py-0.5 text-[10px] font-bold text-destructive-foreground">
                        {alerts.length}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-4 border-t border-white/10 pt-4">
              <button
                onClick={logout}
                className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card lg:hidden">
        <div className="flex items-stretch gap-0.5 overflow-x-auto px-1.5 py-1">
          {allowedNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-[64px] flex-1 flex-col items-center gap-0.5 rounded-lg px-1.5 py-2 text-[10px] font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="truncate">{item.shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
    </SessionProvider>
  );
}
