import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";

import { api } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import { formatMoney } from "@/lib/format";
import { formatPeriodLabel, PERIOD_PRESET, usePeriod } from "@/lib/period";
import type { Source, SourceDetailResponse } from "@/types/api";

const TEXT = {
  empty: "—",
};

export function useSourceDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { period, setPeriod } = usePeriod(PERIOD_PRESET.Last3Months);
  const [editOpen, setEditOpen] = useState(false);

  const query = useQuery({
    enabled: !!id,
    queryFn: () =>
      api.get<SourceDetailResponse>(`/sources/${id}`, {
        query: { from: period.from, to: period.to },
      }),
    queryKey: ["source", id, period.from, period.to],
  });

  const editMutation = useMutation({
    mutationFn: (data: { description?: string; name?: string }) =>
      api.patch<Source>(`/sources/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["source", id] });
      queryClient.invalidateQueries({ queryKey: ["sources"] });
      setEditOpen(false);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => api.post<void>(`/sources/${id}/archive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["source", id] });
      queryClient.invalidateQueries({ queryKey: ["sources"] });
    },
  });

  const unarchiveMutation = useMutation({
    mutationFn: () => api.post<void>(`/sources/${id}/unarchive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["source", id] });
      queryClient.invalidateQueries({ queryKey: ["sources"] });
    },
  });

  const data = query.data;
  const source = data?.source;
  const archiveError = archiveMutation.error;
  const archiveBlocked = isApiError(archiveError) && archiveError.status === 409;

  return {
    // data
    archiveBlocked,
    bills: data?.bills ?? [],
    editError: editMutation.error,
    editOpen,
    error: query.error,
    isLoading: query.isLoading,
    isSubmitting: editMutation.isPending,
    period,
    periodLabel: formatPeriodLabel(period),
    revenues: data?.revenues ?? [],
    source,
    totalIncomeValue: data ? formatMoney(data.summary.totalIncome) : TEXT.empty,
    totalOutcomeValue: data ? formatMoney(data.summary.totalOutcome) : TEXT.empty,

    // handlers
    archive: useCallback(() => archiveMutation.mutate(), [archiveMutation]),
    closeEdit: useCallback(() => setEditOpen(false), []),
    openEdit: useCallback(() => setEditOpen(true), []),
    setPeriod,
    submitEdit: editMutation.mutate,
    unarchive: useCallback(() => unarchiveMutation.mutate(), [unarchiveMutation]),
  };
}
