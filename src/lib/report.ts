import { formatInTimeZone } from "date-fns-tz";
import { id as localeId } from "date-fns/locale";
import type {
  Category,
  Ingredient,
  Order,
  OrderItem,
  OrderType,
  PaymentMethod,
  StockMovement,
  StockMovementType,
  User,
} from "./types";
import { getWitaDateString } from "./format";

export const TZ = "Asia/Makassar";

export interface ProductSales {
  productId: string;
  productName: string;
  qty: number;
  revenue: number;
}

export interface BreakdownItem {
  key: string;
  label: string;
  count: number;
  total: number;
  percent?: number;
}

export interface RangeSummary {
  revenue: number;
  orderCount: number;
  avgPerOrder: number;
  itemCount: number;
  voidCount: number;
  grossProfit: number;
}

export interface HourPoint {
  hour: number;
  label: string;
  revenue: number;
  transactions: number;
}

export interface DayPoint {
  date: string;
  label: string;
  revenue: number;
  transactions: number;
}

export interface StockAlert {
  ingredient: Ingredient;
  deficit: number;
}

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: "Tunai",
  qris: "QRIS",
  transfer: "Transfer",
};

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  dine_in: "Dine-in",
  takeaway: "Takeaway",
};

export const MOVEMENT_LABELS: Record<StockMovementType, string> = {
  purchase: "Pembelian",
  sale: "Penjualan",
  void_return: "Void",
  adjustment: "Penyesuaian",
  waste: "Terbuang",
};

export function dateKeyOf(iso: string): string {
  return getWitaDateString(iso);
}

export function hourOf(iso: string): number {
  return Number(formatInTimeZone(new Date(iso), TZ, "H"));
}

export function weekdayOfKey(dateKey: string): number {
  return new Date(`${dateKey}T04:00:00Z`).getUTCDay();
}

export function labelOfKey(dateKey: string, pattern = "d MMM"): string {
  return formatInTimeZone(new Date(`${dateKey}T04:00:00Z`), TZ, pattern, {
    locale: localeId,
  });
}

export function monthKeyOf(dateKey: string): string {
  return dateKey.slice(0, 7);
}

export function monthLabel(monthKey: string): string {
  return labelOfKey(`${monthKey}-01`, "MMMM yyyy");
}

export function ordersByDate(orders: Order[], dateKey: string): Order[] {
  return orders.filter((o) => dateKeyOf(o.createdAt) === dateKey);
}

export function paidOnly(orders: Order[]): Order[] {
  return orders.filter((o) => o.status === "paid");
}

export function summarize(
  orders: Order[],
  items: OrderItem[],
  scope?: { fromKey?: string; toKey?: string; dateKey?: string }
): RangeSummary {
  let scopedOrders = orders;
  if (scope?.dateKey) {
    scopedOrders = ordersByDate(orders, scope.dateKey);
  } else if (scope?.fromKey || scope?.toKey) {
    scopedOrders = orders.filter((o) => {
      const key = dateKeyOf(o.createdAt);
      if (scope.fromKey && key < scope.fromKey) return false;
      if (scope.toKey && key > scope.toKey) return false;
      return true;
    });
  }

  const paid = scopedOrders.filter((o) => o.status === "paid");
  const paidIds = new Set(paid.map((o) => o.id));
  const scopedItems = items.filter((i) => paidIds.has(i.orderId));

  const revenue = paid.reduce((sum, o) => sum + o.total, 0);
  const itemCount = scopedItems.reduce((sum, i) => sum + i.qty, 0);
  const grossProfit = scopedItems.reduce(
    (sum, i) => sum + i.lineTotal - i.unitCogs * i.qty,
    0
  );

  return {
    revenue,
    orderCount: paid.length,
    avgPerOrder: paid.length ? Math.round(revenue / paid.length) : 0,
    itemCount,
    voidCount: scopedOrders.filter((o) => o.status === "void").length,
    grossProfit: Math.round(grossProfit),
  };
}

export function hourlySeries(orders: Order[], dateKey: string): HourPoint[] {
  const scoped = ordersByDate(paidOnly(orders), dateKey);
  return Array.from({ length: 24 }, (_, hour) => {
    const inHour = scoped.filter((o) => hourOf(o.createdAt) === hour);
    return {
      hour,
      label: `${String(hour).padStart(2, "0")}:00`,
      revenue: inHour.reduce((sum, o) => sum + o.total, 0),
      transactions: inHour.length,
    };
  });
}

