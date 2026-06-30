import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useTheme } from "@/hooks/useTheme";
import { chartColor, formatChartTick } from "@/lib/chart";
import type { Money, Wallet } from "@/types/api";

import styles from "./DivergingBars.module.css";

type WalletRow = Wallet & { vsAverageDelta: Money };

const LABELS = {
  title: "Current vs 3-mo Average",
};

interface DivergingBarsProps {
  items: WalletRow[];
}

export function DivergingBars({ items }: DivergingBarsProps) {
  const { theme } = useTheme();
  const colors = { negative: chartColor("outcome", theme), positive: chartColor("revenue", theme) };

  const chartData = useMemo(
    () =>
      items
        .filter((w) => !w.archived)
        .map((w) => ({
          delta: Number(w.vsAverageDelta),
          name: w.name,
        })),
    [items],
  );

  if (chartData.length === 0) return null;

  return (
    <div className={styles.card}>
      <div className={styles.label}>{LABELS.title}</div>

      <div className={styles.chartWrap}>
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={chartData} layout="vertical">
            <XAxis
              axisLine={false}
              fontSize={12}
              tick={{ fill: "var(--color-text-muted)" }}
              tickFormatter={formatChartTick}
              tickLine={false}
              type="number"
            />
            <YAxis
              axisLine={false}
              dataKey="name"
              fontSize={12}
              tick={{ fill: "var(--color-text-muted)" }}
              tickLine={false}
              type="category"
              width={80}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: 3,
                fontSize: 12,
              }}
              cursor={false}
            />
            <Bar dataKey="delta" name="vs Avg" radius={0}>
              {chartData.map((entry, i) => (
                <Cell
                  fill={entry.delta >= 0 ? colors.positive : colors.negative}
                  key={i}
                  opacity={0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
