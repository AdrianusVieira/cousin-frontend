import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import { api } from "@/lib/api/client";
import { formatMoney, formatMoneyDelta, formatPercent } from "@/lib/format";
import { formatPeriodLabel, usePeriod } from "@/lib/period";
import type { Wallet, WalletListResponse } from "@/types/api";

const TEXT = {
  empty: "â€”",
};

export function useWallets() {
  const queryClient = useQueryClient();
  const { period } = usePeriod();
  const [formOpen, setFormOpen] = useState(false);

  const query = useQuery({
    queryFn: () =>
      api.get<WalletListResponse>("/wallets", {
        query: { from: period.from, to: period.to },
      }),
    queryKey: ["wallets", period.from, period.to],
  });

  const createMutation = useMutation({
    mutationFn: (data: { creditEnabled: boolean; description?: string; name: string }) =>
      api.post<Wallet>("/wallets", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      setFormOpen(false);
    },
  });

  const data = query.data;

  const patrimonyNote = data?.summary.patrimonyVsAverage
    ? `${formatMoneyDelta(data.summary.patrimonyVsAverage.delta)} (${formatPercent(data.summary.patrimonyVsAverage.pct)})`
    : undefined;

  return {
    // data
    activeCountValue: data ? String(data.summary.activeCount) : TEXT.empty,
    archivedCountValue: data ? String(data.summary.archivedCount) : TEXT.empty,
    createError: createMutation.error,
    error: query.error,
    formOpen,
    isLoading: query.isLoading,
    isSubmitting: createMutation.isPending,
    items: data?.items ?? [],
    patrimonyNote,
    patrimonyValue: data ? formatMoney(data.summary.totalPatrimony) : TEXT.empty,
    periodLabel: formatPeriodLabel(period),
    trend: data?.trend ?? [],

    // handlers
    closeForm: useCallback(() => setFormOpen(false), []),
    createWallet: createMutation.mutate,
    openForm: useCallback(() => setFormOpen(true), []),
  };
}
