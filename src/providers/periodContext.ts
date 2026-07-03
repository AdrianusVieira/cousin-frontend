import { createContext } from "react";

export interface Period {
  from: string;
  to: string;
}

export interface PeriodContextValue {
  period: Period;
  setPeriod: (period: Period) => void;
}

export const PeriodContext = createContext<PeriodContextValue | null>(null);

export const PERIOD_STORAGE_KEY = "cousin-period";
