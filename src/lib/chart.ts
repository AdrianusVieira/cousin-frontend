import { formatDate } from "@/lib/format";
import type { Theme } from "@/providers/themeContext";

const CHART_COLORS = {
  net: { dark: "#569cd6", light: "#267f99" },
  outcome: { dark: "#ce9178", light: "#a31515" },
  revenue: { dark: "#4ec9b0", light: "#098658" },
} as const;

/** Shared Recharts XAxis/YAxis styling. Spread onto each axis alongside its unique props. */
export const CHART_AXIS = {
  axisLine: false,
  fontSize: 12,
  tick: { fill: "var(--color-text-muted)" },
  tickLine: false,
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

export function formatChartDate(value: unknown): string {
  return formatDate(String(value));
}

export function formatChartTick(value: number): string {
  if (value === 0) return "";

  return `${(value / 1000).toFixed(0)}k`;
}
