import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import { formatDelta, formatMoney, formatPercent } from "@/lib/format";
import { formatPeriodLabel, usePeriod } from "@/lib/period";
import type { DashboardResponse } from "@/types/api";

const TEXT = {
  empty: "â€”",
  vsPrior: "vs prior",
};

export function useDashboard() {
  const { period } = usePeriod();

  const query = useQuery({
    queryFn: () =>
      api.get<DashboardResponse>("/dashboard", { query: { from: period.from, to: period.to } }),
    queryKey: ["dashboard", period.from, period.to],
  });

  const data = query.data;

  const periodLabel = formatPeriodLabel(period);
  const savingsRateNote = data?.savingsRateDelta != null
    ? `${formatDelta(data.savingsRateDelta)} ${TEXT.vsPrior}`
    : undefined;

  return {
    // data
    cashFlow: data?.cashFlow ?? [],
    error: query.error,
    isLoading: query.isLoading,
    netValue: data ? formatMoney(data.net) : TEXT.empty,
    outcomeValue: data ? formatMoney(data.outcome) : TEXT.empty,
    pendingCreditPerWallet: data?.pendingCredit.perWallet ?? [],
    pendingCreditTotal: data?.pendingCredit.total ?? "0",
    periodLabel,
    revenueValue: data ? formatMoney(data.revenue) : TEXT.empty,
    savingsRateNote,
    savingsRateValue: data ? formatPercent(data.savingsRate) : TEXT.empty,
  };
}
