import { formatInTimeZone } from 'date-fns-tz';
import { id } from 'date-fns/locale';

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatRupiahShort(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1).replace(".", ",")} jt`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `Rp ${Math.round(amount / 1_000)} rb`;
  }
  return `Rp ${amount}`;
}

export function formatWitaDate(dateInput: string | Date, formatStr: string = 'd MMMM yyyy, HH:mm'): string {
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return formatInTimeZone(date, 'Asia/Makassar', formatStr, { locale: id });
  } catch {
    return String(dateInput);
  }
}

export function getWitaDateString(dateInput: string | Date = new Date()): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return formatInTimeZone(date, 'Asia/Makassar', 'yyyy-MM-dd');
}
