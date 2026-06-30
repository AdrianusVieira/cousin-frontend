import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";

import { api } from "@/lib/api/client";
import { formatMoney } from "@/lib/format";
import { formatPeriodLabel, PERIOD_PRESET, usePeriod } from "@/lib/period";
import type { Category, CategoryDetailResponse } from "@/types/api";

const TEXT = {
  empty: "—",
};

export function useCategoryDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { period, setPeriod } = usePeriod(PERIOD_PRESET.Last3Months);
  const [editOpen, setEditOpen] = useState(false);

  const query = useQuery({
    enabled: !!id,
    queryFn: () =>
      api.get<CategoryDetailResponse>(`/categories/${id}`, {
        query: { from: period.from, to: period.to },
      }),
    queryKey: ["category", id, period.from, period.to],
  });

  const editMutation = useMutation({
    mutationFn: (data: { description?: string; name?: string }) =>
      api.patch<Category>(`/categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category", id] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setEditOpen(false);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => api.post<void>(`/categories/${id}/archive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category", id] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const unarchiveMutation = useMutation({
    mutationFn: () => api.post<void>(`/categories/${id}/unarchive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category", id] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const data = query.data;
  const category = data?.category;

  return {
    // data
    breakdown: data?.breakdown ?? [],
    category,
    editError: editMutation.error,
    editOpen,
    error: query.error,
    id: id!,
    isArchived: category?.archived ?? false,
    isLoading: query.isLoading,
    isSubmitting: editMutation.isPending,
    period,
    periodLabel: formatPeriodLabel(period),
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
