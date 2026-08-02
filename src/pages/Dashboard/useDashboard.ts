import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import { formatMoney, formatPercent } from "@/lib/format";
import { formatPeriodLabel, usePeriod } from "@/lib/period";
import type { DashboardResponse } from "@/types/api";

import type { FlowSegment } from "./FlowBar";

const LABELS = {
  transactionsIn: "Transactions in",
  transactionsOut: "Transactions out",
  unpaidBills: "Unpaid bills",
  unreceivedRevenues: "Unreceived revenues",
};

const TEXT = {
  empty: "—",
};

const ZERO = "0.00";

export function useDashboard() {
  const { period } = usePeriod();

  const query = useQuery({
    queryFn: () =>
      api.get<DashboardResponse>("/dashboard", { query: { from: period.from, to: period.to } }),
    queryKey: ["dashboard", period.from, period.to],
  });

  const data = query.data;

  const periodLabel = formatPeriodLabel(period);
  const incomeTotal = data?.income.total ?? ZERO;
  const outcomeTotal = data?.outcome.total ?? ZERO;
  const flowScaleMax = Math.max(Number(incomeTotal), Number(outcomeTotal));

  const incomeSegments: FlowSegment[] = [
    { label: LABELS.transactionsIn, value: data?.income.transactions ?? ZERO },
    { label: LABELS.unreceivedRevenues, value: data?.income.unreceived ?? ZERO },
  ];
  const outcomeSegments: FlowSegment[] = [
    { label: LABELS.transactionsOut, value: data?.outcome.transactions ?? ZERO },
    { label: LABELS.unpaidBills, value: data?.outcome.unpaid ?? ZERO },
  ];

  return {
    // data
    cashFlow: data?.cashFlow ?? [],
    error: query.error,
    flowScaleMax,
    incomeSegments,
    incomeTotal,
    isLoading: query.isLoading,
    netValue: data ? formatMoney(data.net) : TEXT.empty,
    outcomeSegments,
    outcomeTotal,
    periodLabel,
    savingsRateValue: data ? formatPercent(data.savingsRate) : TEXT.empty,
  };
}
