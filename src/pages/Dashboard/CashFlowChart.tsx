import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useTheme } from "@/hooks/useTheme";
import type { ISODate, Money } from "@/types/api";

import styles from "./CashFlowChart.module.css";

interface CashFlowDataPoint {
  date: ISODate;
  in: Money;
  out: Money;
}

interface CashFlowChartProps {
  data: CashFlowDataPoint[];
}

const LABELS = {
  moneyIn: "Money in",
  moneyOut: "Money out",
  title: "Cash Flow",
};

const COLORS = {
  dark: { in: "#4ec9b0", out: "#ce9178" },
  light: { in: "#098658", out: "#a31515" },
};

function formatTick(value: number): string {
  if (value === 0) return "";

  return `${(value / 1000).toFixed(0)}k`;
}

function formatDate(value: unknown): string {
  const d = new Date(String(value) + "T00:00:00");

  return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  const { theme } = useTheme();
  const colors = theme === "dark" ? COLORS.dark : COLORS.light;

  const chartData = useMemo(
    () => data.map((d) => ({ date: d.date, in: Number(d.in), out: Number(d.out) })),
    [data],
  );

  return (
    <div className={styles.card}>
      <div className={styles.label}>{LABELS.title}</div>

      <div className={styles.chartWrap}>
        <ResponsiveContainer height="100%" width="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="gradIn" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={colors.in} stopOpacity={0.2} />
                <stop offset="100%" stopColor={colors.in} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradOut" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={colors.out} stopOpacity={0.2} />
                <stop offset="100%" stopColor={colors.out} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="none" />
            <XAxis
              axisLine={false}
              dataKey="date"
              fontSize={12}
              tick={{ fill: "var(--color-text-muted)" }}
              tickFormatter={formatDate}
              tickLine={false}
            />
            <YAxis
              axisLine={false}
              fontSize={12}
              tick={{ fill: "var(--color-text-muted)" }}
              tickFormatter={formatTick}
              tickLine={false}
              width={42}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: 3,
                fontSize: 12,
              }}
              labelFormatter={formatDate}
            />
            <Area
              activeDot={{ r: 3, strokeWidth: 0 }}
              dataKey="in"
              dot={false}
              fill="url(#gradIn)"
              name={LABELS.moneyIn}
              stroke={colors.in}
              strokeWidth={1.2}
              type="monotone"
            />
            <Area
              activeDot={{ r: 3, strokeWidth: 0 }}
              dataKey="out"
              dot={false}
              fill="url(#gradOut)"
              name={LABELS.moneyOut}
              stroke={colors.out}
              strokeWidth={1.2}
              type="monotone"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
