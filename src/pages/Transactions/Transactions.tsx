import type { Column } from "@/components/DataTable";
import { DataTable } from "@/components/DataTable";
import { FilterSegment } from "@/components/FilterSegment";
import { FormField } from "@/components/FormField";
import { Modal } from "@/components/Modal";
import { PageHead } from "@/components/PageHead";
import { Pill } from "@/components/Pill";
import { StatCard } from "@/components/StatCard";
import { formatDate, formatMoney } from "@/lib/format";
import type { Transaction } from "@/types/api";

import form from "@/styles/form.module.css";

import { TransactionForm } from "./TransactionForm";
import styles from "./Transactions.module.css";
import { useTransactions } from "./useTransactions";

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
  net: "Net",
  newTransaction: "New transaction",
  noTransactions: "No transactions for this period.",
  save: "Save",
  status: "Status",
  title: "Transactions",
  totalIn: "Total In",
  totalOut: "Total Out",
};

const TEXT = {
  credit: "Credit",
  debit: "Debit",
  empty: "—",
  external: "External",
  net:
    "Total In minus Total Out for the rows currently listed. Internal transfers between your own " +
    "wallets cancel out, so they do not move this figure.",
  settled: "Settled",
  totalIn:
    "Everything arriving in a wallet across the listed transactions — money in and realized " +
    "revenues — counted on the purchase date and honouring the filters above.",
  totalOut:
    "Everything leaving a wallet across the listed transactions — money out and bill payments — " +
    "counted on the purchase date, so a parcelled credit purchase shows in full on the day you " +
    "bought it. The dashboard's Outcome spreads it across statement dates instead.",
  unsettled: "Unsettled",
};

function formatEndpoint(endpoint: { name: string | null }): string {
  return endpoint.name ?? TEXT.external;
}

function formatSignedAmount(txn: Transaction): string {
  const formatted = formatMoney(txn.amount);

  if (txn.sign === "+") return `+${formatted}`;
  if (txn.sign === "-") return `−${formatted}`;

  return formatted;
}

function buildColumns(
  onEdit: (txn: Transaction) => void,
  onDelete: (txn: Transaction) => void,
): Column<Transaction>[] {
  return [
    {
      header: LABELS.date,
      key: "date",
      render: (txn) => formatDate(txn.date),
    },
    {
      header: LABELS.description,
      key: "description",
      render: (txn) => txn.description ?? TEXT.empty,
    },
    {
      header: LABELS.method,
      key: "method",
      render: (txn) => (
        <Pill accent={txn.method === "credit" ? "credit" : "net"}>
          {txn.method === "credit" ? TEXT.credit : TEXT.debit}
        </Pill>
      ),
    },
    {
      header: LABELS.category,
      key: "category",
      render: (txn) => txn.category?.name ?? TEXT.empty,
    },
    {
      header: LABELS.fromTo,
      key: "fromTo",
      render: (txn) => (
        <span className={styles.fromTo}>
          {formatEndpoint(txn.from)} → {formatEndpoint(txn.to)}
        </span>
      ),
    },
    {
      align: "right",
      header: LABELS.amount,
      key: "amount",
      render: (txn) => (
        <span className={styles.amount} data-sign={txn.sign}>
          {formatSignedAmount(txn)}
        </span>
      ),
    },
    {
      header: LABELS.status,
      key: "status",
      render: (txn) => {
        if (txn.method !== "credit") return null;

        return txn.settled
          ? <Pill accent="revenue">{TEXT.settled}</Pill>
          : <Pill accent="outcome">{TEXT.unsettled}</Pill>;
      },
    },
    {
      header: "",
      key: "actions",
      render: (txn) => (
        <span className={styles.actions}>
          <button className={styles.actionBtn} onClick={() => onEdit(txn)} type="button">
            {LABELS.edit}
          </button>
          <button className={styles.actionBtn} onClick={() => onDelete(txn)} type="button">
            {LABELS.delete}
          </button>
        </span>
      ),
    },
  ];
}

