import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export interface Period {
  from: string;
  to: string;
}

export const PERIOD_PRESET = {
  CurrentTrimester: "currentTrimester",
  Custom: "custom",
  Last3Months: "last3Months",
  ThisMonth: "thisMonth",
  ThisYear: "thisYear",
} as const;
export type PeriodPreset = (typeof PERIOD_PRESET)[keyof typeof PERIOD_PRESET];

const PRESET_LABELS: Record<PeriodPreset, string> = {
  [PERIOD_PRESET.CurrentTrimester]: "Current trimester",
  [PERIOD_PRESET.Custom]: "Custom range",
  [PERIOD_PRESET.Last3Months]: "Last 3 months",
  [PERIOD_PRESET.ThisMonth]: "This month",
  [PERIOD_PRESET.ThisYear]: "This year",
};

export function presetLabel(preset: PeriodPreset): string {
  return PRESET_LABELS[preset];
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function trimesterRange(today: Date): Period {
  const month = today.getMonth();
  const year = today.getFullYear();
  const trimesterStart = Math.floor(month / 3) * 3;

  return {
    from: `${year}-${pad(trimesterStart + 1)}-01`,
    to: toISODate(today),
  };
}

function last3MonthsRange(today: Date): Period {
  const from = new Date(today);
  from.setMonth(from.getMonth() - 3);

  return { from: toISODate(from), to: toISODate(today) };
}

function thisMonthRange(today: Date): Period {
  return {
    from: `${today.getFullYear()}-${pad(today.getMonth() + 1)}-01`,
    to: toISODate(today),
  };
}

function thisYearRange(today: Date): Period {
  return {
    from: `${today.getFullYear()}-01-01`,
    to: toISODate(today),
  };
}

export function resolvePreset(preset: PeriodPreset, today = new Date()): Period {
  switch (preset) {
    case PERIOD_PRESET.CurrentTrimester:
      return trimesterRange(today);
    case PERIOD_PRESET.Last3Months:
      return last3MonthsRange(today);
    case PERIOD_PRESET.ThisMonth:
      return thisMonthRange(today);
    case PERIOD_PRESET.ThisYear:
      return thisYearRange(today);
    case PERIOD_PRESET.Custom:
      return last3MonthsRange(today);
  }
}

export function formatPeriodLabel(period: Period): string {
  const from = new Date(period.from + "T00:00:00");
  const to = new Date(period.to + "T00:00:00");

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { day: "numeric", month: "short" });

  const fromStr = fmt(from);
  const toStr = to.getFullYear() !== from.getFullYear()
    ? `${fmt(to)} ${to.getFullYear()}`
    : fmt(to);

  return `${fromStr} – ${toStr}`;
}

/**
 * Reads `from` and `to` from URL search params and provides a setter. The period doubles
 * as the TanStack Query key, so changing it triggers a refetch.
 */
export function usePeriod(defaultPreset: PeriodPreset = PERIOD_PRESET.Last3Months) {
  const [searchParams, setSearchParams] = useSearchParams();

  const period = useMemo<Period>(() => {
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (from && to) {
      return { from, to };
    }

    return resolvePreset(defaultPreset);
  }, [defaultPreset, searchParams]);

  const setPeriod = useCallback(
    (next: Period) => {
      setSearchParams({ from: next.from, to: next.to }, { replace: true });
    },
    [setSearchParams],
  );

  return { period, setPeriod };
}
