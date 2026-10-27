import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { db, sql as pg } from "./index";
import {
  categories,
  ingredients,
  orderItems,
  orderSequences,
  orders,
  products,
  recipes,
  settings,
  stockMovements,
  users,
} from "./schema";
import { settingsToRows } from "../server/settings";

const DAY_MS = 86_400_000;

const seedUsers = [
  { id: "u-owner", name: "Fais (Owner)", username: "owner", role: "owner" as const },
  { id: "u-kasir1", name: "Siti Rahma", username: "kasir1", role: "kasir" as const },
  { id: "u-kasir2", name: "Budi Santoso", username: "kasir2", role: "kasir" as const },
];

const seedCategories = [
  { id: "cat-kopi", name: "Kopi", sortOrder: 1 },
  { id: "cat-nonkopi", name: "Non-Kopi", sortOrder: 2 },
  { id: "cat-makanan", name: "Makanan & Snack", sortOrder: 3 },
];

const seedIngredients = [
  { id: "ing-beans-arabica", name: "Biji Kopi Arabika", unit: "g" as const, currentStock: 2450, minStock: 1000, costPerUnit: 250 },
  { id: "ing-beans-robusta", name: "Biji Kopi Robusta", unit: "g" as const, currentStock: 800, minStock: 1000, costPerUnit: 150 },
  { id: "ing-milk-fresh", name: "Susu Fresh Milk", unit: "ml" as const, currentStock: 4200, minStock: 3000, costPerUnit: 22 },
  { id: "ing-milk-oat", name: "Susu Oat", unit: "ml" as const, currentStock: 1200, minStock: 2000, costPerUnit: 45 },
  { id: "ing-syrup-aren", name: "Gula Aren Cair", unit: "ml" as const, currentStock: 1800, minStock: 1500, costPerUnit: 35 },
  { id: "ing-syrup-vanilla", name: "Sirup Vanilla", unit: "ml" as const, currentStock: 650, minStock: 800, costPerUnit: 60 },
  { id: "ing-matcha", name: "Bubuk Matcha Premium", unit: "g" as const, currentStock: 400, minStock: 500, costPerUnit: 400 },
  { id: "ing-chocolate", name: "Bubuk Cokelat", unit: "g" as const, currentStock: 1500, minStock: 1000, costPerUnit: 180 },
  { id: "ing-croissant-raw", name: "Adonan Croissant Butter", unit: "pcs" as const, currentStock: 18, minStock: 20, costPerUnit: 12000 },
  { id: "ing-bread", name: "Roti Toast Brioche", unit: "pcs" as const, currentStock: 30, minStock: 15, costPerUnit: 6000 },
  { id: "ing-french-fries", name: "Kentang Frozen", unit: "g" as const, currentStock: 3500, minStock: 2000, costPerUnit: 40 },
  { id: "ing-cup-cold", name: "Cup Dingin 16oz + Tutup", unit: "pcs" as const, currentStock: 320, minStock: 200, costPerUnit: 800 },
];

const seedProducts = [
  { id: "prod-es-kopi-aren", categoryId: "cat-kopi", name: "Es Kopi Susu Gula Aren", price: 22000 },
  { id: "prod-americano", categoryId: "cat-kopi", name: "Americano (Iced/Hot)", price: 18000 },
  { id: "prod-cappuccino", categoryId: "cat-kopi", name: "Cappuccino", price: 25000 },
  { id: "prod-vanilla-latte", categoryId: "cat-kopi", name: "Vanilla Latte", price: 28000 },
  { id: "prod-matcha-latte", categoryId: "cat-nonkopi", name: "Matcha Latte", price: 26000 },
  { id: "prod-choco-signature", categoryId: "cat-nonkopi", name: "Signature Chocolate", price: 24000 },
  { id: "prod-croissant", categoryId: "cat-makanan", name: "Butter Croissant", price: 22000 },
  { id: "prod-kaya-toast", categoryId: "cat-makanan", name: "Kaya Butter Toast", price: 20000 },
  { id: "prod-french-fries", categoryId: "cat-makanan", name: "French Fries Truffle Mayo", price: 23000 },
  { id: "prod-manual-brew", categoryId: "cat-kopi", name: "V60 Filter Coffee", price: 30000 },
];

