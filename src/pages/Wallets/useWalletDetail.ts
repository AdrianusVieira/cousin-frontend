import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";

import { api } from "@/lib/api/client";
import { formatMoney } from "@/lib/format";
import { formatPeriodLabel, usePeriod } from "@/lib/period";
import type { Wallet, WalletDetailResponse } from "@/types/api";

const TEXT = {
  active: "Active",
  archived: "Archived",
  empty: "â€”",
};

export function useWalletDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { period } = usePeriod();
  const [editOpen, setEditOpen] = useState(false);

  const query = useQuery({
    enabled: !!id,
    queryFn: () =>
      api.get<WalletDetailResponse>(`/wallets/${id}`, {
        query: { from: period.from, to: period.to },
      }),
    queryKey: ["wallet", id, period.from, period.to],
  });

  const editMutation = useMutation({
    mutationFn: (data: { balance?: string; description?: string; name?: string }) =>
      api.patch<Wallet>(`/wallets/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet", id] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setEditOpen(false);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => api.post<void>(`/wallets/${id}/archive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet", id] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
    },
  });

  const unarchiveMutation = useMutation({
    mutationFn: () => api.post<void>(`/wallets/${id}/unarchive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet", id] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
    },
  });

  const data = query.data;
  const wallet = data?.wallet;

  return {
    // data
    balanceSeries: data?.balanceSeries ?? [],
    currentBalanceValue: data ? formatMoney(data.summary.currentBalance) : TEXT.empty,
    editError: editMutation.error,
    editOpen,
    error: query.error,
    id: id!,
    isArchived: wallet?.archived ?? false,
    isLoading: query.isLoading,
    isSubmitting: editMutation.isPending,
    period,
    periodAverage: data?.summary.periodAverage,
    periodAvgValue: data ? formatMoney(data.summary.periodAverage) : TEXT.empty,
    periodLabel: formatPeriodLabel(period),
    statusValue: wallet?.archived ? TEXT.archived : TEXT.active,
    wallet,

    // handlers
    archive: useCallback(() => archiveMutation.mutate(), [archiveMutation]),
    closeEdit: useCallback(() => setEditOpen(false), []),
    openEdit: useCallback(() => setEditOpen(true), []),
    submitEdit: editMutation.mutate,
    unarchive: useCallback(() => unarchiveMutation.mutate(), [unarchiveMutation]),
  };
}
