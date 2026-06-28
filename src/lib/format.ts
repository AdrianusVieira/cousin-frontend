import type { Money } from "@/types/api";

/**
 * Format a Money string for display. Money is always a decimal string in the API —
 * we parse only for display and never store the numeric result.
 */
export function formatMoney(value: Money, compact = false): string {
  const num = Number(value);

  if (compact && Math.abs(num) >= 1_000) {
    return `${(num / 1_000).toFixed(1)}k`;
  }

  return num.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatDelta(value: number, unit = "pts"): string {
  const sign = value >= 0 ? "+" : "";

  return `${sign}${value.toFixed(1)} ${unit}`;
}

export function formatMoneyDelta(value: Money): string {
  const num = Number(value);
  const sign = num >= 0 ? "+" : "";

  return `${sign}${formatMoney(value)}`;
}
