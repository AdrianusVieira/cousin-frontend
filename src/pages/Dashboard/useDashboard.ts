import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import { formatMoney, formatPercent } from "@/lib/format";
import { formatPeriodLabel, usePeriod } from "@/lib/period";
import type { DashboardResponse } from "@/types/api";

import type { FlowSegment } from "./FlowBar";

const LABELS = {
  pendingCredit: "Pending credit",
  settledIn: "Settled in",
  settledOut: "Settled out",
  unpaidBills: "Unpaid bills",
  unreceivedRevenues: "Unreceived revenues",
};

const TEXT = {
  empty: "—",
  incomeInfo:
    "Everything expected to land in your wallets over the period. Credit counts on its statement " +
    "date, so each installment falls in the month it is charged. The faded slices are committed but " +
    "not settled yet: pending credit and revenues you have not marked received.",
  netInfo:
    "Income minus Outcome for the period, counting money that has not settled yet — pending credit, " +
    "unpaid bills and unreceived revenues are all included. It is what the period ends at if " +
    "everything currently scheduled goes through, not your current wallet balance.",
  outcomeInfo:
    "Everything expected to leave your wallets over the period. Credit counts on its statement date, " +
    "so a parcelled purchase spreads across the months it is actually charged instead of landing in " +
    "full on the purchase month. The faded slices are committed but not settled yet: pending credit " +
    "and bills you have not marked paid.",
  savingsRateInfo:
    "Net as a percentage of Income for the period. Negative means the period spends more than it " +
    "brings in. It moves with the same settlement basis as the bars, so committed-but-unsettled " +
    "amounts already count against it.",
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
    { label: LABELS.settledIn, value: data?.income.settled ?? ZERO },
    { label: LABELS.pendingCredit, value: data?.income.pendingCredit ?? ZERO },
    { label: LABELS.unreceivedRevenues, value: data?.income.unreceived ?? ZERO },
  ];
  const outcomeSegments: FlowSegment[] = [
    { label: LABELS.settledOut, value: data?.outcome.settled ?? ZERO },
    { label: LABELS.pendingCredit, value: data?.outcome.pendingCredit ?? ZERO },
    { label: LABELS.unpaidBills, value: data?.outcome.unpaid ?? ZERO },
  ];

  return {
    // data
    cashFlow: data?.cashFlow ?? [],
    error: query.error,
    flowScaleMax,
    incomeInfo: TEXT.incomeInfo,
    incomeSegments,
    incomeTotal,
    isLoading: query.isLoading,
    netInfo: TEXT.netInfo,
    netValue: data ? formatMoney(data.net) : TEXT.empty,
    outcomeInfo: TEXT.outcomeInfo,
    outcomeSegments,
    outcomeTotal,
    periodLabel,
    savingsRateInfo: TEXT.savingsRateInfo,
    savingsRateValue: data ? formatPercent(data.savingsRate) : TEXT.empty,
  };
}
