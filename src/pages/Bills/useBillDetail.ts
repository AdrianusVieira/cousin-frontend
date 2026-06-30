import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { api } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import { formatMoney } from "@/lib/format";
import type { Bill, BillDetailResponse } from "@/types/api";

const TEXT = {
  empty: "—",
  linked: "Yes",
  no: "No",
  paid: "Paid",
  unpaid: "Unpaid",
};

export function useBillDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);

  const query = useQuery({
    enabled: !!id,
    queryFn: () => api.get<BillDetailResponse>(`/bills/${id}`),
    queryKey: ["bill", id],
  });

  const editMutation = useMutation({
    mutationFn: (data: Partial<Pick<Bill, "description" | "name" | "paid" | "term" | "value">>) =>
      api.patch<Bill>(`/bills/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bill", id] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["sources"] });
      setEditOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete<void>(`/bills/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      navigate("/bills");
    },
  });

  const data = query.data;
  const bill = data?.bill;
  const deleteError = deleteMutation.error;
  const deleteBlocked = isApiError(deleteError) && deleteError.status === 409;

  return {
    // data
    bill,
    deleteBlocked,
    deleteError,
    editError: editMutation.error,
    editOpen,
    error: query.error,
    instances: data?.instances ?? [],
    isLoading: query.isLoading,
    isSubmitting: editMutation.isPending,
    linkedTxnValue: data?.linkedTransaction ? TEXT.linked : TEXT.no,
    statusValue: bill?.paid ? TEXT.paid : TEXT.unpaid,
    valueFormatted: bill ? formatMoney(bill.value) : TEXT.empty,

    // handlers
    closeEdit: useCallback(() => setEditOpen(false), []),
    deleteBill: useCallback(() => deleteMutation.mutate(), [deleteMutation]),
    openEdit: useCallback(() => setEditOpen(true), []),
    submitEdit: editMutation.mutate,
    togglePaid: useCallback(() => {
      if (bill) editMutation.mutate({ paid: !bill.paid });
    }, [bill, editMutation]),
  };
}