export function dailySeries(
  orders: Order[],
  days: number,
  endKey: string = getWitaDateString()
): DayPoint[] {
  const paid = paidOnly(orders);
  const end = new Date(`${endKey}T04:00:00Z`);
  const points: DayPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end.getTime() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    const dayOrders = paid.filter((o) => dateKeyOf(o.createdAt) === key);
    points.push({
      date: key,
      label: labelOfKey(key, days > 10 ? "d/M" : "EEE"),
      revenue: dayOrders.reduce((sum, o) => sum + o.total, 0),
      transactions: dayOrders.length,
    });
  }
  return points;
}

export function topProducts(
  orders: Order[],
  items: OrderItem[],
  limit = 5
): ProductSales[] {
  const paidIds = new Set(orders.filter((o) => o.status === "paid").map((o) => o.id));
  const map = new Map<string, ProductSales>();
  items
    .filter((i) => paidIds.has(i.orderId))
    .forEach((i) => {
      const current = map.get(i.productId) ?? {
        productId: i.productId,
        productName: i.productName,
        qty: 0,
        revenue: 0,
      };
      current.qty += i.qty;
      current.revenue += i.lineTotal;
      map.set(i.productId, current);
    });
  return Array.from(map.values())
    .sort((a, b) => b.qty - a.qty || b.revenue - a.revenue)
    .slice(0, limit);
}

