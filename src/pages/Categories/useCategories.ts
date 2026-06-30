import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import { api } from "@/lib/api/client";
import { formatPeriodLabel, PERIOD_PRESET, usePeriod } from "@/lib/period";
import type { Category, CategoryListResponse } from "@/types/api";

export function useCategories() {
  const queryClient = useQueryClient();
  const { period, setPeriod } = usePeriod(PERIOD_PRESET.Last3Months);
  const [formOpen, setFormOpen] = useState(false);

  const query = useQuery({
    queryFn: () =>
      api.get<CategoryListResponse>("/categories", {
        query: { from: period.from, to: period.to },
      }),
    queryKey: ["categories", period.from, period.to],
  });

  const createMutation = useMutation({
    mutationFn: (data: { description?: string; name: string }) =>
      api.post<Category>("/categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setFormOpen(false);
    },
  });

  return {
    // data
    createError: createMutation.error,
    error: query.error,
    formOpen,
    isLoading: query.isLoading,
    isSubmitting: createMutation.isPending,
    items: query.data?.items ?? [],
    period,
    periodLabel: formatPeriodLabel(period),

    // handlers
    closeForm: useCallback(() => setFormOpen(false), []),
    createCategory: createMutation.mutate,
    openForm: useCallback(() => setFormOpen(true), []),
    setPeriod,
  };
}
