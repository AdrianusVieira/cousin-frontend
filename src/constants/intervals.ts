import type { IntervalUnit } from "@/types/api";

const LABELS: Record<IntervalUnit, string> = {
  day: "Day",
  month: "Month",
  week: "Week",
  year: "Year",
};

/** Recurrence interval options, ordered by ascending duration. */
export const INTERVAL_UNIT_OPTIONS: { label: string; value: IntervalUnit }[] = [
  { label: LABELS.day, value: "day" },
  { label: LABELS.week, value: "week" },
  { label: LABELS.month, value: "month" },
  { label: LABELS.year, value: "year" },
];
