import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import { api } from "@/lib/api/client";
import { formatMoney, formatMoneyDelta, formatPercent } from "@/lib/format";
import type { Wallet, WalletListResponse } from "@/types/api";

const TEXT = {
  empty: "—",
};

export function useWallets() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);

  const query = useQuery({
    queryFn: () => api.get<WalletListResponse>("/wallets"),
    queryKey: ["wallets"],
  });

  const createMutation = useMutation({
    mutationFn: (data: { description?: string; name: string }) =>
      api.post<Wallet>("/wallets", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      setFormOpen(false);
    },
  });

  const data = query.data;

  const patrimonyNote = data?.summary.patrimonyVs3moAvg
    ? `${formatMoneyDelta(data.summary.patrimonyVs3moAvg.delta)} (${formatPercent(data.summary.patrimonyVs3moAvg.pct)})`
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
    trend: data?.trend ?? [],

    // handlers
    closeForm: useCallback(() => setFormOpen(false), []),
    createWallet: createMutation.mutate,
    openForm: useCallback(() => setFormOpen(true), []),
  };
}
