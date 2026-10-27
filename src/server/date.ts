import "server-only";
import { formatInTimeZone } from "date-fns-tz";

export const TZ = "Asia/Makassar";

export function witaDateKey(date: Date = new Date()) {
  return formatInTimeZone(date, TZ, "yyyy-MM-dd");
}

export function witaDayRange(dateKey: string) {
  const start = new Date(`${dateKey}T00:00:00+08:00`);
  const end = new Date(start.getTime() + 86_400_000);
  return { start, end };
}

export function witaMonthRange(monthKey: string) {
  const start = new Date(`${monthKey}-01T00:00:00+08:00`);
  const [year, month] = monthKey.split("-").map(Number);
  const nextMonth = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, "0")}`;
  const end = new Date(`${nextMonth}-01T00:00:00+08:00`);
  return { start, end };
}

export function isValidDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function isValidMonthKey(value: string) {
  if (!/^\d{4}-\d{2}$/.test(value)) return false;
  const month = Number(value.slice(5, 7));
  return month >= 1 && month <= 12;
}
