import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";

import { ChartFrame } from "@/components/ChartFrame";
import { useTheme } from "@/hooks/useTheme";
import {
  CHART_AXIS,
  CHART_TOOLTIP_STYLE,
  chartColor,
  formatChartDate,
  formatChartTick,
} from "@/lib/chart";
import type { ISODate, Money } from "@/types/api";

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
    <ChartFrame title={LABELS.title}>
      <LineChart data={chartData}>
        <CartesianGrid stroke="none" />
        <XAxis dataKey="date" tickFormatter={formatChartDate} {...CHART_AXIS} />
        <YAxis tickFormatter={formatChartTick} width={42} {...CHART_AXIS} />
        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} labelFormatter={formatChartDate} />
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
    </ChartFrame>
  );
}
