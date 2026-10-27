"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeftRight,
  Boxes,
  ClipboardCheck,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { EmptyState } from "@/components/layout/empty-state";
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
import { formatRupiah } from "@/lib/format";
import { lowStockAlerts, stockValue } from "@/lib/report";
import { mockDb } from "@/lib/mock-service";
import type { Ingredient } from "@/lib/types";
import { cn, createId } from "@/lib/utils";

function IngredientFormDialog({
  ingredient,
  createdBy,
  unitLocked = false,
  onClose,
}: {
  ingredient: Ingredient | null;
  createdBy: string;
  unitLocked?: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState(ingredient?.name ?? "");
  const [unit, setUnit] = useState<Ingredient["unit"]>(ingredient?.unit ?? "g");
  const [currentStock, setCurrentStock] = useState(ingredient?.currentStock ?? 0);
  const [minStock, setMinStock] = useState(ingredient?.minStock ?? 0);
  const [costPerUnit, setCostPerUnit] = useState(ingredient?.costPerUnit ?? 0);
  const [isActive, setIsActive] = useState(ingredient?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [draftId] = useState(() => ingredient?.id ?? createId("ing"));

  async function save() {
    if (saving) return;
    if (!name.trim()) {
      toast.error("Nama bahan wajib diisi.");
      return;
    }
    if (!Number.isFinite(currentStock) || !Number.isFinite(minStock) || !Number.isFinite(costPerUnit)) {
      toast.error("Isi angka yang valid untuk stok dan harga.");
      return;
    }
    if (!ingredient && currentStock < 0) {
      toast.error("Stok awal tidak boleh negatif.");
      return;
    }
    if (costPerUnit < 0 || minStock < 0) {
      toast.error("Batas minimum dan harga tidak boleh negatif.");
      return;
    }
    const payload: Ingredient = {
      id: draftId,
      name: name.trim(),
      unit,
      currentStock,
      minStock,
      costPerUnit,
      isActive,
    };
    setSaving(true);
    try {
      if (ingredient) {
        await mockDb.saveIngredient(payload);
        toast.success("Data bahan diperbarui.");
      } else {
        await mockDb.createIngredient(payload, createdBy);
        toast.success("Bahan baru ditambahkan.");
      }
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan bahan.");
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{ingredient ? "Edit Bahan Baku" : "Tambah Bahan Baku"}</DialogTitle>
          <DialogDescription>
            Satuan mengikuti pemakaian resep: gram, mililiter, atau pcs.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="ingredient-name">Nama bahan</Label>
            <Input
              id="ingredient-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mis. Biji Kopi Arabika"
              maxLength={120}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ingredient-unit">Satuan</Label>
            <select
              id="ingredient-unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value as Ingredient["unit"])}
              disabled={unitLocked}
              className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="g">gram (g)</option>
              <option value="ml">mililiter (ml)</option>
              <option value="pcs">pcs</option>
            </select>
            {unitLocked && (
              <p className="text-[11px] text-muted-foreground">
                Satuan terkunci karena bahan sudah dipakai di resep atau punya riwayat stok.
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ingredient-min">Batas minimum</Label>
            <Input
              id="ingredient-min"
              type="number"
              min={0}
              value={minStock}
              onChange={(e) => setMinStock(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ingredient-stock">Stok saat ini</Label>
            <Input
              id="ingredient-stock"
              type="number"
              min={0}
              value={currentStock}
              disabled={!!ingredient}
              onChange={(e) => setCurrentStock(Number(e.target.value))}
            />
            {ingredient && (
              <p className="text-[11px] text-muted-foreground">
                Stok hanya berubah lewat restock, opname, atau penjualan.
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ingredient-cost">Harga beli / satuan</Label>
            <Input
              id="ingredient-cost"
              type="number"
              min={0}
              step="0.01"
              value={costPerUnit}
              onChange={(e) => setCostPerUnit(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Status bahan</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setIsActive(true)}
              >
                Aktif
              </Button>
              <Button
                type="button"
                variant={!isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setIsActive(false)}
              >
                Nonaktif
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan Bahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type StockMode = "restock" | "opname" | "waste";

function StockActionDialog({
  ingredient,
  mode,
  createdBy,
  onClose,
}: {
  ingredient: Ingredient;
  mode: StockMode;
  createdBy: string;
  onClose: () => void;
}) {
  const [activeMode, setActiveMode] = useState<StockMode>(mode);
  const [qty, setQty] = useState(mode === "opname" ? ingredient.currentStock : 0);
  const [unitCost, setUnitCost] = useState(ingredient.costPerUnit);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const diff = activeMode === "opname" ? qty - ingredient.currentStock : 0;

  async function submit() {
    if (saving) return;
    if (activeMode === "restock") {
      if (qty <= 0) {
        toast.error("Jumlah restock harus lebih dari 0.");
        return;
      }
    } else if (activeMode === "opname") {
      if (qty < 0) {
        toast.error("Jumlah fisik tidak boleh negatif.");
        return;
      }
      if (note.trim().length < 3) {
        toast.error("Alasan penyesuaian minimal 3 karakter.");
        return;
      }
    } else {
      if (qty <= 0) {
        toast.error("Jumlah bahan terbuang harus lebih dari 0.");
        return;
      }
      if (note.trim().length < 3) {
        toast.error("Alasan bahan terbuang minimal 3 karakter.");
        return;
      }
    }

    setSaving(true);
    try {
      if (activeMode === "restock") {
        await mockDb.restockIngredient({
          ingredientId: ingredient.id,
          qty,
          unitCost,
          note: note.trim() || "Restock bahan",
          createdBy,
        });
        toast.success(`Stok ${ingredient.name} bertambah ${qty} ${ingredient.unit}.`);
      } else if (activeMode === "opname") {
        await mockDb.adjustOrWasteStock({
          ingredientId: ingredient.id,
          type: "adjustment",
          countedQty: qty,
          note: note.trim(),
          createdBy,
        });
        toast.success("Stok opname tersimpan.");
      } else {
        await mockDb.adjustOrWasteStock({
          ingredientId: ingredient.id,
          type: "waste",
          qtyChange: -qty,
          note: note.trim(),
          createdBy,
        });
        toast.success("Bahan terbuang tercatat.");
      }
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan perubahan stok.");
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{ingredient.name}</DialogTitle>
          <DialogDescription>
            Stok saat ini {Math.round(ingredient.currentStock)} {ingredient.unit} · minimum{" "}
            {ingredient.minStock} {ingredient.unit}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
          {(
            [
              { key: "restock", label: "Restock", icon: Plus },
              { key: "opname", label: "Opname", icon: ClipboardCheck },
              { key: "waste", label: "Terbuang", icon: Trash2 },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveMode(tab.key);
                  setQty(tab.key === "opname" ? ingredient.currentStock : 0);
                  setNote("");
                }}
                className={cn(
                  "flex min-h-10 items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors",
                  activeMode === tab.key
                    ? "bg-background text-foreground"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          {activeMode === "restock" && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="restock-qty">Jumlah masuk ({ingredient.unit})</Label>
                  <Input
                    id="restock-qty"
                    type="number"
                    min={0}
                    value={qty || ""}
                    onChange={(e) => setQty(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="restock-cost">Harga beli / {ingredient.unit}</Label>
                  <Input
                    id="restock-cost"
                    type="number"
                    min={0}
                    step="0.01"
                    value={unitCost}
                    onChange={(e) => setUnitCost(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="restock-note">Catatan (supplier, nota, dll.)</Label>
                <Textarea
                  id="restock-note"
                  rows={2}
                  placeholder="Mis. Supplier Kopi Nusantara, nota #123"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={300}
                />
              </div>
              <div className="rounded-lg bg-muted/60 px-3 py-2 text-sm">
                Stok setelah restock:{" "}
                <strong className="tabular-nums">
                  {Math.round(ingredient.currentStock + qty)} {ingredient.unit}
                </strong>
              </div>
            </>
          )}

          {activeMode === "opname" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="opname-qty">Jumlah fisik hasil hitung ({ingredient.unit})</Label>
                <Input
                  id="opname-qty"
                  type="number"
                  min={0}
                  value={qty || ""}
                  onChange={(e) => setQty(Number(e.target.value))}
                />
              </div>
              <div
                className={cn(
                  "rounded-lg px-3 py-2 text-sm",
                  diff === 0
                    ? "bg-success/10 text-success"
                    : "bg-warning/10 text-foreground"
                )}
              >
                Selisih:{" "}
                <strong className="tabular-nums">
                  {diff > 0 ? "+" : ""}
                  {Math.round(diff)} {ingredient.unit}
                </strong>
                {diff === 0 && " (sesuai sistem)"}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="opname-note">Alasan penyesuaian (wajib)</Label>
                <Textarea
                  id="opname-note"
                  rows={2}
                  placeholder="Mis. Selisih akibat tumpahan saat closing"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={300}
                />
              </div>
            </>
          )}

          {activeMode === "waste" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="waste-qty">Jumlah terbuang ({ingredient.unit})</Label>
                <Input
                  id="waste-qty"
                  type="number"
                  min={0}
                  value={qty || ""}
                  onChange={(e) => setQty(Number(e.target.value))}
                />
              </div>
              <div className="rounded-lg bg-destructive/5 px-3 py-2 text-sm text-destructive">
                Stok setelah dikurangi:{" "}
                <strong className="tabular-nums">
                  {Math.round(ingredient.currentStock - qty)} {ingredient.unit}
                </strong>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="waste-note">Alasan bahan terbuang (wajib)</Label>
                <Textarea
                  id="waste-note"
                  rows={2}
                  placeholder="Mis. Susu kedaluwarsa"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={300}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button
            onClick={submit}
            disabled={saving}
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function StokPage() {
  const db = useMockDb();
  const { user } = useAppSession();
  const isOwner = user?.role === "owner";
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "inactive">("all");
  const [formTarget, setFormTarget] = useState<{ ingredient: Ingredient | null } | null>(null);
  const [actionTarget, setActionTarget] = useState<{
    ingredient: Ingredient;
    mode: StockMode;
  } | null>(null);

  const alerts = lowStockAlerts(db.ingredients);
  const activeIngredients = db.ingredients.filter((i) => i.isActive);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return db.ingredients
      .filter((ing) => {
        if (filter === "low" && ing.currentStock > ing.minStock) return false;
        if (filter === "inactive" && ing.isActive) return false;
        if (query && !ing.name.toLowerCase().includes(query)) return false;
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [db.ingredients, filter, search]);

  const totalValue = stockValue(activeIngredients);
  const editingIngredient = formTarget?.ingredient ?? null;
  const unitLocked = editingIngredient
    ? db.recipes.some((recipe) => recipe.ingredientId === editingIngredient.id) ||
      db.stockMovements.some((movement) => movement.ingredientId === editingIngredient.id)
    : false;

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Stok Bahan Baku"
        description={
          isOwner
            ? "Pantau stok, catat pembelian, opname, dan bahan terbuang."
            : "Lihat ketersediaan bahan baku. Perubahan stok dilakukan oleh owner."
        }
        actions={
          isOwner && (
            <Button
              className="gap-2"
              onClick={() => setFormTarget({ ingredient: null })}
            >
              <Plus className="h-4 w-4" /> Tambah Bahan
            </Button>
          )
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          label="Jenis Bahan Aktif"
          value={String(activeIngredients.length)}
          hint={`${db.ingredients.length} bahan terdaftar`}
          icon={<Boxes className="h-4 w-4" />}
        />
        <StatCard
          label="Stok di Bawah Minimum"
          value={String(alerts.length)}
          hint={alerts.length ? "Perlu segera di-restock" : "Semua stok aman"}
          tone={alerts.length ? "destructive" : "success"}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <StatCard
          label="Nilai Stok (est.)"
          value={formatRupiah(Math.round(totalValue))}
          hint="Stok × harga beli per satuan"
          icon={<Wallet className="h-4 w-4" />}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      {alerts.length > 0 && (
        <div className="mb-4 rounded-xl border border-destructive/25 bg-destructive/5 p-3.5">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="text-sm">
              <p className="font-medium text-destructive">
                {alerts.length} bahan di bawah batas minimum
              </p>
              <p className="mt-0.5 text-muted-foreground">
                {alerts
                  .slice(0, 4)
                  .map((a) => a.ingredient.name)
                  .join(", ")}
                {alerts.length > 4 ? `, dan ${alerts.length - 4} lainnya` : ""}.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari bahan baku…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 bg-card pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(
            [
              { key: "all", label: "Semua" },
              { key: "low", label: "Menipis" },
              { key: "inactive", label: "Nonaktif" },
            ] as const
          ).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "min-h-10 rounded-md border px-3 text-sm font-medium transition-colors",
                filter === f.key
                  ? "border-primary bg-primary-solid text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Package className="h-8 w-8" />}
          title="Tidak ada bahan ditemukan"
          description="Coba ubah pencarian atau filter."
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-left text-xs font-medium text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Bahan</th>
                    <th className="px-4 py-3 text-right font-medium">Stok Saat Ini</th>
                    <th className="px-4 py-3 text-right font-medium">Minimum</th>
                    <th className="px-4 py-3 text-right font-medium">Harga / Satuan</th>
                    <th className="px-4 py-3 text-right font-medium">Nilai Stok</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    {isOwner && <th className="px-4 py-3 text-right font-medium">Aksi</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((ing) => {
                    const low = ing.currentStock <= ing.minStock;
                    const negative = ing.currentStock < 0;
                    return (
                      <tr
                        key={ing.id}
                        className="border-t border-border/70"
                      >
                        <td className="px-4 py-3">
                          {isOwner ? (
                            <Link
                              href={`/stok/${ing.id}`}
                              className="font-medium hover:text-primary hover:underline"
                            >
                              {ing.name}
                            </Link>
                          ) : (
                            <span className="font-medium">{ing.name}</span>
                          )}
                          <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            {ing.unit}
                          </span>
                          {!ing.isActive && (
                            <Badge className="ml-2 border-border bg-muted text-muted-foreground">
                              Nonaktif
                            </Badge>
                          )}
                        </td>
                        <td
                          className={cn(
                            "px-4 py-3 text-right font-semibold tabular-nums",
                            negative
                              ? "text-destructive"
                              : low
                                ? "text-warning"
                                : "text-foreground"
                          )}
                        >
                          {Math.round(ing.currentStock)} {ing.unit}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                          {ing.minStock} {ing.unit}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                          {formatRupiah(ing.costPerUnit)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatRupiah(Math.round(Math.max(0, ing.currentStock) * ing.costPerUnit))}
                        </td>
                        <td className="px-4 py-3">
                          {negative ? (
                            <Badge className="border-destructive/30 bg-destructive/10 text-destructive">
                              Negatif
                            </Badge>
                          ) : low ? (
                            <Badge className="border-warning/40 bg-warning/10 text-foreground">
                              Menipis
                            </Badge>
                          ) : (
                            <Badge className="border-success/30 bg-success/10 text-success">
                              Aman
                            </Badge>
                          )}
                        </td>
                        {isOwner && (
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setActionTarget({ ingredient: ing, mode: "restock" })}
                              >
                                Kelola
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setFormTarget({ ingredient: ing })}
                                aria-label={`Edit ${ing.name}`}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-2.5 md:hidden">
            {filtered.map((ing) => {
              const low = ing.currentStock <= ing.minStock;
              const negative = ing.currentStock < 0;
              return (
                <div
                  key={ing.id}
                  className={cn(
                    "rounded-xl border border-border bg-card p-3.5",
                    low && "border-destructive/25"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {isOwner ? (
                        <Link
                          href={`/stok/${ing.id}`}
                          className="truncate font-semibold hover:text-primary"
                        >
                          {ing.name}
                        </Link>
                      ) : (
                        <p className="truncate font-semibold">{ing.name}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Min. {ing.minStock} {ing.unit} · {formatRupiah(ing.costPerUnit)}/{ing.unit}
                      </p>
                    </div>
                    {negative ? (
                      <Badge className="border-destructive/30 bg-destructive/10 text-destructive">
                        Negatif
                      </Badge>
                    ) : low ? (
                      <Badge className="border-warning/40 bg-warning/10 text-foreground">
                        Menipis
                      </Badge>
                    ) : (
                      <Badge className="border-success/30 bg-success/10 text-success">Aman</Badge>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p
                      className={cn(
                        "text-lg font-bold tabular-nums",
                        negative ? "text-destructive" : low ? "text-warning" : ""
                      )}
                    >
                      {Math.round(ing.currentStock)}{" "}
                      <span className="text-xs font-medium text-muted-foreground">{ing.unit}</span>
                    </p>
                    {isOwner && (
                      <div className="flex gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => setActionTarget({ ingredient: ing, mode: "restock" })}
                        >
                          Kelola
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setFormTarget({ ingredient: ing })}
                          aria-label={`Edit ${ing.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
        <ArrowLeftRight className="h-3.5 w-3.5" />
        Kartu stok per bahan mencatat seluruh pergerakan: pembelian, penjualan, void,
        penyesuaian, dan bahan terbuang.
      </p>

      {formTarget && user && (
        <IngredientFormDialog
          key={formTarget.ingredient?.id ?? "new"}
          ingredient={formTarget.ingredient}
          createdBy={user.id}
          unitLocked={unitLocked}
          onClose={() => setFormTarget(null)}
        />
      )}

      {actionTarget && user && (
        <StockActionDialog
          key={`${actionTarget.ingredient.id}-${actionTarget.mode}`}
          ingredient={actionTarget.ingredient}
          mode={actionTarget.mode}
          createdBy={user.id}
          onClose={() => setActionTarget(null)}
        />
      )}
    </div>
  );
}

