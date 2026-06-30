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
    <ChartFrame title={LABELS.title}>
      <LineChart data={chartData}>
        <CartesianGrid stroke="none" />
        <XAxis dataKey="date" tickFormatter={formatChartDate} {...CHART_AXIS} />
        <YAxis tickFormatter={formatChartTick} width={42} {...CHART_AXIS} />
        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} labelFormatter={formatChartDate} />
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
    </ChartFrame>
  );
}
