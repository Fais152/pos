"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, LockKeyhole, UserRound } from "lucide-react";
import { toast } from "sonner";
import { BrandLogo, BrandMark } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/hooks/use-session";

export default function LoginPage() {
  const { user, loading, login } = useSession();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace(user.role === "owner" ? "/dashboard" : "/kasir");
    }
  }, [loading, user, router]);

  if (!loading && user) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const result = await login(username, password);
    if (result.ok) {
      toast.success(`Selamat datang, ${result.user?.name ?? username}!`);
      router.replace(result.user?.role === "kasir" ? "/kasir" : "/dashboard");
    } else {
      toast.error(result.error ?? "Gagal masuk.");
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-background lg:grid lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-sidebar px-12 py-14 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between lg:border-r lg:border-border">
        <div className="relative">
          <BrandLogo className="h-14 w-52" priority />
          <p className="mt-3 text-sm text-sidebar-foreground/65">Kasir & Analitik Penjualan</p>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Catat transaksi cepat, stok tetap rapi, laporan siap dalam sekejap.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-sidebar-foreground/70">
            Dirancang untuk satu kafe dengan alur sederhana: kasir, stok bahan baku,
            dashboard penjualan, hingga rekap harian dan bulanan.
          </p>
        </div>

        <p className="relative text-xs text-sidebar-foreground/65">
          Zona waktu WITA (Asia/Makassar) · Mata uang Rupiah
        </p>
      </div>

      <div className="flex min-h-screen items-center justify-center px-5 py-10 lg:min-h-0">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 lg:hidden">
              <BrandMark className="h-11 w-11" />
              <div>
                <p className="font-bold leading-tight">Koetaw</p>
                <p className="text-xs text-muted-foreground">Kasir & Analitik</p>
              </div>
            </div>
            <ThemeToggle className="ml-auto" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight">Masuk ke aplikasi</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Gunakan akun yang diberikan owner kafe.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username"
                  name="username"
                  className="h-11 pl-9"
                  placeholder="Mis. kasir1"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className="h-11 pl-9 pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="h-11 w-full text-sm" disabled={submitting || loading}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memeriksa…
                </>
              ) : (
                "Masuk"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}


