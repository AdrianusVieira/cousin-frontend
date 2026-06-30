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

import styles from "./VarianceChart.module.css";

const LABELS = {
  actual: "Actual",
  estimated: "Estimated",
  title: "Estimated vs Actual",
};

interface VarianceChartProps {
  data: Array<{ actual: Money | null; date: ISODate; estimated: Money }>;
}

export function VarianceChart({ data }: VarianceChartProps) {
  const { theme } = useTheme();
  const colors = { actual: chartColor("revenue", theme), estimated: chartColor("net", theme) };

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        actual: d.actual ? Number(d.actual) : null,
        date: d.date,
        estimated: Number(d.estimated),
      })),
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
              dataKey="estimated"
              dot={false}
              name={LABELS.estimated}
              stroke={colors.estimated}
              strokeDasharray="6 3"
              strokeWidth={1.2}
              type="monotone"
            />
            <Line
              activeDot={{ r: 3, strokeWidth: 0 }}
              connectNulls
              dataKey="actual"
              dot={false}
              name={LABELS.actual}
              stroke={colors.actual}
              strokeWidth={1.2}
              type="monotone"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
