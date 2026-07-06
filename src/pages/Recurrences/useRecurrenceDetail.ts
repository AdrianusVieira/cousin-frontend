import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { api } from "@/lib/api/client";
import { formatMoney } from "@/lib/format";
import { monthsBefore, type Period } from "@/lib/period";
import type { Recurrence, RecurrenceDetailResponse } from "@/types/api";

const CHART_TRAILING_MONTHS = 12;

const TEXT = {
  bill: "Bill",
  empty: "â€”",
  revenue: "Revenue",
};

export function useRecurrenceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [chartRangeOverride, setChartRangeOverride] = useState<Period | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const query = useQuery({
    enabled: !!id,
    queryFn: () => api.get<RecurrenceDetailResponse>(`/recurrences/${id}`),
    queryKey: ["recurrence", id],
  });

  const editMutation = useMutation({
    mutationFn: (data: Partial<Pick<Recurrence, "intervalUnit" | "intervalValue" | "isVariable" | "recurrentDay" | "recurrentMonth">>) =>
      api.patch<Recurrence>(`/recurrences/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurrence", id] });
      queryClient.invalidateQueries({ queryKey: ["recurrences"] });
      setEditOpen(false);
    },
  });

  const recomputeMutation = useMutation({
    mutationFn: () => api.post<void>(`/recurrences/${id}/recompute-estimate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurrence", id] });
      queryClient.invalidateQueries({ queryKey: ["recurrences"] });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: () => api.post<void>(`/recurrences/${id}/deactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurrence", id] });
      queryClient.invalidateQueries({ queryKey: ["recurrences"] });
      navigate("/recurrences");
    },
  });

  const data = query.data;
  const recurrence = data?.recurrence;

  const todayISO = new Date().toISOString().slice(0, 10);
  const allVariance = data?.variance ?? [];
  const currentTerm = allVariance
    .map((entry) => entry.date)
    .filter((date) => date >= todayISO)
    .sort()[0];

  const defaultChartTo = currentTerm ?? todayISO;
  const defaultChartFrom = monthsBefore(defaultChartTo, CHART_TRAILING_MONTHS);
  const chartFrom = chartRangeOverride?.from ?? defaultChartFrom;
  const chartTo = chartRangeOverride?.to ?? defaultChartTo;
  const variance = allVariance.filter((entry) => entry.date >= chartFrom && entry.date <= chartTo);

  const instances = [...(data?.instances ?? [])].sort((a, b) => b.term.localeCompare(a.term));

  return {
    // data
    chartFrom,
    chartTo,
    editError: editMutation.error,
    editOpen,
    error: query.error,
    estimatedValueFormatted: recurrence?.estimatedValue
      ? formatMoney(recurrence.estimatedValue)
      : TEXT.empty,
    instances,
    // isFetching (not isLoading) so a post-mutation refetch blocks the view,
    // preventing a stale value from flashing before the BE confirms the edit.
    isLoading: query.isFetching,
    isRecomputing: recomputeMutation.isPending,
    isSubmitting: editMutation.isPending,
    name: data?.name ?? "",
    recurrence,
    type: data?.type ?? "bill",
    typeLabel: data?.type === "revenue" ? TEXT.revenue : TEXT.bill,
    variance,

    // handlers
    closeEdit: useCallback(() => setEditOpen(false), []),
    deactivate: useCallback(() => deactivateMutation.mutate(), [deactivateMutation]),
    openEdit: useCallback(() => setEditOpen(true), []),
    recompute: useCallback(() => recomputeMutation.mutate(), [recomputeMutation]),
    setChartFrom: useCallback(
      (from: string) => setChartRangeOverride({ from, to: chartTo }),
      [chartTo],
    ),
    setChartTo: useCallback(
      (to: string) => setChartRangeOverride({ from: chartFrom, to }),
      [chartFrom],
    ),
    submitEdit: editMutation.mutate,
  };
}
