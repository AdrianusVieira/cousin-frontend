import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from "recharts";

import { ChartFrame } from "@/components/ChartFrame";
import { useTheme } from "@/hooks/useTheme";
import {
  CHART_AXIS,
  CHART_TOOLTIP_STYLE,
  formatChartMonth,
  formatChartTick,
  seriesColor,
} from "@/lib/chart";
import { formatMoney } from "@/lib/format";
import type { ISODate } from "@/types/api";

const LABELS = {
  title: "Statement History",
};

const TEXT = {
  info:
    "Total credit charged per statement month, stacked by wallet. A purchase split into " +
    "installments contributes one installment to each month's bar rather than its full value " +
    "to the month of purchase.",
};

const LEGEND_STYLE = { fontSize: 12 };

/** One bar per term; each wallet contributes a stacked segment keyed by its id. */
export type CreditHistoryPoint = { term: ISODate } & Record<string, number | string>;

export interface CreditHistoryWallet {
  id: string;
  name: string;
}

interface CreditHistoryChartProps {
  points: CreditHistoryPoint[];
  wallets: CreditHistoryWallet[];
}

export function CreditHistoryChart({ points, wallets }: CreditHistoryChartProps) {
  const { theme } = useTheme();

  if (points.length === 0) return null;

  return (
    <ChartFrame info={TEXT.info} title={LABELS.title}>
      <BarChart data={points}>
        <CartesianGrid stroke="none" />
        <XAxis dataKey="term" tickFormatter={formatChartMonth} {...CHART_AXIS} />
        <YAxis tickFormatter={formatChartTick} width={42} {...CHART_AXIS} />
        <Tooltip
          contentStyle={CHART_TOOLTIP_STYLE}
          cursor={{ fill: "var(--color-border)", fillOpacity: 0.25 }}
          formatter={(value) => formatMoney(String(value))}
          labelFormatter={formatChartMonth}
        />
        <Legend iconSize={9} iconType="square" wrapperStyle={LEGEND_STYLE} />
        {wallets.map((wallet, index) => (
          <Bar
            dataKey={wallet.id}
            fill={seriesColor(index, theme)}
            key={wallet.id}
            name={wallet.name}
            stackId="statement"
          />
        ))}
      </BarChart>
    </ChartFrame>
  );
}
