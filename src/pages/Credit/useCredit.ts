import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { api } from "@/lib/api/client";
import { formatMoney } from "@/lib/format";
import type { CreditResponse, Transaction } from "@/types/api";

const STATUS_OPTIONS = [
  { label: "Unsettled", value: "unsettled" },
  { label: "Settled", value: "settled" },
  { label: "All", value: "all" },
] as const;

const TEXT = {
  empty: "â€”",
};

export function useCredit() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [settlingGroupKey, setSettlingGroupKey] = useState<string | null>(null);

  const status = searchParams.get("status") ?? "unsettled";

  const setStatus = useCallback(
    (next: string) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (next === "unsettled") {
          params.delete("status");
        } else {
          params.set("status", next);
        }
        return params;
      }, { replace: true });
    },
    [setSearchParams],
  );

  const query = useQuery({
    queryFn: () => api.get<CreditResponse>("/credit", { query: { status } }),
    queryKey: ["credit", status],
  });

  const settleMutation = useMutation({
    mutationFn: (transactionIds: string[]) =>
      api.post<Transaction[]>("/credit/settle", { transactionIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setSettlingGroupKey(null);
    },
  });

  const data = query.data;
  const groups = [...(data?.groups ?? [])].sort((a, b) => b.term.localeCompare(a.term));

  return {
    // data
    error: query.error,
    groups,
    isLoading: query.isLoading,
    isSettling: settleMutation.isPending,
    openStatementsValue: data ? String(data.summary.openStatements) : TEXT.empty,
    pendingCreditValue: data ? formatMoney(data.summary.pendingCredit) : TEXT.empty,
    settledInPeriodValue: data ? formatMoney(data.summary.settledInPeriod) : TEXT.empty,
    settlingGroupKey,
    status,
    statusOptions: STATUS_OPTIONS,

    // handlers
    cancelSettle: useCallback(() => setSettlingGroupKey(null), []),
    confirmSettle: settleMutation.mutate,
    requestSettle: setSettlingGroupKey,
    setStatus,
    settleRow: useCallback(
      (txnId: string) => settleMutation.mutate([txnId]),
      [settleMutation],
    ),
  };
}
