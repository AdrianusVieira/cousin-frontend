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
import { chartColor, formatChartDate, formatChartTick } from "@/lib/chart";
import type { ISODate, Money } from "@/types/api";

import styles from "./BreakdownChart.module.css";

const LABELS = {
  income: "Income",
  outcome: "Outcome",
  title: "Breakdown",
};

interface BreakdownChartProps {
  data: Array<{ bucket: ISODate; income: Money; outcome: Money }>;
}

export function BreakdownChart({ data }: BreakdownChartProps) {
  const { theme } = useTheme();
  const colors = { income: chartColor("revenue", theme), outcome: chartColor("outcome", theme) };

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        bucket: d.bucket,
        income: Number(d.income),
        outcome: Number(d.outcome),
      })),
    [data],
  );

  if (chartData.length === 0) return null;

  return (
    <div className={styles.card}>
      <div className={styles.label}>{LABELS.title}</div>

      <div className={styles.chartWrap}>
        <ResponsiveContainer height="100%" width="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="gradIncome" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={colors.income} stopOpacity={0.2} />
                <stop offset="100%" stopColor={colors.income} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradOutcome" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={colors.outcome} stopOpacity={0.2} />
                <stop offset="100%" stopColor={colors.outcome} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="none" />
            <XAxis
              axisLine={false}
              dataKey="bucket"
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
            <Area
              activeDot={{ r: 3, strokeWidth: 0 }}
              dataKey="income"
              dot={false}
              fill="url(#gradIncome)"
              name={LABELS.income}
              stroke={colors.income}
              strokeWidth={1.2}
              type="monotone"
            />
            <Area
              activeDot={{ r: 3, strokeWidth: 0 }}
              dataKey="outcome"
              dot={false}
              fill="url(#gradOutcome)"
              name={LABELS.outcome}
              stroke={colors.outcome}
              strokeWidth={1.2}
              type="monotone"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
