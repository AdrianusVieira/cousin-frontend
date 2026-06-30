import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";

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

export function CashFlowChart({ data }: CashFlowChartProps) {
  const { theme } = useTheme();
  const colors = { in: chartColor("revenue", theme), out: chartColor("outcome", theme) };

  const chartData = useMemo(
    () => data.map((d) => ({ date: d.date, in: Number(d.in), out: Number(d.out) })),
    [data],
  );

  return (
    <ChartFrame fill title={LABELS.title}>
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
        <XAxis dataKey="date" tickFormatter={formatChartDate} {...CHART_AXIS} />
        <YAxis tickFormatter={formatChartTick} width={42} {...CHART_AXIS} />
        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} labelFormatter={formatChartDate} />
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
    </ChartFrame>
  );
}