const seedRecipes: Array<{ productId: string; ingredientId: string; qtyPerPortion: number }> = [
  { productId: "prod-es-kopi-aren", ingredientId: "ing-beans-robusta", qtyPerPortion: 18 },
  { productId: "prod-es-kopi-aren", ingredientId: "ing-milk-fresh", qtyPerPortion: 120 },
  { productId: "prod-es-kopi-aren", ingredientId: "ing-syrup-aren", qtyPerPortion: 25 },
  { productId: "prod-es-kopi-aren", ingredientId: "ing-cup-cold", qtyPerPortion: 1 },
  { productId: "prod-americano", ingredientId: "ing-beans-arabica", qtyPerPortion: 18 },
  { productId: "prod-americano", ingredientId: "ing-cup-cold", qtyPerPortion: 1 },
  { productId: "prod-cappuccino", ingredientId: "ing-beans-arabica", qtyPerPortion: 18 },
  { productId: "prod-cappuccino", ingredientId: "ing-milk-fresh", qtyPerPortion: 150 },
  { productId: "prod-vanilla-latte", ingredientId: "ing-beans-arabica", qtyPerPortion: 18 },
  { productId: "prod-vanilla-latte", ingredientId: "ing-milk-fresh", qtyPerPortion: 150 },
  { productId: "prod-vanilla-latte", ingredientId: "ing-syrup-vanilla", qtyPerPortion: 20 },
  { productId: "prod-vanilla-latte", ingredientId: "ing-cup-cold", qtyPerPortion: 1 },
  { productId: "prod-matcha-latte", ingredientId: "ing-matcha", qtyPerPortion: 12 },
  { productId: "prod-matcha-latte", ingredientId: "ing-milk-fresh", qtyPerPortion: 160 },
  { productId: "prod-matcha-latte", ingredientId: "ing-cup-cold", qtyPerPortion: 1 },
  { productId: "prod-choco-signature", ingredientId: "ing-chocolate", qtyPerPortion: 25 },
  { productId: "prod-choco-signature", ingredientId: "ing-milk-fresh", qtyPerPortion: 150 },
  { productId: "prod-choco-signature", ingredientId: "ing-cup-cold", qtyPerPortion: 1 },
  { productId: "prod-croissant", ingredientId: "ing-croissant-raw", qtyPerPortion: 1 },
  { productId: "prod-kaya-toast", ingredientId: "ing-bread", qtyPerPortion: 2 },
  { productId: "prod-french-fries", ingredientId: "ing-french-fries", qtyPerPortion: 180 },
  { productId: "prod-manual-brew", ingredientId: "ing-beans-arabica", qtyPerPortion: 15 },
];

type SeedOrder = typeof orders.$inferInsert;
type SeedOrderItem = typeof orderItems.$inferInsert;
type SeedMovement = typeof stockMovements.$inferInsert;

function witaDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Makassar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function witaIso(dayKey: string, hour: number, minute: number) {
  return new Date(`${dayKey}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+08:00`);
}

function makeRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function batches<T>(rows: T[], size = 500) {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}