export function Transactions() {
  const {
    bills,
    categories,
    createError,
    deleting,
    editAmount,
    editDate,
    editDescription,
    editing,
    error,
    formOpen,
    hasNextPage,
    isDeletingTxn,
    isEditingTxn,
    isFetchingNextPage,
    isLoading,
    isSubmitting,
    items,
    method,
    methodOptions,
    netValue,
    periodLabel,
    revenues,
    totalInValue,
    totalOutValue,
    wallets,

    cancelDelete,
    cancelEdit,
    closeForm,
    confirmDelete,
    createTransaction,
    fetchNextPage,
    openEditModal,
    openForm,
    requestDelete,
    setEditAmount,
    setEditDate,
    setEditDescription,
    setMethod,
    submitEdit,
  } = useTransactions();

  return (
    <>
      <PageHead
        actions={
          !isLoading && (
            <button className={form.btnPrimary} onClick={openForm} type="button">
              {LABELS.newTransaction}
            </button>
          )
        }
        periodLabel={periodLabel}
        title={LABELS.title}
      />

      {error && <div className={styles.error}>! {error.message}</div>}

      {isLoading ? (
        <div className={styles.loading}>{LABELS.loading}</div>
      ) : (
        <>
          <div className={styles.statGrid}>
            <StatCard
              accent="revenue"
              info={TEXT.totalIn}
              label={LABELS.totalIn}
              value={totalInValue}
            />
            <StatCard
              accent="outcome"
              info={TEXT.totalOut}
              label={LABELS.totalOut}
              value={totalOutValue}
            />
            <StatCard accent="net" info={TEXT.net} label={LABELS.net} value={netValue} />
          </div>

          <div className={styles.filterBar}>
            <FilterSegment
              onChange={setMethod}
              options={methodOptions}
              value={method}
            />
          </div>

          <div className={styles.tableWrap}>
            <DataTable
              columns={buildColumns(openEditModal, requestDelete)}
              emptyMessage={LABELS.noTransactions}
              keyExtractor={(txn) => txn.id}
              rows={items}
            />
          </div>

          {hasNextPage && (
            <div className={styles.loadMoreWrap}>
              <button
                className={styles.loadMore}
                disabled={isFetchingNextPage}
                onClick={() => fetchNextPage()}
                type="button"
              >
                {isFetchingNextPage ? LABELS.loading : LABELS.loadMore}
              </button>
            </div>
          )}
        </>
      )}

      {formOpen && (
        <TransactionForm
          bills={bills}
          categories={categories}
          isSubmitting={isSubmitting}
          onClose={closeForm}
          onSubmit={createTransaction}
          revenues={revenues}
          serverError={createError}
          wallets={wallets}
        />
      )}

      {editing && (
        <Modal
          footer={
            <>
              <button className={form.btnSecondary} onClick={cancelEdit} type="button">
                {LABELS.cancel}
              </button>
              <button
                className={form.btnPrimary}
                disabled={isEditingTxn}
                onClick={submitEdit}
                type="button"
              >
                {LABELS.save}
              </button>
            </>
          }
          onClose={cancelEdit}
          title={LABELS.editTitle}
        >
          <div className={styles.editForm}>
            <FormField label={LABELS.amount}>
              <input
                className={form.input}
                inputMode="decimal"
                onChange={(e) => setEditAmount(e.target.value)}
                step="0.01"
                type="number"
                value={editAmount}
              />
            </FormField>
            <FormField label={LABELS.date}>
              <input
                className={form.input}
                onChange={(e) => setEditDate(e.target.value)}
                type="date"
                value={editDate}
              />
            </FormField>
            <FormField label={LABELS.description}>
              <input
                className={form.input}
                onChange={(e) => setEditDescription(e.target.value)}
                type="text"
                value={editDescription}
              />
            </FormField>
          </div>
        </Modal>
      )}

      {deleting && (
        <Modal
          footer={
            <>
              <button className={form.btnSecondary} onClick={cancelDelete} type="button">
                {LABELS.cancel}
              </button>
              <button
                className={form.btnPrimary}
                disabled={isDeletingTxn}
                onClick={confirmDelete}
                type="button"
              >
                {LABELS.delete}
              </button>
            </>
          }
          onClose={cancelDelete}
          title={LABELS.deleteTitle}
        >
          <p className={styles.confirmText}>{LABELS.confirmDelete}</p>
        </Modal>
      )}
    </>
  );
}
