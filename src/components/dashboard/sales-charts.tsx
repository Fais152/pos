"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DayPoint, HourPoint } from "@/lib/report";
import { formatRupiah, formatRupiahShort } from "@/lib/format";

function ChartTooltip({
  active,
  payload,
  label,
  valueLabel,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { transactions?: number } }>;
  label?: string;
  valueLabel: string;
}) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  const transactions = payload[0].payload.transactions;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-foreground">{label}</p>
      <p className="mt-0.5 tabular-nums text-muted-foreground">
        {valueLabel}: <span className="font-semibold text-foreground">{formatRupiah(value)}</span>
      </p>
      {typeof transactions === "number" && (
        <p className="text-muted-foreground">{transactions} transaksi</p>
      )}
    </div>
  );
}

export function HourlyChart({ data }: { data: HourPoint[] }) {
  const display = data.filter((d) => d.hour >= 6);
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={display} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          interval={1}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => (v === 0 ? "0" : formatRupiahShort(v))}
          width={64}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          content={<ChartTooltip valueLabel="Omzet" />}
        />
        <Bar
          dataKey="revenue"
          fill="var(--primary-text)"
          fillOpacity={0.8}
          radius={[4, 4, 0, 0]}
          maxBarSize={26}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendChart({ data }: { data: DayPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={16}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => (v === 0 ? "0" : formatRupiahShort(v))}
          width={64}
        />
        <Tooltip content={<ChartTooltip valueLabel="Omzet" />} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="var(--primary-text)"
          strokeWidth={2}
          fill="var(--primary-text)"
          fillOpacity={0.12}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