export function paymentBreakdown(orders: Order[]): BreakdownItem[] {
  const paid = paidOnly(orders);
  const total = paid.reduce((sum, o) => sum + o.total, 0);
  return (Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((method) => {
    const scoped = paid.filter((o) => o.paymentMethod === method);
    const amount = scoped.reduce((sum, o) => sum + o.total, 0);
    return {
      key: method,
      label: PAYMENT_LABELS[method],
      count: scoped.length,
      total: amount,
      percent: total ? Math.round((amount / total) * 100) : 0,
    };
  });
}

export function orderTypeBreakdown(orders: Order[]): BreakdownItem[] {
  const paid = paidOnly(orders);
  const total = paid.reduce((sum, o) => sum + o.total, 0);
  return (Object.keys(ORDER_TYPE_LABELS) as OrderType[]).map((type) => {
    const scoped = paid.filter((o) => o.orderType === type);
    const amount = scoped.reduce((sum, o) => sum + o.total, 0);
    return {
      key: type,
      label: ORDER_TYPE_LABELS[type],
      count: scoped.length,
      total: amount,
      percent: total ? Math.round((amount / total) * 100) : 0,
    };
  });
}

export function cashierBreakdown(orders: Order[], users: User[]): BreakdownItem[] {
  const paid = paidOnly(orders);
  const total = paid.reduce((sum, o) => sum + o.total, 0);
  const map = new Map<string, BreakdownItem>();
  paid.forEach((o) => {
    const user = users.find((u) => u.id === o.cashierId);
    const key = o.cashierId;
    const current = map.get(key) ?? {
      key,
      label: user?.name ?? "Kasir",
      count: 0,
      total: 0,
    };
    current.count += 1;
    current.total += o.total;
    map.set(key, current);
  });
  return Array.from(map.values()).map((b) => ({
    ...b,
    percent: total ? Math.round((b.total / total) * 100) : 0,
  }));
}

export function categoryBreakdown(
  orders: Order[],
  items: OrderItem[],
  categories: Category[],
  products: Array<{ id: string; categoryId: string }>
): BreakdownItem[] {
  const paidIds = new Set(paidOnly(orders).map((o) => o.id));
  const scopedItems = items.filter((i) => paidIds.has(i.orderId));
  const total = scopedItems.reduce((sum, i) => sum + i.lineTotal, 0);
  const map = new Map<string, BreakdownItem>();
  scopedItems.forEach((i) => {
    const product = products.find((p) => p.id === i.productId);
    const category = categories.find((c) => c.id === product?.categoryId);
    const key = category?.id ?? "lainnya";
    const current = map.get(key) ?? {
      key,
      label: category?.name ?? "Lainnya",
      count: 0,
      total: 0,
    };
    current.count += i.qty;
    current.total += i.lineTotal;
    map.set(key, current);
  });
  return Array.from(map.values())
    .map((b) => ({
      ...b,
      percent: total ? Math.round((b.total / total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export function lowStockAlerts(ingredients: Ingredient[]): StockAlert[] {
  return ingredients
    .filter((i) => i.isActive && i.currentStock <= i.minStock)
    .map((i) => ({ ingredient: i, deficit: Math.max(0, i.minStock - i.currentStock) }))
    .sort((a, b) => b.deficit - a.deficit);
}

export function stockValue(ingredients: Ingredient[]): number {
  return ingredients.reduce(
    (sum, i) => sum + Math.max(0, i.currentStock) * i.costPerUnit,
    0
  );
}

export interface WasteRow {
  ingredientName: string;
  qty: number;
  unit: string;
  value: number;
  note: string;
}

export function wasteOnDate(
  movements: StockMovement[],
  ingredients: Ingredient[],
  dateKey: string
): WasteRow[] {
  return movements
    .filter((m) => m.type === "waste" && dateKeyOf(m.createdAt) === dateKey)
    .map((m) => {
      const ing = ingredients.find((i) => i.id === m.ingredientId);
      return {
        ingredientName: ing?.name ?? "Bahan",
        qty: Math.abs(m.qtyChange),
        unit: ing?.unit ?? "",
        value: Math.round(Math.abs(m.qtyChange) * m.unitCost),
        note: m.note,
      };
    });
}

function stockInsights(ingredients: Ingredient[]): string[] {
  const alerts = lowStockAlerts(ingredients);
  if (!alerts.length) return [];
  const top = alerts[0];
  return [
    `${top.ingredient.name} tersisa ${Math.round(top.ingredient.currentStock)} ${top.ingredient.unit}, di bawah batas minimum (${top.ingredient.minStock} ${top.ingredient.unit}).`,
  ];
}

function bestHourInsight(hourly: HourPoint[]): string | null {
  const busiest = [...hourly].sort((a, b) => b.revenue - a.revenue)[0];
  if (!busiest || busiest.revenue === 0) return null;
  return `Jam paling ramai hari ini: ${busiest.label} (${busiest.transactions} transaksi).`;
}

export function dailyInsights(
  orders: Order[],
  items: OrderItem[],
  ingredients: Ingredient[],
  products: Array<{ id: string; name: string; isActive: boolean }>,
  dateKey: string
): string[] {
  const insights: string[] = [];
  const summary = summarize(orders, items, { dateKey });

  const weekday = weekdayOfKey(dateKey);
  const revenueByWeekday = [0, 1, 2, 3, 4, 5, 6];
  for (let w = 1; w <= 4; w++) {
    const d = new Date(`${dateKey}T04:00:00Z`);
    d.setUTCDate(d.getUTCDate() - w * 7);
    const key = d.toISOString().slice(0, 10);
    const pastSummary = summarize(orders, items, { dateKey: key });
    revenueByWeekday[weekday] += pastSummary.revenue;
  }
  const avgSameWeekday = revenueByWeekday[weekday] / 4;
  if (avgSameWeekday > 0) {
    const diff = ((summary.revenue - avgSameWeekday) / avgSameWeekday) * 100;
    insights.push(
      `Omzet hari ini ${diff >= 0 ? "naik" : "turun"} ${Math.abs(Math.round(diff))}% dibanding rata-rata hari yang sama pada 4 minggu terakhir.`
    );
  }

  const hourly = hourlySeries(orders, dateKey);
  const bestHour = bestHourInsight(hourly);
  if (bestHour) insights.push(bestHour);

  const top = topProducts(ordersByDate(orders, dateKey), items, 1)[0];
  if (top) insights.push(`Menu terlaris hari ini: ${top.productName} (${top.qty} porsi).`);

  const alerts = stockInsights(ingredients);
  insights.push(...alerts);

  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString();
  const recentPaidOrderIds = new Set(
    orders
      .filter((o) => o.status === "paid" && o.createdAt >= fourteenDaysAgo)
      .map((o) => o.id)
  );
  const soldRecent = new Set(
    items.filter((i) => recentPaidOrderIds.has(i.orderId)).map((i) => i.productId)
  );
  const unsold = products.filter((p) => p.isActive && !soldRecent.has(p.id));
  if (unsold.length === 1) {
    insights.push(`Menu ${unsold[0].name} tidak terjual dalam 14 hari terakhir.`);
  } else if (unsold.length > 1) {
    insights.push(
      `${unsold.length} menu aktif tidak terjual dalam 14 hari terakhir, termasuk ${unsold[0].name}.`
    );
  }

  return insights;
}

export interface DailyReportData {
  date: string;
  summary: RangeSummary;
  payments: BreakdownItem[];
  orderTypes: BreakdownItem[];
  topProducts: ProductSales[];
  hourly: HourPoint[];
  cashiers: BreakdownItem[];
  lowStock: Ingredient[];
  waste: WasteRow[];
  insights: string[];
}

export function buildDailyReport(
  dateKey: string,
  orders: Order[],
  items: OrderItem[],
  ingredients: Ingredient[],
  movements: StockMovement[],
  users: User[],
  products: Array<{ id: string; name: string; isActive: boolean }>
): DailyReportData {
  const scopedOrders = ordersByDate(orders, dateKey);
  return {
    date: dateKey,
    summary: summarize(orders, items, { dateKey }),
    payments: paymentBreakdown(scopedOrders),
    orderTypes: orderTypeBreakdown(scopedOrders),
    topProducts: topProducts(scopedOrders, items, 50),
    hourly: hourlySeries(orders, dateKey),
    cashiers: cashierBreakdown(scopedOrders, users),
    lowStock: ingredients.filter((i) => i.isActive && i.currentStock <= i.minStock),
    waste: wasteOnDate(movements, ingredients, dateKey),
    insights: dailyInsights(orders, items, ingredients, products, dateKey),
  };
}

export interface MonthlyReportData {
  month: string;
  summary: RangeSummary;
  previousSummary: RangeSummary;
  comparisonPercent: number | null;
  avgPerDay: number;
  daily: DayPoint[];
  bestDay: DayPoint | null;
  worstDay: DayPoint | null;
  weekday: Array<{ label: string; revenue: number; transactions: number }>;
  topProducts: ProductSales[];
  quietest: { productName: string; qty: number } | null;
  categories: BreakdownItem[];
  payments: BreakdownItem[];
  orderTypes: BreakdownItem[];
  cashiers: BreakdownItem[];
  purchasesValue: number;
  wasteValue: number;
  topUsed: Array<{ name: string; qty: number; unit: string }>;
  insights: string[];
}

function daysInMonth(month: string): number {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m, 0)).getUTCDate();
}

function monthRange(month: string): { fromKey: string; toKey: string } {
  const total = daysInMonth(month);
  return { fromKey: `${month}-01`, toKey: `${month}-${String(total).padStart(2, "0")}` };
}

export function buildMonthlyReport(
  month: string,
  orders: Order[],
  items: OrderItem[],
  ingredients: Ingredient[],
  movements: StockMovement[],
  users: User[],
  categories: Category[],
  products: Array<{ id: string; name: string; isActive: boolean; categoryId: string }>
): MonthlyReportData {
  const range = monthRange(month);
  const todayKey = getWitaDateString();
  const isCurrentMonth = todayKey.startsWith(month);
  const totalDays = daysInMonth(month);
  const elapsedDays = isCurrentMonth
    ? Number(todayKey.slice(8, 10))
    : totalDays;

  const scopedOrders = orders.filter((o) => {
    const key = dateKeyOf(o.createdAt);
    return key >= range.fromKey && key <= range.toKey;
  });

  const summary = summarize(orders, items, range);

  const prevDate = new Date(`${month}-01T04:00:00Z`);
  prevDate.setUTCMonth(prevDate.getUTCMonth() - 1);
  const prevMonth = prevDate.toISOString().slice(0, 7);
  const previousSummary = summarize(orders, items, monthRange(prevMonth));

  const daily: DayPoint[] = [];
  for (let d = 1; d <= (isCurrentMonth ? elapsedDays : totalDays); d++) {
    const dateKey = `${month}-${String(d).padStart(2, "0")}`;
    const dayOrders = ordersByDate(paidOnly(orders), dateKey);
    daily.push({
      date: dateKey,
      label: String(d),
      revenue: dayOrders.reduce((sum, o) => sum + o.total, 0),
      transactions: dayOrders.length,
    });
  }

  const activeDays = daily.filter((d) => d.transactions > 0);
  const bestDay = activeDays.length
    ? [...activeDays].sort((a, b) => b.revenue - a.revenue)[0]
    : null;
  const worstDay = activeDays.length
    ? [...activeDays].sort((a, b) => a.revenue - b.revenue)[0]
    : null;

  const weekdayLabels = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
  const weekday = weekdayLabels.map((label, idx) => {
    const scoped = daily.filter((d) => {
      const jsDay = weekdayOfKey(d.date);
      const mapped = jsDay === 0 ? 6 : jsDay - 1;
      return mapped === idx;
    });
    return {
      label,
      revenue: scoped.reduce((sum, d) => sum + d.revenue, 0),
      transactions: scoped.reduce((sum, d) => sum + d.transactions, 0),
    };
  });

  const scopedItems = items.filter((i) =>
    scopedOrders.some((o) => o.id === i.orderId && o.status === "paid")
  );
  const top = topProducts(scopedOrders, items, 10);

  const soldQty = new Map<string, number>();
  scopedItems.forEach((i) => {
    soldQty.set(i.productId, (soldQty.get(i.productId) ?? 0) + i.qty);
  });
  const activeProducts = products.filter((p) => p.isActive);
  const quietestProduct = activeProducts.length
    ? activeProducts.reduce((lowest, p) => {
        const qty = soldQty.get(p.id) ?? 0;
        const lowestQty = soldQty.get(lowest.id) ?? 0;
        return qty < lowestQty ? p : lowest;
      }, activeProducts[0])
    : null;
  const quietest = quietestProduct
    ? { productName: quietestProduct.name, qty: soldQty.get(quietestProduct.id) ?? 0 }
    : null;

  const monthMovements = movements.filter((m) => {
    const key = dateKeyOf(m.createdAt);
    return key >= range.fromKey && key <= range.toKey;
  });
  const purchasesValue = monthMovements
    .filter((m) => m.type === "purchase")
    .reduce((sum, m) => sum + m.qtyChange * m.unitCost, 0);
  const wasteValue = monthMovements
    .filter((m) => m.type === "waste")
    .reduce((sum, m) => sum + Math.abs(m.qtyChange) * m.unitCost, 0);

  const usedMap = new Map<string, number>();
  monthMovements
    .filter((m) => m.type === "sale" || m.type === "waste")
    .forEach((m) => {
      usedMap.set(m.ingredientId, (usedMap.get(m.ingredientId) ?? 0) + Math.abs(m.qtyChange));
    });
  const topUsed = Array.from(usedMap.entries())
    .map(([id, qty]) => {
      const ing = ingredients.find((i) => i.id === id);
      return { name: ing?.name ?? "Bahan", qty: Math.round(qty), unit: ing?.unit ?? "" };
    })
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const insights: string[] = [];
  if (previousSummary.revenue > 0) {
    const diff =
      ((summary.revenue - previousSummary.revenue) / previousSummary.revenue) * 100;
    insights.push(
      `Omzet bulan ini ${diff >= 0 ? "naik" : "turun"} ${Math.abs(Math.round(diff))}% dibanding bulan sebelumnya.`
    );
  } else if (summary.revenue > 0) {
    insights.push("Belum ada data omzet bulan sebelumnya untuk perbandingan.");
  }
  if (top[0]) insights.push(`Menu terlaris: ${top[0].productName} (${top[0].qty} porsi).`);
  if (bestDay) {
    insights.push(
      `Hari terbaik: ${labelOfKey(bestDay.date, "d MMMM")} dengan omzet ${formatRupiahShort(bestDay.revenue)}.`
    );
  }
  const busiestWeekday = [...weekday].sort((a, b) => b.revenue - a.revenue)[0];
  if (busiestWeekday && busiestWeekday.revenue > 0) {
    insights.push(`Hari ${busiestWeekday.label} paling ramai sepanjang bulan ini.`);
  }
  insights.push(...stockInsights(ingredients));

  return {
    month,
    summary,
    previousSummary,
    comparisonPercent:
      previousSummary.revenue > 0
        ? Math.round(((summary.revenue - previousSummary.revenue) / previousSummary.revenue) * 100)
        : null,
    avgPerDay: elapsedDays ? Math.round(summary.revenue / elapsedDays) : 0,
    daily,
    bestDay,
    worstDay,
    weekday,
    topProducts: top,
    quietest,
    categories: categoryBreakdown(scopedOrders, items, categories, products),
    payments: paymentBreakdown(scopedOrders),
    orderTypes: orderTypeBreakdown(scopedOrders),
    cashiers: cashierBreakdown(scopedOrders, users),
    purchasesValue: Math.round(purchasesValue),
    wasteValue: Math.round(wasteValue),
    topUsed,
    insights,
  };
}

function formatRupiahShort(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
