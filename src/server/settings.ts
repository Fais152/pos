import { db } from "@/db";
import { settings } from "@/db/schema";
import type { Settings } from "@/lib/types";

export const DEFAULT_SETTINGS: Settings = {
  cafeName: "Koetaw",
  address: "Jl. Hasanuddin No. 45, Makassar",
  phone: "0812-3456-7890",
  taxPercent: 0,
  servicePercent: 0,
  receiptFooter: "Terima kasih atas kunjungannya! Nikmati harimu.",
  timezone: "Asia/Makassar",
};

export async function getSettings(): Promise<Settings> {
  const rows = await db.select().from(settings);
  const map = new Map(rows.map((row) => [row.key, row.value]));

  return {
    cafeName: map.get("cafe_name") ?? DEFAULT_SETTINGS.cafeName,
    address: map.get("address") ?? DEFAULT_SETTINGS.address,
    phone: map.get("phone") ?? DEFAULT_SETTINGS.phone,
    taxPercent: Number(map.get("tax_percent") ?? DEFAULT_SETTINGS.taxPercent),
    servicePercent: Number(map.get("service_percent") ?? DEFAULT_SETTINGS.servicePercent),
    receiptFooter: map.get("receipt_footer") ?? DEFAULT_SETTINGS.receiptFooter,
    timezone: map.get("timezone") ?? DEFAULT_SETTINGS.timezone,
  };
}

export function settingsToRows(value: Settings) {
  return [
    { key: "cafe_name", value: value.cafeName },
    { key: "address", value: value.address },
    { key: "phone", value: value.phone },
    { key: "tax_percent", value: String(value.taxPercent) },
    { key: "service_percent", value: String(value.servicePercent) },
    { key: "receipt_footer", value: value.receiptFooter },
    { key: "timezone", value: value.timezone || "Asia/Makassar" },
  ];
}

export async function saveSettings(value: Settings) {
  for (const row of settingsToRows(value)) {
    await db
      .insert(settings)
      .values(row)
      .onConflictDoUpdate({ target: settings.key, set: { value: row.value } });
  }
}
