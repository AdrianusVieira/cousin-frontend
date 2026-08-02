import { formatDate } from "@/lib/format";
import type { Theme } from "@/providers/themeContext";

const CHART_COLORS = {
  net: { dark: "#569cd6", light: "#267f99" },
  outcome: { dark: "#ce9178", light: "#a31515" },
  revenue: { dark: "#4ec9b0", light: "#098658" },
} as const;

/**
 * Categorical palette for charts with one series per entity (e.g. a wallet), where the
 * colour carries identity rather than meaning. Kept separate from CHART_COLORS so the
 * semantic net/outcome/revenue hues never stand in for "some wallet".
 */
const CHART_SERIES = [
  { dark: "#569cd6", light: "#267f99" },
  { dark: "#4ec9b0", light: "#098658" },
  { dark: "#ce9178", light: "#a31515" },
  { dark: "#c586c0", light: "#af00db" },
  { dark: "#dcdcaa", light: "#795e26" },
  { dark: "#9cdcfe", light: "#001080" },
] as const;

/** Shared Recharts XAxis/YAxis styling. Spread onto each axis alongside its unique props. */
export const CHART_AXIS = {
  axisLine: false,
  fontSize: 12,
  tick: { fill: "var(--color-text-muted)" },
  tickLine: false,
} as const;

/** Shared Recharts ReferenceLine label styling (e.g. the average baseline). */
export const CHART_REFERENCE_LABEL = {
  fill: "var(--color-text-muted)",
  fontSize: 11,
  position: "insideTopLeft",
} as const;

/** Shared Recharts Tooltip contentStyle. */
export const CHART_TOOLTIP_STYLE = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: 3,
  fontSize: 12,
} as const;

export type ChartColorKey = keyof typeof CHART_COLORS;

export function chartColor(key: ChartColorKey, theme: Theme): string {
  return CHART_COLORS[key][theme];
}

/** Colour for the nth series of a categorical chart; cycles once the palette runs out. */
export function seriesColor(index: number, theme: Theme): string {
  return CHART_SERIES[index % CHART_SERIES.length]![theme];
}

export function formatChartDate(value: unknown): string {
  return formatDate(String(value));
}

/** Display an ISO date as "Jul 26" — for axes bucketed by month. */
export function formatChartMonth(value: unknown): string {
  const d = new Date(String(value) + "T00:00:00");

  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export function formatChartTick(value: number): string {
  if (value === 0) return "";

  const abs = Math.abs(value);
  if (abs >= 1_000) {
    return `${(value / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}k`;
  }

  return String(Math.round(value));
}
