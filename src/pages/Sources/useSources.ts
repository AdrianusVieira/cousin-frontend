import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import { api } from "@/lib/api/client";
import { formatPeriodLabel, usePeriod } from "@/lib/period";
import type { Source, SourceListResponse } from "@/types/api";

export function useSources() {
  const queryClient = useQueryClient();
  const { period } = usePeriod();
  const [formOpen, setFormOpen] = useState(false);

  const query = useQuery({
    queryFn: () =>
      api.get<SourceListResponse>("/sources", {
        query: { from: period.from, to: period.to },
      }),
    queryKey: ["sources", period.from, period.to],
  });

  const createMutation = useMutation({
    mutationFn: (data: { description?: string; name: string }) =>
      api.post<Source>("/sources", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources"] });
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
    periodLabel: formatPeriodLabel(period),

    // handlers
    closeForm: useCallback(() => setFormOpen(false), []),
    createSource: createMutation.mutate,
    openForm: useCallback(() => setFormOpen(true), []),
  };
}