async function main() {
  console.log("Menghapus data lama...");
  await pg.unsafe(`
    TRUNCATE TABLE stock_movements, order_items, orders, order_sequences,
      recipes, products, categories, ingredients, sessions, users, settings
    RESTART IDENTITY CASCADE;
  `);

  const now = new Date();
  const nowWitaKey = witaDateKey(now);
  const nowWitaHour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Makassar",
      hour: "2-digit",
      hour12: false,
    }).format(now),
  );

  const ownerHash = bcrypt.hashSync("owner123", 10);
  const cashierHash = bcrypt.hashSync("kasir123", 10);

  await db.insert(users).values(
    seedUsers.map((user) => ({
      ...user,
      passwordHash: user.role === "owner" ? ownerHash : cashierHash,
      isActive: true,
      createdAt: new Date(now.getTime() - 60 * DAY_MS),
    })),
  );

  await db.insert(categories).values(seedCategories);

  const productCreatedAt = new Date(now.getTime() - 60 * DAY_MS);
  await db.insert(products).values(
    seedProducts.map((product) => ({
      ...product,
      isActive: true,
      createdAt: productCreatedAt,
    })),
  );

  await db.insert(ingredients).values(
    seedIngredients.map((ingredient) => ({
      ...ingredient,
      isActive: true,
      createdAt: productCreatedAt,
    })),
  );

  await db.insert(recipes).values(
    seedRecipes.map((recipe) => ({
      id: randomUUID(),
      ...recipe,
    })),
  );

  await db.insert(settings).values(settingsToRows({
    cafeName: "Koetaw",
    address: "Jl. Hasanuddin No. 45, Makassar",
    phone: "0812-3456-7890",
    taxPercent: 0,
    servicePercent: 0,
    receiptFooter: "Terima kasih atas kunjungannya! Nikmati harimu.",
    timezone: "Asia/Makassar",
  }));

  const recipeByProduct = new Map<string, Array<{ ingredientId: string; qtyPerPortion: number }>>();
  for (const recipe of seedRecipes) {
    const list = recipeByProduct.get(recipe.productId) ?? [];
    list.push(recipe);
    recipeByProduct.set(recipe.productId, list);
  }
  const ingredientById = new Map(seedIngredients.map((item) => [item.id, item]));

  function cogsFor(productId: string) {
    return (recipeByProduct.get(productId) ?? []).reduce((sum, recipe) => {
      const ingredient = ingredientById.get(recipe.ingredientId);
      return sum + (ingredient?.costPerUnit ?? 0) * recipe.qtyPerPortion;
    }, 0);
  }

  const rand = makeRandom(20261023);
  const generatedOrders: SeedOrder[] = [];
  const generatedItems: SeedOrderItem[] = [];
  const generatedMovements: SeedMovement[] = [];
  const paidUsage = new Map<string, number>();
  const sequenceByDay = new Map<string, number>();

  let orderCounter = 0;

  for (let dayOffset = 35; dayOffset >= 0; dayOffset -= 1) {
    const dayDate = new Date(now.getTime() - dayOffset * DAY_MS);
    const dayKey = witaDateKey(dayDate);
    const [year, month, day] = dayKey.split("-");
    const prefix = `INV-${year}${month}${day}`;
    const isWeekend = new Date(`${dayKey}T12:00:00+08:00`).getUTCDay() % 6 === 0;
    const count = Math.floor((isWeekend ? 14 : 9) + rand() * 6);
    let seq = 0;

    for (let i = 0; i < count; i += 1) {
      const bucket = rand();
      const hour = bucket < 0.3 ? 9 + Math.floor(rand() * 3) : bucket < 0.62 ? 12 + Math.floor(rand() * 3) : 16 + Math.floor(rand() * 5);
      if (dayKey === nowWitaKey && hour > nowWitaHour) continue;
      const minute = Math.floor(rand() * 60);
      const orderDate = witaIso(dayKey, hour, minute);
      if (orderDate > now) continue;

      seq += 1;
      orderCounter += 1;
      const orderId = `seed-ord-${orderCounter}`;
      const itemCount = 1 + Math.floor(rand() * 3);
      let subtotal = 0;

      for (let j = 0; j < itemCount; j += 1) {
        const selected = seedProducts[Math.floor(rand() * seedProducts.length)];
        const qty = rand() > 0.82 ? 2 : 1;
        const lineTotal = selected.price * qty;
        subtotal += lineTotal;
        generatedItems.push({
          id: `seed-item-${orderCounter}-${j + 1}`,
          orderId,
          productId: selected.id,
          productName: selected.name,
          unitPrice: selected.price,
          qty,
          lineTotal,
          note: "",
          unitCogs: Math.round(cogsFor(selected.id)),
        });
      }

      const paymentRoll = rand();
      const paymentMethod = paymentRoll < 0.45 ? "qris" : paymentRoll < 0.85 ? "cash" : "transfer";
      const orderType = rand() > 0.6 ? "takeaway" : "dine_in";
      const isVoid = rand() < 0.03 && dayOffset > 0;
      const discount = rand() < 0.12 ? (rand() < 0.5 ? 5000 : Math.round(subtotal * 0.1)) : 0;
      const total = Math.max(0, subtotal - discount);
      let cashReceived = total;
      let changeAmount = 0;
      if (paymentMethod === "cash") {
        const options = [total, Math.ceil(total / 10000) * 10000, Math.ceil(total / 50000) * 50000, 100000];
        cashReceived = options[Math.floor(rand() * options.length)] ?? total;
        if (cashReceived < total) cashReceived = total;
        changeAmount = cashReceived - total;
      }

      const cashierId = rand() > 0.4 ? "u-kasir1" : "u-kasir2";
      const voidedAt = isVoid ? new Date(orderDate.getTime() + 15 * 60_000) : null;

      generatedOrders.push({
        id: orderId,
        orderNo: `${prefix}-${String(seq).padStart(4, "0")}`,
        orderType,
        tableLabel: orderType === "dine_in" ? `Meja ${1 + Math.floor(rand() * 12)}` : null,
        status: isVoid ? "void" : "paid",
        subtotal,
        discount,
        tax: 0,
        serviceCharge: 0,
        total,
        paymentMethod,
        cashReceived,
        changeAmount,
        cashierId,
        createdAt: orderDate,
        voidedAt,
        voidReason: isVoid ? "Salah input pesanan pelanggan" : null,
        voidedBy: isVoid ? "u-owner" : null,
      });

      for (const item of generatedItems.filter((row) => row.orderId === orderId)) {
        const productRecipes = recipeByProduct.get(item.productId) ?? [];
        for (const recipe of productRecipes) {
          const ingredient = ingredientById.get(recipe.ingredientId);
          if (!ingredient) continue;
          const qtyChange = -(recipe.qtyPerPortion * item.qty);
          generatedMovements.push({
            id: randomUUID(),
            ingredientId: recipe.ingredientId,
            type: "sale",
            qtyChange,
            unitCost: ingredient.costPerUnit,
            note: `Penjualan ${prefix}-${String(seq).padStart(4, "0")} (${item.productName} x${item.qty})`,
            orderId,
            createdBy: cashierId,
            createdAt: orderDate,
          });

          if (isVoid && voidedAt) {
            generatedMovements.push({
              id: randomUUID(),
              ingredientId: recipe.ingredientId,
              type: "void_return",
              qtyChange: Math.abs(qtyChange),
              unitCost: ingredient.costPerUnit,
              note: `Void transaksi ${prefix}-${String(seq).padStart(4, "0")}`,
              orderId,
              createdBy: "u-owner",
              createdAt: voidedAt,
            });
          } else {
            paidUsage.set(
              recipe.ingredientId,
              (paidUsage.get(recipe.ingredientId) ?? 0) + Math.abs(qtyChange),
            );
          }
        }
      }
    }

    if (seq > 0) {
      sequenceByDay.set(dayKey, seq);
    }
  }

  const purchaseDate = new Date(now.getTime() - 40 * DAY_MS);
  for (const ingredient of seedIngredients) {
    const purchasedQty = ingredient.currentStock + (paidUsage.get(ingredient.id) ?? 0);
    generatedMovements.push({
      id: randomUUID(),
      ingredientId: ingredient.id,
      type: "purchase",
      qtyChange: purchasedQty,
      unitCost: ingredient.costPerUnit,
      note: "Stok awal sistem",
      createdBy: "u-owner",
      createdAt: purchaseDate,
    });
  }

  console.log(`Menyimpan ${generatedOrders.length} transaksi, ${generatedItems.length} item...`);
  for (const batch of batches(generatedOrders)) await db.insert(orders).values(batch);
  for (const batch of batches(generatedItems)) await db.insert(orderItems).values(batch);
  for (const batch of batches(generatedMovements)) await db.insert(stockMovements).values(batch);

  await db.insert(orderSequences).values(
    Array.from(sequenceByDay.entries()).map(([dayKey, lastSeq]) => ({ day: dayKey, lastSeq })),
  );

  console.log("Seed selesai.");
  console.log(`Akun: owner/owner123, kasir1/kasir123, kasir2/kasir123`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pg.end();
  });

