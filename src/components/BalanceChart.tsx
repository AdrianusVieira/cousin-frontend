import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";

import { ChartFrame } from "@/components/ChartFrame";
import { useTheme } from "@/hooks/useTheme";
import {
  CHART_AXIS,
  CHART_REFERENCE_LABEL,
  CHART_TOOLTIP_STYLE,
  chartColor,
  formatChartDate,
  formatChartTick,
} from "@/lib/chart";
import type { ISODate, Money } from "@/types/api";

const LABELS = {
  average: "Avg",
  balance: "Balance",
  title: "Balance Over Period",
};

const TEXT = {
  info:
    "This wallet's balance at each point in the selected period, with the dashed line at the " +
    "period average. Only debit movements change a balance — credit spending is tracked on the " +
    "Credit page and never moves this line.",
};

interface BalanceChartProps {
  average?: Money;
  data: Array<{ balance: Money; date: ISODate }>;
}

export function BalanceChart({ average, data }: BalanceChartProps) {
  const { theme } = useTheme();
  const color = chartColor("net", theme);
  const averageValue = average !== undefined ? Number(average) : null;

  const chartData = useMemo(
    () => data.map((d) => ({ balance: Number(d.balance), date: d.date })),
    [data],
  );

  if (chartData.length === 0) return null;

  return (
    <ChartFrame info={TEXT.info} title={LABELS.title}>
      <LineChart data={chartData}>
        <CartesianGrid stroke="none" />
        <XAxis dataKey="date" tickFormatter={formatChartDate} {...CHART_AXIS} />
        <YAxis tickFormatter={formatChartTick} width={42} {...CHART_AXIS} />
        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} labelFormatter={formatChartDate} />
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
