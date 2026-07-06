import { useContext } from "react";

import { PeriodContext, type Period } from "@/providers/periodContext";

export type { Period };

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** First-to-last day of the current calendar month, in local time. */
export function currentMonthRange(today = new Date()): Period {
  const year = today.getFullYear();
  const month = today.getMonth();
  const end = new Date(year, month + 1, 0);

  return {
    from: `${year}-${pad(month + 1)}-01`,
    to: toISODate(end),
  };
}

/** ISO date `months` months before the given ISO date (day-of-month clamped by JS `Date`). */
export function monthsBefore(iso: string, months: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setMonth(d.getMonth() - months);

  return toISODate(d);
}

export function formatPeriodLabel(period: Period): string {
  const from = new Date(period.from + "T00:00:00");
  const to = new Date(period.to + "T00:00:00");

  const fmt = (d: Date) => d.toLocaleDateString("en-US", { day: "numeric", month: "short" });

  const fromStr = fmt(from);
  const toStr =
    to.getFullYear() !== from.getFullYear() ? `${fmt(to)} ${to.getFullYear()}` : fmt(to);

  return `${fromStr} – ${toStr}`;
}

/**
 * Reads the app-global period from context. Must be used within a PeriodProvider.
 * The period doubles as the TanStack Query key, so changing it triggers refetches.
 */
export function usePeriod() {
  const context = useContext(PeriodContext);

  if (!context) {
    throw new Error("usePeriod must be used within a PeriodProvider");
  }

  return context;
}
