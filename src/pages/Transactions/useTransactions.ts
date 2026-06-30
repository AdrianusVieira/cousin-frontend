import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { api } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import { formatMoney } from "@/lib/format";
import { formatPeriodLabel, PERIOD_PRESET, usePeriod } from "@/lib/period";
import type {
  BillListResponse,
  CategoryListResponse,
  CreateTransaction,
  RevenueListResponse,
  Transaction,
  TransactionListResponse,
  WalletListResponse,
} from "@/types/api";

const METHOD_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Debit", value: "debit" },
  { label: "Credit", value: "credit" },
] as const;

const TEXT = {
  empty: "—",
};

export function useTransactions() {
  const queryClient = useQueryClient();
  const { period, setPeriod } = usePeriod(PERIOD_PRESET.Last3Months);
  const [searchParams, setSearchParams] = useSearchParams();
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const method = searchParams.get("method") ?? "all";

  const setMethod = useCallback(
    (next: string) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (next === "all") {
          params.delete("method");
        } else {
          params.set("method", next);
        }
        return params;
      }, { replace: true });
    },
    [setSearchParams],
  );

  const query = useInfiniteQuery({
    getNextPageParam: (lastPage: TransactionListResponse) =>
      lastPage.nextCursor ?? undefined,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      api.get<TransactionListResponse>("/transactions", {
        query: {
          from: period.from,
          to: period.to,
          ...(method !== "all" ? { method } : {}),
          ...(pageParam ? { cursor: pageParam } : {}),
        },
      }),
    queryKey: ["transactions", period.from, period.to, method],
  });

  const walletsQuery = useQuery({
    enabled: formOpen,
    queryFn: () => api.get<WalletListResponse>("/wallets", { query: { active: true } }),
    queryKey: ["wallets", "active"],
  });

  const billsQuery = useQuery({
    enabled: formOpen,
    queryFn: () => api.get<BillListResponse>("/bills", { query: { active: true } }),
    queryKey: ["bills", "active"],
  });

  const categoriesQuery = useQuery({
    enabled: formOpen,
    queryFn: () => api.get<CategoryListResponse>("/categories", { query: { active: true } }),
    queryKey: ["categories", "active"],
  });

  const revenuesQuery = useQuery({
    enabled: formOpen,
    queryFn: () => api.get<RevenueListResponse>("/revenues", { query: { active: true } }),
    queryKey: ["revenues", "active"],
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateTransaction) =>
      api.post<Transaction[]>("/transactions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      setFormOpen(false);
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, ...body }: { amount?: string; date?: string; description?: string | null; id: string }) =>
      api.patch<Transaction>(`/transactions/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<void>(`/transactions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      setDeleting(null);
    },
  });

  const summary = query.data?.pages[0]?.summary;
  const items = useMemo(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );

  const createError = createMutation.error;
  const createFieldErrors = isApiError(createError) && createError.status === 422
    ? createError.fields
    : undefined;

  const openEditModal = useCallback((txn: Transaction) => {
    setEditAmount(txn.amount);
    setEditDate(txn.date);
    setEditDescription(txn.description ?? "");
    setEditing(txn);
  }, []);

  const submitEdit = useCallback(() => {
    if (!editing) return;

    const payload: { amount?: string; date?: string; description?: string | null; id: string } = { id: editing.id };
    if (editAmount !== editing.amount) payload.amount = editAmount;
    if (editDate !== editing.date) payload.date = editDate;
    if (editDescription !== (editing.description ?? "")) payload.description = editDescription || null;

    editMutation.mutate(payload);
  }, [editAmount, editDate, editDescription, editing, editMutation]);

  return {
    // data
    bills: billsQuery.data?.items ?? [],
    categories: categoriesQuery.data?.items ?? [],
    createError,
    createFieldErrors,
    deleting,
    editAmount,
    editDate,
    editDescription,
    editing,
    error: query.error,
    formOpen,
    hasNextPage: query.hasNextPage,
    isDeletingTxn: deleteMutation.isPending,
    isEditingTxn: editMutation.isPending,
    isFetchingNextPage: query.isFetchingNextPage,
    isLoading: query.isLoading,
    isSubmitting: createMutation.isPending,
    items,
    method,
    methodOptions: METHOD_OPTIONS,
    netValue: summary ? formatMoney(summary.net) : TEXT.empty,
    period,
    periodLabel: formatPeriodLabel(period),
    revenues: revenuesQuery.data?.items ?? [],
    totalInValue: summary ? formatMoney(summary.totalIn) : TEXT.empty,
    totalOutValue: summary ? formatMoney(summary.totalOut) : TEXT.empty,
    wallets: walletsQuery.data?.items ?? [],

    // handlers
    cancelDelete: useCallback(() => setDeleting(null), []),
    cancelEdit: useCallback(() => setEditing(null), []),
    closeForm: useCallback(() => setFormOpen(false), []),
    confirmDelete: useCallback(() => {
      if (deleting) deleteMutation.mutate(deleting.id);
    }, [deleteMutation, deleting]),
    createTransaction: createMutation.mutate,
    fetchNextPage: query.fetchNextPage,
    openEditModal,
    openForm: useCallback(() => setFormOpen(true), []),
    requestDelete: setDeleting,
    setEditAmount,
    setEditDate,
    setEditDescription,
    setMethod,
    setPeriod,
    submitEdit,
  };
}
