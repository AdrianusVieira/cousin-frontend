import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

import { invalidateFinanceQueries } from "@/lib/invalidateFinanceQueries";
import { TransactionEditDialog } from "./TransactionEditDialog";
import { api } from "@/lib/api/client";
import { categoryAmount, formatTransactionCategories } from "@/lib/categoryAllocations";
import { formatDate, formatMoney } from "@/lib/format";
import { Pill } from "@/components/Pill";
import type { PatchTransaction, Transaction, TransactionListResponse } from "@/types/api";

import { Modal } from "./Modal";

import form from "@/styles/form.module.css";

import styles from "./TransactionsTable.module.css";

const LABELS = {
  amount: "Amount",
  cancel: "Cancel",
  category: "Category",
  confirmDelete: "Are you sure you want to delete this transaction?",
  date: "Date",
  delete: "Delete",
  deleteTitle: "Delete Transaction",
  description: "Description",
  edit: "Edit",
  editTitle: "Edit Transaction",
  fromTo: "From → To",
  loading: "Loading…",
  loadMore: "Load more",
  method: "Method",
  noTransactions: "No transactions for this period.",
  save: "Save",
  status: "Status",
};

const TEXT = {
  credit: "Credit",
  debit: "Debit",
  empty: "—",
  external: "External",
  settled: "Settled",
  unsettled: "Unsettled",
};

interface TransactionsTableProps {
  from: string;
  to: string;
  category?: string;
  wallet?: string;
}

function formatEndpoint(endpoint: { name: string | null }): string {
  return endpoint.name ?? TEXT.external;
}

function formatSignedAmount(txn: Transaction, category?: string): string {
  const formatted = formatMoney(categoryAmount(txn, category));

  if (txn.sign === "+") return `+${formatted}`;
  if (txn.sign === "-") return `−${formatted}`;

  return formatted;
}

export function TransactionsTable({ category, from, to, wallet }: TransactionsTableProps) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);

  const filterKey = useMemo(() => ({ category, from, to, wallet }), [category, from, to, wallet]);

  const query = useInfiniteQuery({
    getNextPageParam: (lastPage: TransactionListResponse) => lastPage.nextCursor ?? undefined,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      api.get<TransactionListResponse>("/transactions", {
        query: {
          from,
          to,
          ...(wallet ? { wallet } : {}),
          ...(category ? { category } : {}),
          ...(pageParam ? { cursor: pageParam } : {}),
        },
      }),
    queryKey: ["transactions", filterKey],
  });

  const editMutation = useMutation({
    mutationFn: ({ id, ...body }: PatchTransaction & { id: string }) =>
      api.patch<Transaction>(`/transactions/${id}`, body),
    onSuccess: () => {
      void invalidateFinanceQueries(queryClient);
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<void>(`/transactions/${id}`),
    onSuccess: () => {
      void invalidateFinanceQueries(queryClient);
      setDeleting(null);
    },
  });

  const items = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);

  const handleEditSubmit = useCallback(
    (values: import("@/types/api").PatchTransaction) => {
      if (editing) editMutation.mutate({ id: editing.id, ...values });
    },
    [editMutation, editing],
  );

  if (query.isLoading) {
    return <div className={styles.loading}>{LABELS.loading}</div>;
  }

  return (
    <>
      {query.error && <p role="alert">{query.error.message}</p>}
      {items.length === 0 ? (
        <div className={styles.empty}>{LABELS.noTransactions}</div>
      ) : (
        <div className={styles.wrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>{LABELS.date}</th>
                <th className={styles.th}>{LABELS.description}</th>
                <th className={styles.th}>{LABELS.method}</th>
                <th className={styles.th}>{LABELS.category}</th>
                <th className={styles.th}>{LABELS.fromTo}</th>
                <th className={styles.thRight}>{LABELS.amount}</th>
                <th className={styles.th} />
              </tr>
            </thead>
            <tbody>
              {items.map((txn) => (
                <tr className={styles.row} key={txn.id}>
                  <td className={styles.td}>{formatDate(txn.date)}</td>
                  <td className={styles.td}>{txn.description ?? TEXT.empty}</td>
                  <td className={styles.td}>
                    <Pill accent={txn.method === "credit" ? "credit" : "net"}>
                      {txn.method === "credit" ? TEXT.credit : TEXT.debit}
                    </Pill>
                  </td>
                  <td className={styles.td}>{formatTransactionCategories(txn)}</td>
                  <td className={styles.td}>
                    <span className={styles.fromTo}>
                      {formatEndpoint(txn.from)} → {formatEndpoint(txn.to)}
                    </span>
                  </td>
                  <td className={styles.tdRight}>
                    <span className={styles.amount} data-sign={txn.sign}>
                      {formatSignedAmount(txn, category)}
                    </span>
                  </td>
                  <td className={styles.tdAction}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => setEditing(txn)}
                      type="button"
                    >
                      {LABELS.edit}
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => setDeleting(txn)}
                      type="button"
                    >
                      {LABELS.delete}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {query.hasNextPage && (
        <div className={styles.loadMoreWrap}>
          <button
            className={styles.loadMore}
            disabled={query.isFetchingNextPage}
            onClick={() => query.fetchNextPage()}
            type="button"
          >
            {query.isFetchingNextPage ? LABELS.loading : LABELS.loadMore}
          </button>
        </div>
      )}

      {editing && (
        <TransactionEditDialog
          error={editMutation.error}
          isSubmitting={editMutation.isPending}
          onClose={() => setEditing(null)}
          onSubmit={handleEditSubmit}
          transaction={editing}
        />
      )}

      {deleting && (
        <Modal
          footer={
            <>
              <button className={form.btnSecondary} onClick={() => setDeleting(null)} type="button">
                {LABELS.cancel}
              </button>
              <button
                className={form.btnPrimary}
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleting.id)}
                type="button"
              >
                {LABELS.delete}
              </button>
            </>
          }
          onClose={() => setDeleting(null)}
          title={LABELS.deleteTitle}
        >
          <p className={styles.confirmText}>{LABELS.confirmDelete}</p>
          {deleteMutation.error && <p role="alert">{deleteMutation.error.message}</p>}
        </Modal>
      )}
    </>
  );
}
