import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

import { api } from "@/lib/api/client";
import { formatDate, formatMoney } from "@/lib/format";
import { Pill } from "@/components/Pill";
import type { Transaction, TransactionListResponse } from "@/types/api";

import { Modal } from "./Modal";
import { FormField } from "./FormField";

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

function formatSignedAmount(txn: Transaction): string {
  const formatted = formatMoney(txn.amount);

  if (txn.sign === "+") return `+${formatted}`;
  if (txn.sign === "-") return `−${formatted}`;

  return formatted;
}

export function TransactionsTable({ category, from, to, wallet }: TransactionsTableProps) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);

  const filterKey = useMemo(
    () => ({ category, from, to, wallet }),
    [category, from, to, wallet],
  );

  const query = useInfiniteQuery({
    getNextPageParam: (lastPage: TransactionListResponse) =>
      lastPage.nextCursor ?? undefined,
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
    mutationFn: ({ id, ...body }: { amount?: string; categoryId?: string | null; date?: string; description?: string | null; id: string }) =>
      api.patch<Transaction>(`/transactions/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<void>(`/transactions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setDeleting(null);
    },
  });

  const items = useMemo(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );

  const handleEditSubmit = useCallback(
    (values: { amount: string; date: string; description: string }) => {
      if (!editing) return;

      const payload: Record<string, string | null> = { id: editing.id };
      if (values.amount !== editing.amount) payload.amount = values.amount;
      if (values.date !== editing.date) payload.date = values.date;
      if (values.description !== (editing.description ?? ""))
        payload.description = values.description || null;

      editMutation.mutate(payload as Parameters<typeof editMutation.mutate>[0]);
    },
    [editMutation, editing],
  );

  if (query.isLoading) {
    return <div className={styles.loading}>{LABELS.loading}</div>;
  }

  return (
    <>
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
                  <td className={styles.td}>
                    <span className={styles.fromTo}>
                      {formatEndpoint(txn.from)} → {formatEndpoint(txn.to)}
                    </span>
                  </td>
                  <td className={styles.tdRight}>
                    <span className={styles.amount} data-sign={txn.sign}>
                      {formatSignedAmount(txn)}
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
        <EditModal
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
        </Modal>
      )}
    </>
  );
}

function EditModal({
  isSubmitting,
  onClose,
  onSubmit,
  transaction,
}: {
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: { amount: string; date: string; description: string }) => void;
  transaction: Transaction;
}) {
  const [amount, setAmount] = useState(transaction.amount);
  const [date, setDate] = useState(transaction.date);
  const [description, setDescription] = useState(transaction.description ?? "");

  return (
    <Modal
      footer={
        <>
          <button className={form.btnSecondary} onClick={onClose} type="button">
            {LABELS.cancel}
          </button>
          <button
            className={form.btnPrimary}
            disabled={isSubmitting}
            onClick={() => onSubmit({ amount, date, description })}
            type="button"
          >
            {LABELS.save}
          </button>
        </>
      }
      onClose={onClose}
      title={LABELS.editTitle}
    >
      <div className={styles.editForm}>
        <FormField label={LABELS.amount}>
          <input
            className={form.input}
            inputMode="decimal"
            onChange={(e) => setAmount(e.target.value)}
            step="0.01"
            type="number"
            value={amount}
          />
        </FormField>
        <FormField label={LABELS.date}>
          <input
            className={form.input}
            onChange={(e) => setDate(e.target.value)}
            type="date"
            value={date}
          />
        </FormField>
        <FormField label={LABELS.description}>
          <input
            className={form.input}
            onChange={(e) => setDescription(e.target.value)}
            type="text"
            value={description}
          />
        </FormField>
      </div>
    </Modal>
  );
}
