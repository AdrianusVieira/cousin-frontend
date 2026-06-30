import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import { formatMoney } from "@/lib/format";
import { formatPeriodLabel, PERIOD_PRESET, usePeriod } from "@/lib/period";
import type { RecurrenceListResponse } from "@/types/api";

const TEXT = {
  empty: "—",
};

export function useRecurrences() {
  const { period, setPeriod } = usePeriod(PERIOD_PRESET.Last3Months);

  const query = useQuery({
    queryFn: () =>
      api.get<RecurrenceListResponse>("/recurrences", {
        query: { from: period.from, to: period.to },
      }),
    queryKey: ["recurrences", period.from, period.to],
  });

  const data = query.data;

  return {
    // data
    activeCountValue: data ? String(data.summary.activeCount) : TEXT.empty,
    error: query.error,
    inactiveCountValue: data ? String(data.summary.inactiveCount) : TEXT.empty,
    isLoading: query.isLoading,
    items: data?.items ?? [],
    period,
    periodLabel: formatPeriodLabel(period),
    recurringOutflowValue: data ? formatMoney(data.summary.recurringOutflow) : TEXT.empty,

    // handlers
    setPeriod,
  };
}
