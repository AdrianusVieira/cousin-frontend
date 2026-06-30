import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useTheme } from "@/hooks/useTheme";
import { chartColor, formatChartDate, formatChartTick } from "@/lib/chart";
import type { ISODate, Money } from "@/types/api";

import styles from "./BalanceChart.module.css";

const LABELS = {
  balance: "Balance",
  title: "Balance Over Period",
};

interface BalanceChartProps {
  data: Array<{ balance: Money; date: ISODate }>;
}

export function BalanceChart({ data }: BalanceChartProps) {
  const { theme } = useTheme();
  const color = chartColor("net", theme);

  const chartData = useMemo(
    () => data.map((d) => ({ balance: Number(d.balance), date: d.date })),
    [data],
  );

  if (chartData.length === 0) return null;

  return (
    <div className={styles.card}>
      <div className={styles.label}>{LABELS.title}</div>

      <div className={styles.chartWrap}>
        <ResponsiveContainer height="100%" width="100%">
          <LineChart data={chartData}>
            <CartesianGrid stroke="none" />
            <XAxis
              axisLine={false}
              dataKey="date"
              fontSize={12}
              tick={{ fill: "var(--color-text-muted)" }}
              tickFormatter={formatChartDate}
              tickLine={false}
            />
            <YAxis
              axisLine={false}
              fontSize={12}
              tick={{ fill: "var(--color-text-muted)" }}
              tickFormatter={formatChartTick}
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
              labelFormatter={formatChartDate}
            />
            <Line
              activeDot={{ r: 3, strokeWidth: 0 }}
              dataKey="balance"
              dot={false}
              name={LABELS.balance}
              stroke={color}
              strokeWidth={1.2}
              type="monotone"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
