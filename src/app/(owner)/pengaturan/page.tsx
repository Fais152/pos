"use client";

import { useState } from "react";
import {
  Building2,
  Clock3,
  KeyRound,
  Receipt,
  ShieldCheck,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useAppSession } from "@/components/auth/session-provider";
import { useMockDb } from "@/hooks/use-mock-db";
import { mockDb } from "@/lib/mock-service";
import { formatWitaDate } from "@/lib/format";
import type { Settings, User } from "@/lib/types";
import { cn, createId } from "@/lib/utils";

function SettingsForm({ settings }: { settings: Settings }) {
  const [form, setForm] = useState<Settings>(settings);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    if (saving) return;
    if (!form.cafeName.trim()) {
      toast.error("Nama kafe wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      await mockDb.updateSettings({
        ...form,
        cafeName: form.cafeName.trim(),
        taxPercent: Number.isFinite(form.taxPercent)
          ? Math.max(0, Math.min(100, form.taxPercent))
          : 0,
        servicePercent: Number.isFinite(form.servicePercent)
          ? Math.max(0, Math.min(100, form.servicePercent))
          : 0,
      });
      toast.success("Pengaturan kafe disimpan.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan pengaturan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Profil Kafe</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cafe-name">Nama kafe</Label>
            <Input
              id="cafe-name"
              value={form.cafeName}
              onChange={(e) => set("cafeName", e.target.value)}
              maxLength={120}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cafe-address">Alamat</Label>
            <Input
              id="cafe-address"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              maxLength={300}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cafe-phone">Nomor telepon</Label>
            <Input
              id="cafe-phone"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              maxLength={40}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cafe-timezone">Zona waktu</Label>
            <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-muted/50 px-3 text-sm">
              <Clock3 className="h-4 w-4 text-muted-foreground" />
              Asia/Makassar (WITA)
              <Badge className="ml-auto border-border bg-card text-muted-foreground">Tetap</Badge>
            </div>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cafe-footer">Teks kaki struk</Label>
            <Textarea
              id="cafe-footer"
              rows={2}
              value={form.receiptFooter}
              onChange={(e) => set("receiptFooter", e.target.value)}
              maxLength={500}
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <Receipt className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Pajak & Service</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="tax">Pajak (%)</Label>
            <Input
              id="tax"
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={form.taxPercent}
              onChange={(e) => set("taxPercent", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="service">Service charge (%)</Label>
            <Input
              id="service"
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={form.servicePercent}
              onChange={(e) => set("servicePercent", Number(e.target.value))}
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Default 0%. Perubahan hanya berlaku untuk transaksi baru.
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan Pengaturan"}
        </Button>
      </div>
    </div>
  );
}

function CashierDialog({ onClose }: { onClose: () => void }) {
  const db = useMockDb();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [draftId] = useState(() => createId("user"));

  async function save() {
    if (saving) return;
    const normalizedUsername = username.trim();
    if (!name.trim() || !normalizedUsername || password.length < 8) {
      toast.error("Lengkapi nama, username, dan password minimal 8 karakter.");
      return;
    }
    if (normalizedUsername.length < 3) {
      toast.error("Username minimal 3 karakter.");
      return;
    }
    if (!/^[a-zA-Z0-9._-]+$/.test(normalizedUsername)) {
      toast.error("Username hanya boleh huruf, angka, titik, garis bawah, atau strip.");
      return;
    }
    const exists = db.users.some(
      (u) =>
        u.id !== draftId &&
        u.username.toLowerCase() === normalizedUsername.toLowerCase()
    );
    if (exists) {
      toast.error("Username sudah dipakai.");
      return;
    }
    setSaving(true);
    try {
      await mockDb.saveUser({
        id: draftId,
        name: name.trim(),
        username: normalizedUsername.toLowerCase(),
        password,
        isActive: true,
      });
      toast.success("Akun kasir dibuat.");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal membuat akun kasir.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !saving) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Akun Kasir</DialogTitle>
          <DialogDescription>
            Kasir dapat membuat transaksi dan melihat stok, tanpa akses laporan atau menu.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="cashier-name">Nama lengkap</Label>
            <Input
              id="cashier-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cashier-username">Username</Label>
            <Input
              id="cashier-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Mis. kasir3"
              autoComplete="off"
              maxLength={80}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cashier-password">Password awal</Label>
            <Input
              id="cashier-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              maxLength={200}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Membuat..." : "Buat Akun"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  const { user: currentUser, logout } = useAppSession();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const isSelf = currentUser?.id === user.id;

  async function save() {
    if (saving) return;
    if (password.length < 8) {
      toast.error("Password minimal 8 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Konfirmasi password belum sama.");
      return;
    }
    setSaving(true);
    try {
      await mockDb.saveUser({ ...user, password });
      onClose();
      if (isSelf) {
        toast.success("Password diperbarui. Silakan masuk lagi.");
        await logout();
      } else {
        toast.success(`Password ${user.name} berhasil direset.`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mereset password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !saving) onClose();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isSelf ? "Ganti Password" : "Reset Password"}</DialogTitle>
          <DialogDescription>
            {isSelf
              ? `Buat password baru untuk akun Anda (@${user.username}). Setelah disimpan, Anda akan keluar.`
              : `Atur password baru untuk ${user.name} (@${user.username}). Sesi kasir ini akan berakhir.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="new-password">Password baru</Label>
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">Minimal 8 karakter.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Ulangi password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              maxLength={200}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan Password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PengaturanPage() {
  const db = useMockDb();
  const { user: currentUser } = useAppSession();
  const [cashierOpen, setCashierOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<User | null>(null);

  const cashiers = db.users.filter((u) => u.role === "kasir");

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        title="Pengaturan"
        description="Kelola profil kafe, pajak, dan akun kasir."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <SettingsForm
          key={`${db.settings.cafeName}|${db.settings.address}|${db.settings.phone}|${db.settings.taxPercent}|${db.settings.servicePercent}|${db.settings.receiptFooter}`}
          settings={db.settings}
        />

        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">Akun Kasir</h2>
              </div>
              <Button size="sm" className="gap-1.5" onClick={() => setCashierOpen(true)}>
                <UserPlus className="h-3.5 w-3.5" /> Tambah
              </Button>
            </div>

            <div className="space-y-2.5">
              {cashiers.map((cashier) => (
                <div
                  key={cashier.id}
                  className="rounded-lg border border-border/70 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{cashier.name}</p>
                      <p className="text-xs text-muted-foreground">
                        @{cashier.username} · dibuat{" "}
                        {formatWitaDate(cashier.createdAt, "d MMM yyyy")}
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        cashier.isActive
                          ? "border-success/30 bg-success/10 text-success"
                          : "border-border bg-muted text-muted-foreground"
                      )}
                    >
                      {cashier.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => setResetTarget(cashier)}
                    >
                      <KeyRound className="h-3.5 w-3.5" /> Reset Password
                    </Button>
                    <Button
                      variant={cashier.isActive ? "ghost" : "secondary"}
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={async () => {
                        try {
                          await mockDb.toggleUserActive(cashier.id);
                          toast.success(
                            cashier.isActive
                              ? `Akun ${cashier.name} dinonaktifkan.`
                              : `Akun ${cashier.name} diaktifkan.`
                          );
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Gagal mengubah status akun.");
                        }
                      }}
                    >
                      <UserCog className="h-3.5 w-3.5" />
                      {cashier.isActive ? "Nonaktifkan" : "Aktifkan"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {cashiers.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Belum ada akun kasir.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Akun Owner</h2>
            </div>
            <div className="rounded-lg border border-border/70 p-3">
              <p className="text-sm font-medium">{currentUser?.name}</p>
              <p className="text-xs text-muted-foreground">
                @{currentUser?.username} · akses penuh
              </p>
              {currentUser && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 gap-1.5"
                  onClick={() => setResetTarget(currentUser)}
                >
                  <KeyRound className="h-3.5 w-3.5" /> Ganti Password
                </Button>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Owner tidak dapat menonaktifkan akunnya sendiri.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
            <p className="flex items-center gap-1.5 font-semibold text-foreground">
              <ShieldCheck className="h-3.5 w-3.5" /> Keamanan data
            </p>
            <p className="mt-1.5">
              Data tersimpan di database, password ter-hash, dan sesi memakai cookie
              httpOnly yang berakhir setelah 12 jam tidak aktif.
            </p>
          </div>
        </div>
      </div>

      {cashierOpen && <CashierDialog onClose={() => setCashierOpen(false)} />}
      {resetTarget && (
        <ResetPasswordDialog
          user={resetTarget}
          onClose={() => setResetTarget(null)}
        />
      )}

    </div>
  );
}

