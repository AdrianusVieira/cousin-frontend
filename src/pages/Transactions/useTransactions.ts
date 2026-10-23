import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { api } from "@/lib/api/client";
import { formatMoney } from "@/lib/format";
import { invalidateFinanceQueries } from "@/lib/invalidateFinanceQueries";
import { formatPeriodLabel, usePeriod } from "@/lib/period";
import type {
  BillListResponse,
  CategoryListResponse,
  CreateTransaction,
  PatchTransaction,
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
const TEXT = { empty: "—" };

export function useTransactions() {
  const queryClient = useQueryClient();
  const { period } = usePeriod();
  const [params, setParams] = useSearchParams();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [bulkCategoryId, setBulkCategoryId] = useState("");
  const linkedTransactionId = params.get("transaction");
  const linkedTransaction = useQuery({
    enabled: !!linkedTransactionId,
    queryKey: ["transactions", "detail", linkedTransactionId],
    queryFn: () => api.get<Transaction>(`/transactions/${linkedTransactionId}`),
  });
  const closeEdit = () => {
    setEditing(null);
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete("transaction");
        return next;
      },
      { replace: true },
    );
  };
  const method = params.get("method") ?? "all";
  const search = params.get("search") ?? "";
  const category = params.get("category") ?? "";
  const wallet = params.get("wallet") ?? "";
  const filter = { from: period.from, to: period.to, method, search, category, wallet };
  const selectionKey = JSON.stringify(filter);
  const [selection, setSelection] = useState<{ key: string; ids: string[] }>({ key: "", ids: [] });
  const selectedIds = selection.key === selectionKey ? selection.ids : [];
  const setFilter = useCallback(
    (key: string, value: string) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value && value !== "all") next.set(key, value);
          else next.delete(key);
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );
  const query = useInfiniteQuery({
    placeholderData: keepPreviousData,
    queryKey: ["transactions", filter],
    initialPageParam: null as string | null,
    getNextPageParam: (page: TransactionListResponse) => page.nextCursor ?? undefined,
    queryFn: ({ pageParam, signal }) =>
      api.get<TransactionListResponse>("/transactions", {
        signal,
        query: { ...filter, cursor: pageParam },
      }),
  });
  const walletsQuery = useQuery({
    queryKey: ["wallets", "filters"],
    queryFn: () => api.get<WalletListResponse>("/wallets"),
  });
  const categoriesQuery = useQuery({
    queryKey: ["categories", "filters"],
    queryFn: () => api.get<CategoryListResponse>("/categories"),
  });
  const billsQuery = useQuery({
    enabled: formOpen,
    queryKey: ["bills", "active"],
    queryFn: () => api.get<BillListResponse>("/bills", { query: { active: true } }),
  });
  const revenuesQuery = useQuery({
    enabled: formOpen,
    queryKey: ["revenues", "active"],
    queryFn: () => api.get<RevenueListResponse>("/revenues", { query: { active: true } }),
  });
  const createMutation = useMutation({
    mutationFn: (body: CreateTransaction) => api.post<Transaction[]>("/transactions", body),
    onSuccess: async () => {
      await invalidateFinanceQueries(queryClient);
      setFormOpen(false);
    },
  });
  const editMutation = useMutation({
    mutationFn: ({ id, ...body }: PatchTransaction & { id: string }) =>
      api.patch<Transaction>(`/transactions/${id}`, body),
    onSuccess: async () => {
      await invalidateFinanceQueries(queryClient);
      closeEdit();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<void>(`/transactions/${id}`),
    onSuccess: async () => {
      await invalidateFinanceQueries(queryClient);
      setDeleting(null);
    },
  });
  const bulkMutation = useMutation({
    mutationFn: (ids: string[]) =>
      api.patch<{ updated: number }>("/transactions/categories", {
        categoryId: bulkCategoryId,
        transactionIds: ids,
      }),
    onSuccess: async () => {
      setSelection({ key: selectionKey, ids: [] });
      await invalidateFinanceQueries(queryClient);
    },
  });
  const items = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data]);
  const summary = query.data?.pages[0]?.summary;
  const toggleSelected = (id: string) =>
    setSelection({
      key: selectionKey,
      ids: selectedIds.includes(id)
        ? selectedIds.filter((value) => value !== id)
        : [...selectedIds, id].slice(0, 200),
    });
  return {
    bills: billsQuery.data?.items ?? [],
    bulkCategoryId,
    bulkError: bulkMutation.error,
    categories: categoriesQuery.data?.items ?? [],
    category,
    createError: createMutation.error,
    deleteError: deleteMutation.error,
    deleting,
    editError: editMutation.error,
    editing: editing ?? linkedTransaction.data ?? null,
    error: query.error ?? linkedTransaction.error ?? categoriesQuery.error ?? walletsQuery.error,
    formOpen,
    hasNextPage: query.hasNextPage,
    isBulkUpdating: bulkMutation.isPending,
    isDeletingTxn: deleteMutation.isPending,
    isEditingTxn: editMutation.isPending,
    isFetchingNextPage: query.isFetchingNextPage,
    isFiltering: query.isPlaceholderData,
    isLoading: query.isLoading,
    isSubmitting: createMutation.isPending,
    items,
    method,
    methodOptions: METHOD_OPTIONS,
    netValue: summary ? formatMoney(summary.net) : TEXT.empty,
    periodLabel: formatPeriodLabel(period),
    revenues: revenuesQuery.data?.items ?? [],
    search,
    selectedIds,
    totalInValue: summary ? formatMoney(summary.totalIn) : TEXT.empty,
    totalOutValue: summary ? formatMoney(summary.totalOut) : TEXT.empty,
    wallet,
    wallets: walletsQuery.data?.items ?? [],
    applyBulkCategory: () => bulkMutation.mutate(selectedIds),
    cancelDelete: () => setDeleting(null),
    cancelEdit: closeEdit,
    closeForm: () => setFormOpen(false),
    confirmDelete: () => deleting && deleteMutation.mutate(deleting.id),
    createTransaction: createMutation.mutate,
    fetchNextPage: query.fetchNextPage,
    openEditModal: (item: Transaction) => {
      editMutation.reset();
      setEditing(item);
    },
    openForm: () => {
      createMutation.reset();
      setFormOpen(true);
    },
    requestDelete: (item: Transaction) => {
      deleteMutation.reset();
      setDeleting(item);
    },
    setBulkCategoryId,
    setCategory: (value: string) => setFilter("category", value),
    setMethod: (value: string) => setFilter("method", value),
    setSearch: (value: string) => setFilter("search", value),
    setWallet: (value: string) => setFilter("wallet", value),
    submitEdit: (patch: PatchTransaction) => {
      const transaction = editing ?? linkedTransaction.data;
      if (transaction) editMutation.mutate({ id: transaction.id, ...patch });
    },
    toggleAll: () =>
      setSelection({
        key: selectionKey,
        ids: selectedIds.length ? [] : items.slice(0, 200).map((item) => item.id),
      }),
    toggleSelected,
  };
}
