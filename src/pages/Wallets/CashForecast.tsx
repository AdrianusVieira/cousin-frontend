import { useMemo } from "react";
import { Line, LineChart, ReferenceDot, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";

import { ChartFrame } from "@/components/ChartFrame";
import { DataTable } from "@/components/DataTable";
import { FilterSegment } from "@/components/FilterSegment";
import { StatCard } from "@/components/StatCard";
import { useTheme } from "@/hooks/useTheme";
import {
  CHART_AXIS,
  CHART_TOOLTIP_STYLE,
  chartColor,
  formatChartDate,
  formatChartTick,
} from "@/lib/chart";
import { formatDateWithYear, formatMoney } from "@/lib/format";
import type { WalletForecastResponse } from "@/types/api";

import styles from "./CashForecast.module.css";
import { FORECAST_OPTIONS, useCashForecast } from "./useCashForecast";

const LABELS = {
  amount: "Amount",
  chart: "Projected cash balance",
  current: "Current patrimony",
  date: "Due",
  empty: "No open scheduled items in this horizon.",
  entry: "Scheduled item",
  loading: "Loading forecast…",
  lowest: "Lowest projected balance",
  projected: "At end of horizon",
  schedule: "See the scheduled items behind this forecast",
  title: "Cash forecast",
  type: "Type",
};
const TEXT = {
  assumptions:
    "Preview based on existing scheduled items only. Assumes open income arrives and bills and cards are paid on their due dates; overdue items are included today. Linked payments are deducted from obligations to avoid counting them twice. New spending, interest and ungenerated recurrence instances are not included.",
  baseline: "Today's balance",
  intro:
    "What your current patrimony could become after scheduled money comes in and goes out. Starts today, independently of the history period above.",
  preview: "Forecast preview",
  projection: "Projected closing balance",
  shortage: "Projected balance first falls below zero on",
};
const TYPES = { bill: "Bill", revenue: "Expected income", credit: "Card payment" };
type Event = WalletForecastResponse["events"][number];
const COLUMNS = [
  { key: "date", header: LABELS.date, render: (event: Event) => formatDateWithYear(event.date) },
  { key: "entry", header: LABELS.entry, render: (event: Event) => event.label },
  { key: "type", header: LABELS.type, render: (event: Event) => TYPES[event.type] },
  {
    key: "amount",
    header: LABELS.amount,
    align: "right" as const,
    render: (event: Event) => `${event.type === "revenue" ? "+" : "−"}${formatMoney(event.amount)}`,
  },
];

export function CashForecast() {
  const { data, days, error, isLoading, setDays } = useCashForecast();
  const { theme } = useTheme();
  const chartData = useMemo(
    () => data?.series.map((point) => ({ date: point.date, balance: Number(point.balance) })) ?? [],
    [data],
  );
  return (
    <section aria-label={LABELS.title} className={styles.panel}>
      <div className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>{TEXT.preview}</span>
          <h2>{LABELS.title}</h2>
        </div>
        <FilterSegment onChange={setDays} options={FORECAST_OPTIONS} value={days} />
      </div>
      <p className={styles.copy}>{TEXT.intro}</p>
      {isLoading && <p role="status">{LABELS.loading}</p>}
      {error && (
        <p className={styles.error} role="alert">
          {error.message}
        </p>
      )}
      {data && (
        <>
          <div className={styles.stats}>
            <StatCard
              accent="net"
              label={LABELS.current}
              note={formatDateWithYear(data.asOf)}
              value={formatMoney(data.openingBalance)}
            />
            <StatCard
              accent={Number(data.closingBalance) < 0 ? "outcome" : "net"}
              label={LABELS.projected}
              note={formatDateWithYear(data.series.at(-1)!.date)}
              value={formatMoney(data.closingBalance)}
            />
            <StatCard
              accent={Number(data.lowestBalance) < 0 ? "outcome" : "credit"}
              label={LABELS.lowest}
              note={formatDateWithYear(data.lowestDate)}
              value={formatMoney(data.lowestBalance)}
            />
          </div>
          <div className={styles.chart}>
            <ChartFrame fill info={TEXT.assumptions} title={LABELS.chart}>
              <LineChart data={chartData} margin={{ bottom: 3, left: 12, right: 12, top: 12 }}>
                <XAxis
                  {...CHART_AXIS}
                  dataKey="date"
                  minTickGap={36}
                  tickFormatter={formatChartDate}
                />
                <YAxis
                  {...CHART_AXIS}
                  domain={["auto", "auto"]}
                  tickFormatter={formatChartTick}
                  width={54}
                />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  formatter={(value) => formatMoney(String(value))}
                  labelFormatter={formatChartDate}
                />
                <ReferenceLine stroke={chartColor("outcome", theme)} strokeDasharray="3 3" y={0} />
                <ReferenceLine
                  label={{
                    fill: "var(--color-text-muted)",
                    fontSize: 12,
                    value: TEXT.baseline,
                    position: "insideTopRight",
                  }}
                  stroke="var(--color-text-muted)"
                  strokeDasharray="6 6"
                  y={Number(data.openingBalance)}
                />
                <Line
                  isAnimationActive={false}
                  activeDot={{ r: 3 }}
                  dataKey="balance"
                  dot={false}
                  name={TEXT.projection}
                  stroke={chartColor("net", theme)}
                  strokeDasharray="6 3"
                  strokeWidth={2}
                  type="stepAfter"
                />
                <ReferenceDot
                  fill={chartColor(Number(data.lowestBalance) < 0 ? "outcome" : "net", theme)}
                  r={4}
                  stroke="var(--color-surface)"
                  x={data.lowestDate}
                  y={Number(data.lowestBalance)}
                />
              </LineChart>
            </ChartFrame>
          </div>
          {data.firstNegativeDate && (
            <p className={styles.error} role="status">
              {TEXT.shortage} {formatDateWithYear(data.firstNegativeDate)}.
            </p>
          )}
          <details className={styles.schedule}>
            <summary>
              {LABELS.schedule} ({data.events.length})
            </summary>
            <DataTable
              columns={COLUMNS}
              emptyMessage={LABELS.empty}
              keyExtractor={(event) => `${event.type}-${event.id}`}
              rows={data.events}
            />
          </details>
        </>
      )}
      <p className={styles.assumptions}>{TEXT.assumptions}</p>
    </section>
  );
}
