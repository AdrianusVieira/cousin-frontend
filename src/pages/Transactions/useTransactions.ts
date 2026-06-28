import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { api } from "@/lib/api/client";
import { formatMoney } from "@/lib/format";
import { formatPeriodLabel, PERIOD_PRESET, usePeriod } from "@/lib/period";
import type { TransactionListResponse } from "@/types/api";

const METHOD_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Debit", value: "debit" },
  { label: "Credit", value: "credit" },
] as const;

const TEXT = {
  empty: "—",
};

export function useTransactions() {
  const { period, setPeriod } = usePeriod(PERIOD_PRESET.Last3Months);
  const [searchParams, setSearchParams] = useSearchParams();

  const method = searchParams.get("method") ?? "all";

  const setMethod = useCallback(
    (next: string) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (next === "all") {
          params.delete("method");
        } else {
          params.set("method", next);
        }
        return params;
      }, { replace: true });
    },
    [setSearchParams],
  );

  const query = useInfiniteQuery({
    getNextPageParam: (lastPage: TransactionListResponse) =>
      lastPage.nextCursor ?? undefined,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      api.get<TransactionListResponse>("/transactions", {
        query: {
          from: period.from,
          to: period.to,
          ...(method !== "all" ? { method } : {}),
          ...(pageParam ? { cursor: pageParam } : {}),
        },
      }),
    queryKey: ["transactions", period.from, period.to, method],
  });

  const summary = query.data?.pages[0]?.summary;
  const items = useMemo(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );

  return {
    // data
    error: query.error,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isLoading: query.isLoading,
    items,
    method,
    methodOptions: METHOD_OPTIONS,
    netValue: summary ? formatMoney(summary.net) : TEXT.empty,
    period,
    periodLabel: formatPeriodLabel(period),
    totalInValue: summary ? formatMoney(summary.totalIn) : TEXT.empty,
    totalOutValue: summary ? formatMoney(summary.totalOut) : TEXT.empty,

    // handlers
    fetchNextPage: query.fetchNextPage,
    setMethod,
    setPeriod,
  };
}
