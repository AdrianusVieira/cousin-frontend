import { useCallback, useMemo, useState, type ReactNode } from "react";

import { currentMonthRange } from "@/lib/period";

import { PERIOD_STORAGE_KEY, PeriodContext, type Period } from "./periodContext";

function resolveInitialPeriod(): Period {
  const stored = localStorage.getItem(PERIOD_STORAGE_KEY);

  if (stored) {
    try {
      const parsed = JSON.parse(stored) as Partial<Period>;
      if (parsed.from && parsed.to) {
        return { from: parsed.from, to: parsed.to };
      }
    } catch {
      // Malformed storage — fall back to the default range.
    }
  }

  return currentMonthRange();
}

/**
 * App-global date range shared by every screen's queries. Persisted to localStorage so
 * the last-picked range survives reloads; defaults to the current calendar month, first
 * day to last.
 */
export function PeriodProvider({ children }: { children: ReactNode }) {
  const [period, setPeriodState] = useState<Period>(resolveInitialPeriod);

  const setPeriod = useCallback((next: Period) => {
    localStorage.setItem(PERIOD_STORAGE_KEY, JSON.stringify(next));
    setPeriodState(next);
  }, []);

  const value = useMemo(() => ({ period, setPeriod }), [period, setPeriod]);

  return <PeriodContext value={value}>{children}</PeriodContext>;
}
