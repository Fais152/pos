"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  ChefHat,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMockDb } from "@/hooks/use-mock-db";
import { formatRupiah } from "@/lib/format";
import { mockDb } from "@/lib/mock-service";
import type { Category, Ingredient, Product } from "@/lib/types";
import { cn, createId } from "@/lib/utils";

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void | Promise<void>;
  label: string;
}) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (pending) return;
    setPending(true);
    try {
      await onChange();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-busy={pending}
      aria-label={label}
      disabled={pending}
      onClick={handleClick}
      className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-wait"
    >
      <span
        className={cn(
          "relative flex h-6 w-11 items-center rounded-full transition-colors",
          checked ? "bg-primary-solid" : "bg-muted-foreground/30",
          pending && "opacity-70"
        )}
      >
        <span
          className={cn(
            "inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5.5" : "translate-x-0.5"
          )}
        />
      </span>
    </button>
  );
}

function ProductFormDialog({
  product,
  categories,
  ingredients,
  initialRecipes,
  onClose,
}: {
  product: Product | null;
  categories: Category[];
  ingredients: Ingredient[];
  initialRecipes: Array<{ ingredientId: string; qtyPerPortion: number }>;
  onClose: () => void;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [categoryId, setCategoryId] = useState(
    product?.categoryId ?? categories[0]?.id ?? ""
  );
  const [price, setPrice] = useState(product?.price ?? 0);
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [recipeRows, setRecipeRows] = useState(initialRecipes);
  const [saving, setSaving] = useState(false);
  const [draftId] = useState(() => product?.id ?? createId("prod"));

  const estimatedCogs = recipeRows.reduce((sum, row) => {
    const ing = ingredients.find((i) => i.id === row.ingredientId);
    return sum + (ing ? ing.costPerUnit * row.qtyPerPortion : 0);
  }, 0);

  function addRow() {
    const used = new Set(recipeRows.map((row) => row.ingredientId));
    const next = ingredients.find((ingredient) => ingredient.isActive && !used.has(ingredient.id));
    if (!next) {
      toast.error("Semua bahan aktif sudah ada di resep.");
      return;
    }
    setRecipeRows((rows) => [...rows, { ingredientId: next.id, qtyPerPortion: 1 }]);
  }

  async function save() {
    if (saving) return;
    if (!name.trim()) {
      toast.error("Nama menu wajib diisi.");
      return;
    }
    if (!categoryId) {
      toast.error("Pilih kategori menu.");
      return;
    }
    if (price <= 0) {
      toast.error("Harga jual harus lebih dari 0.");
      return;
    }
    if (
      recipeRows.some(
        (row) =>
          !row.ingredientId ||
          !Number.isFinite(row.qtyPerPortion) ||
          row.qtyPerPortion <= 0
      )
    ) {
      toast.error("Lengkapi bahan dan isi jumlah resep lebih dari 0.");
      return;
    }
    const mergedRecipes = new Map<string, number>();
    for (const row of recipeRows) {
      mergedRecipes.set(
        row.ingredientId,
        (mergedRecipes.get(row.ingredientId) ?? 0) + row.qtyPerPortion
      );
    }
    const cleanRecipes = Array.from(mergedRecipes, ([ingredientId, qtyPerPortion]) => ({
      ingredientId,
      qtyPerPortion,
    }));
    setSaving(true);
    try {
      await mockDb.saveProduct(
        {
          id: draftId,
          categoryId,
          name: name.trim(),
          price,
          isActive,
          createdAt: product?.createdAt ?? new Date().toISOString(),
        },
        cleanRecipes
      );
      toast.success(product ? "Menu diperbarui." : "Menu baru ditambahkan.");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan menu.");
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
      <DialogContent className="max-h-[92dvh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Menu" : "Tambah Menu"}</DialogTitle>
          <DialogDescription>
            Lengkapi data menu. Resep dipakai untuk mengurangi stok otomatis saat terjual.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="product-name">Nama menu</Label>
              <Input
                id="product-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mis. Es Kopi Susu Gula Aren"
                maxLength={120}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product-category">Kategori</Label>
              <select
                id="product-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product-price">Harga jual</Label>
              <MoneyInput id="product-price" value={price} onValueChange={setPrice} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">Menu aktif</p>
              <p className="text-xs text-muted-foreground">
                Menu nonaktif tidak muncul di kasir, tetapi tetap ada di laporan lama.
              </p>
            </div>
            <Toggle
              checked={isActive}
              onChange={() => setIsActive((v) => !v)}
              label="Status menu aktif"
            />
          </div>

          <div className="rounded-xl border border-border">
            <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
              <div>
                <p className="text-sm font-semibold">Resep per porsi</p>
                <p className="text-xs text-muted-foreground">
                  Estimasi HPP: {formatRupiah(Math.round(estimatedCogs))}
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addRow}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Bahan
              </Button>
            </div>

            {recipeRows.length === 0 ? (
              <div className="px-3.5 py-4 text-center text-xs text-muted-foreground">
                Belum ada resep. Menu tetap bisa dijual, tetapi stok bahan tidak berkurang.
              </div>
            ) : (
              <div className="space-y-2 p-3">
                {recipeRows.map((row, idx) => {
                  const ing = ingredients.find((i) => i.id === row.ingredientId);
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={row.ingredientId}
                        onChange={(e) =>
                          setRecipeRows((rows) =>
                            rows.map((r, i) =>
                              i === idx ? { ...r, ingredientId: e.target.value } : r
                            )
                          )
                        }
                        className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm"
                      >
                        {ingredients.map((i) => (
                          <option
                            key={i.id}
                            value={i.id}
                            disabled={!i.isActive && i.id !== row.ingredientId}
                          >
                            {i.name}
                            {i.isActive ? "" : " (nonaktif)"}
                          </option>
                        ))}
                      </select>
                      <div className="relative w-24 shrink-0">
                        <Input
                          type="number"
                          min={0}
                          step="0.1"
                          value={row.qtyPerPortion}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setRecipeRows((rows) =>
                              rows.map((r, i) =>
                                i === idx ? { ...r, qtyPerPortion: val } : r
                              )
                            );
                          }}
                          className="h-9 pr-8 text-right text-sm"
                        />
                        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                          {ing?.unit ?? ""}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          setRecipeRows((rows) => rows.filter((_, i) => i !== idx))
                        }
                        aria-label="Hapus bahan"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan Menu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CategoryFormDialog({
  category,
  onClose,
}: {
  category: Category | null;
  onClose: () => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [sortOrder, setSortOrder] = useState(category?.sortOrder ?? 1);
  const [saving, setSaving] = useState(false);
  const [draftId] = useState(() => category?.id ?? createId("cat"));

  async function save() {
    if (saving) return;
    if (!name.trim()) {
      toast.error("Nama kategori wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      await mockDb.saveCategory({
        id: draftId,
        name: name.trim(),
        sortOrder: Number.isFinite(sortOrder) ? Math.max(1, Math.round(sortOrder)) : 1,
      });
      toast.success(category ? "Kategori diperbarui." : "Kategori ditambahkan.");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan kategori.");
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
          <DialogTitle>{category ? "Edit Kategori" : "Tambah Kategori"}</DialogTitle>
          <DialogDescription>
            Kategori membantu kasir menemukan menu lebih cepat.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="category-name">Nama kategori</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mis. Kopi"
              maxLength={80}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category-sort">Urutan tampil</Label>
            <Input
              id="category-sort"
              type="number"
              min={1}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan Kategori"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function MenuPage() {
  const db = useMockDb();
  const [tab, setTab] = useState<"menu" | "kategori">("menu");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [productDialog, setProductDialog] = useState<{
    product: Product | null;
    recipes: Array<{ ingredientId: string; qtyPerPortion: number }>;
  } | null>(null);
  const [categoryDialog, setCategoryDialog] = useState<{ category: Category | null } | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const categories = [...db.categories].sort((a, b) => a.sortOrder - b.sortOrder);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return db.products
      .filter((p) => {
        if (categoryFilter !== "all" && p.categoryId !== categoryFilter) return false;
        if (query && !p.name.toLowerCase().includes(query)) return false;
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [db.products, categoryFilter, search]);

  function openEdit(product: Product) {
    setProductDialog({
      product,
      recipes: db.recipes
        .filter((r) => r.productId === product.id)
        .map((r) => ({ ingredientId: r.ingredientId, qtyPerPortion: r.qtyPerPortion })),
    });
  }

  async function deleteCategory() {
    if (!deleteTarget) return;
    const result = await mockDb.deleteCategory(deleteTarget.id);
    if (result.success) {
      toast.success("Kategori dihapus.");
      setDeleteTarget(null);
    } else {
      toast.error(result.error ?? "Gagal menghapus kategori.");
    }
  }

  async function toggleProduct(productId: string) {
    try {
      await mockDb.toggleProductStatus(productId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengubah status menu.");
    }
  }

  function openCreateProduct() {
    if (!categories.length) {
      toast.error("Tambahkan kategori terlebih dahulu.");
      setTab("kategori");
      setCategoryDialog({ category: null });
      return;
    }
    setProductDialog({ product: null, recipes: [] });
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Menu & Kategori"
        description="Kelola daftar menu, harga jual, status tampil, dan resep bahan."
        actions={
          <Button
            onClick={openCreateProduct}
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> Tambah Menu
          </Button>
        }
      />

      <div className="mb-4 inline-flex rounded-lg border border-border bg-card p-1">
        <button
          onClick={() => setTab("menu")}
          className={cn(
            "flex min-h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors",
            tab === "menu" ? "bg-primary-solid text-primary-foreground" : "text-muted-foreground"
          )}
        >
          <UtensilsCrossed className="h-3.5 w-3.5" /> Menu ({db.products.length})
        </button>
        <button
          onClick={() => setTab("kategori")}
          className={cn(
            "flex min-h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors",
            tab === "kategori" ? "bg-primary-solid text-primary-foreground" : "text-muted-foreground"
          )}
        >
          <Tag className="h-3.5 w-3.5" /> Kategori ({categories.length})
        </button>
      </div>

      {tab === "menu" ? (
        <>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari menu…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 bg-card pl-9"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-card px-3 text-sm sm:w-56"
            >
              <option value="all">Semua kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {filteredProducts.length === 0 ? (
            <EmptyState
              icon={<UtensilsCrossed className="h-8 w-8" />}
              title="Belum ada menu"
              description="Tambahkan menu pertama Anda beserta harga dan resepnya."
              action={
                <Button onClick={openCreateProduct}>
                  Tambah Menu
                </Button>
              }
            />
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/60 text-left text-xs font-medium text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-medium">Menu</th>
                        <th className="px-4 py-3 font-medium">Kategori</th>
                        <th className="px-4 py-3 text-right font-medium">HPP (est.)</th>
                        <th className="px-4 py-3 text-right font-medium">Harga Jual</th>
                        <th className="px-4 py-3 font-medium">Resep</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 text-right font-medium">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => {
                        const category = categories.find((c) => c.id === product.categoryId);
                        const hasRecipe = db.recipes.some((r) => r.productId === product.id);
                        const cogs = db.recipes
                          .filter((r) => r.productId === product.id)
                          .reduce((sum, recipe) => {
                            const ingredient = db.ingredients.find((item) => item.id === recipe.ingredientId);
                            return sum + (ingredient?.costPerUnit ?? 0) * recipe.qtyPerPortion;
                          }, 0);
                        return (
                          <tr key={product.id} className="border-t border-border/70">
                            <td className="px-4 py-3 font-medium">{product.name}</td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {category?.name ?? "-"}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                              {hasRecipe ? formatRupiah(Math.round(cogs)) : "-"}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold tabular-nums">
                              {formatRupiah(product.price)}
                            </td>
                            <td className="px-4 py-3">
                              {hasRecipe ? (
                                <Badge className="border-success/30 bg-success/10 text-success">
                                  Terisi
                                </Badge>
                              ) : (
                                <Badge className="border-warning/40 bg-warning/10 text-foreground">
                                  <AlertCircle className="mr-1 h-3 w-3" /> Belum diatur
                                </Badge>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Toggle
                                  checked={product.isActive}
                                  onChange={() => toggleProduct(product.id)}
                                  label={`Status ${product.name}`}
                                />
                                <span className="text-xs text-muted-foreground">
                                  {product.isActive ? "Aktif" : "Nonaktif"}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1.5"
                                onClick={() => openEdit(product)}
                              >
                                <Pencil className="h-3.5 w-3.5" /> Edit
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-2.5 md:hidden">
                {filteredProducts.map((product) => {
                  const category = categories.find((c) => c.id === product.categoryId);
                  const hasRecipe = db.recipes.some((r) => r.productId === product.id);
                  return (
                    <div
                      key={product.id}
                      className="rounded-xl border border-border bg-card p-3.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {category?.name ?? "Tanpa kategori"} ·{" "}
                            {formatRupiah(product.price)}
                          </p>
                          {!hasRecipe && (
                            <p className="mt-1 flex items-center gap-1 text-[11px] text-warning">
                              <AlertCircle className="h-3 w-3" /> Resep belum diatur
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <Toggle
                            checked={product.isActive}
                            onChange={() => toggleProduct(product.id)}
                            label={`Status ${product.name}`}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-11 w-11"
                            onClick={() => openEdit(product)}
                            aria-label={`Edit ${product.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setCategoryDialog({ category: null })} className="gap-2">
              <Plus className="h-4 w-4" /> Tambah Kategori
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const productCount = db.products.filter(
                (p) => p.categoryId === category.id
              ).length;
              return (
                <div
                  key={category.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Tag className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold">{category.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Urutan {category.sortOrder} · {productCount} menu
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCategoryDialog({ category })}
                      aria-label={`Edit ${category.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTarget(category)}
                      aria-label={`Hapus ${category.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {categories.length === 0 && (
            <EmptyState
              icon={<ChefHat className="h-8 w-8" />}
              title="Belum ada kategori"
              description="Tambahkan kategori agar menu lebih mudah ditemukan di kasir."
            />
          )}
        </div>
      )}

      {productDialog && (
        <ProductFormDialog
          key={productDialog.product?.id ?? "new"}
          product={productDialog.product}
          categories={categories}
          ingredients={db.ingredients}
          initialRecipes={productDialog.recipes}
          onClose={() => setProductDialog(null)}
        />
      )}

      {categoryDialog && (
        <CategoryFormDialog
          key={categoryDialog.category?.id ?? "new"}
          category={categoryDialog.category}
          onClose={() => setCategoryDialog(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Hapus kategori ${deleteTarget?.name ?? ""}?`}
        description="Kategori hanya dapat dihapus jika tidak memiliki menu."
        confirmLabel="Hapus Kategori"
        destructive
        onConfirm={deleteCategory}
      />
    </div>
  );
}
