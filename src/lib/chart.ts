import type { Theme } from "@/providers/themeContext";

const CHART_COLORS = {
  net: { dark: "#569cd6", light: "#267f99" },
  outcome: { dark: "#ce9178", light: "#a31515" },
  revenue: { dark: "#4ec9b0", light: "#098658" },
} as const;

export type ChartColorKey = keyof typeof CHART_COLORS;

export function chartColor(key: ChartColorKey, theme: Theme): string {
  return CHART_COLORS[key][theme];
}

export function formatChartDate(value: unknown): string {
  const d = new Date(String(value) + "T00:00:00");

  return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

export function formatChartTick(value: number): string {
  if (value === 0) return "";

  return `${(value / 1000).toFixed(0)}k`;
}
