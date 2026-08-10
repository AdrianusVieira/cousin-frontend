import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";

import { ChartFrame } from "@/components/ChartFrame";
import { useTheme } from "@/hooks/useTheme";
import { CHART_REFERENCE_LABEL, chartColor, formatChartDate, formatChartTick } from "@/lib/chart";
import type { ISODate, Money } from "@/types/api";

const LABELS = {
  average: "Avg",
  title: "Patrimony Trend",
  total: "Total",
};

const TEXT = {
  info:
    "Combined balance of every active wallet over time, with the dashed line at the period " +
    "average. Only debit movements change a wallet balance — credit spending is not reflected " +
    "here until you record it.",
};

interface PatrimonyChartProps {
  data: Array<{ date: ISODate; total: Money }>;
}

export function PatrimonyChart({ data }: PatrimonyChartProps) {
  const { theme } = useTheme();
  const color = chartColor("net", theme);

  const chartData = useMemo(
    () => data.map((d) => ({ date: d.date, total: Number(d.total) })),
    [data],
  );

  const averageValue = useMemo(
    () =>
      chartData.length === 0
        ? null
        : chartData.reduce((sum, d) => sum + d.total, 0) / chartData.length,
    [chartData],
  );

  if (chartData.length === 0) return null;

  return (
    <ChartFrame fill info={TEXT.info} title={LABELS.title}>
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
        {averageValue !== null && (
          <ReferenceLine
            label={{ ...CHART_REFERENCE_LABEL, value: LABELS.average }}
            stroke={color}
            strokeDasharray="6 3"
            strokeWidth={1}
            y={averageValue}
          />
        )}
        <Line
          activeDot={{ r: 3, strokeWidth: 0 }}
          dataKey="total"
          dot={false}
          name={LABELS.total}
          stroke={color}
          strokeWidth={1.2}
          type="monotone"
        />
      </LineChart>
    </ChartFrame>
  );
}
