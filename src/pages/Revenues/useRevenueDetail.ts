import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { api } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import { formatMoney } from "@/lib/format";
import type { Revenue, RevenueDetailResponse } from "@/types/api";

const TEXT = {
  empty: "—",
  linked: "Yes",
  no: "No",
  pending: "Pending",
  received: "Received",
};

export function useRevenueDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);

  const query = useQuery({
    enabled: !!id,
    queryFn: () => api.get<RevenueDetailResponse>(`/revenues/${id}`),
    queryKey: ["revenue", id],
  });

  const editMutation = useMutation({
    mutationFn: (data: Partial<Pick<Revenue, "description" | "name" | "received" | "term" | "value">>) =>
      api.patch<Revenue>(`/revenues/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenue", id] });
      queryClient.invalidateQueries({ queryKey: ["revenues"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["sources"] });
      queryClient.invalidateQueries({ queryKey: ["recurrence"] });
      queryClient.invalidateQueries({ queryKey: ["recurrences"] });
      setEditOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete<void>(`/revenues/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenues"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["recurrence"] });
      queryClient.invalidateQueries({ queryKey: ["recurrences"] });
      navigate("/revenues");
    },
  });

  const data = query.data;
  const revenue = data?.revenue;
  const deleteError = deleteMutation.error;
  const deleteBlocked = isApiError(deleteError) && deleteError.status === 409;

  return {
    // data
    deleteBlocked,
    deleteError,
    editError: editMutation.error,
    editOpen,
    error: query.error,
    isLoading: query.isLoading,
    isSubmitting: editMutation.isPending,
    linkedTxnValue: data?.linkedTransaction ? TEXT.linked : TEXT.no,
    revenue,
    statusValue: revenue?.received ? TEXT.received : TEXT.pending,
    valueFormatted: revenue ? formatMoney(revenue.value) : TEXT.empty,

    // handlers
    closeEdit: useCallback(() => setEditOpen(false), []),
    deleteRevenue: useCallback(() => deleteMutation.mutate(), [deleteMutation]),
    openEdit: useCallback(() => setEditOpen(true), []),
    submitEdit: editMutation.mutate,
    toggleReceived: useCallback(() => {
      if (revenue) editMutation.mutate({ received: !revenue.received });
    }, [editMutation, revenue]),
  };
}
