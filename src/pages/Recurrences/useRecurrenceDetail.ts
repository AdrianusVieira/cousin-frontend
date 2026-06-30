import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { api } from "@/lib/api/client";
import { formatMoney } from "@/lib/format";
import type { Recurrence, RecurrenceDetailResponse } from "@/types/api";

const TEXT = {
  bill: "Bill",
  empty: "—",
  revenue: "Revenue",
};

export function useRecurrenceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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

  return {
    // data
    editError: editMutation.error,
    editOpen,
    error: query.error,
    estimatedValueFormatted: recurrence?.estimatedValue
      ? formatMoney(recurrence.estimatedValue)
      : TEXT.empty,
    instances: data?.instances ?? [],
    isLoading: query.isLoading,
    isSubmitting: editMutation.isPending,
    name: data?.name ?? "",
    recurrence,
    type: data?.type ?? "bill",
    typeLabel: data?.type === "revenue" ? TEXT.revenue : TEXT.bill,
    variance: data?.variance ?? [],

    // handlers
    closeEdit: useCallback(() => setEditOpen(false), []),
    deactivate: useCallback(() => deactivateMutation.mutate(), [deactivateMutation]),
    openEdit: useCallback(() => setEditOpen(true), []),
    submitEdit: editMutation.mutate,
  };
}
