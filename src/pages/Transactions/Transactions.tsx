import type { Column } from "@/components/DataTable";
import { DataTable } from "@/components/DataTable";
import { FilterSegment } from "@/components/FilterSegment";
import { TransactionEditDialog } from "@/components/TransactionEditDialog";
import { Modal } from "@/components/Modal";
import { PageHead } from "@/components/PageHead";
import { Pill } from "@/components/Pill";
import { StatCard } from "@/components/StatCard";
import { META_ENTITY } from "@/constants/meta";
import { categoryAmount, formatTransactionCategories } from "@/lib/categoryAllocations";
import { formatDate, formatMoney } from "@/lib/format";
import type { Transaction } from "@/types/api";

import form from "@/styles/form.module.css";

import { TransactionExportDialog } from "./TransactionExportDialog";
import { TransactionForm } from "./TransactionForm";
import styles from "./Transactions.module.css";
import { useTransactions } from "./useTransactions";

const LABELS = {
  allCategories: "All categories",
  allWallets: "All wallets",
  applyCategory: "Apply category",
  bulkCategory: "Assign category",
  chooseCategory: "Choose a category",
  search: "Search descriptions",
  select: "Select transaction",
  selectAll: "Select loaded transactions (up to 200)",
  selected: "selected",
  uncategorized: "Uncategorized",
  wallet: "Wallet",
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
  exportReport: "Export report",
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
  bulkHelp:
    "Assigning a category replaces all category allocations on the selected transactions with their full amount.",
  categoryTotals:
    "With a category selected, amounts and totals show only the amount assigned to that category.",
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

function formatSignedAmount(txn: Transaction, category?: string): string {
  const formatted = formatMoney(categoryAmount(txn, category));

  if (txn.sign === "+") return `+${formatted}`;
  if (txn.sign === "-") return `−${formatted}`;

  return formatted;
}

function buildColumns(
  onEdit: (txn: Transaction) => void,
  onDelete: (txn: Transaction) => void,
  selectedIds: string[],
  toggleSelected: (id: string) => void,
  category?: string,
): Column<Transaction>[] {
  return [
    {
      header: "",
      key: "select",
      render: (txn) => (
        <input
          aria-label={`${LABELS.select}: ${txn.description ?? txn.id}`}
          checked={selectedIds.includes(txn.id)}
          onChange={() => toggleSelected(txn.id)}
          type="checkbox"
        />
      ),
    },
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
      render: (txn) => formatTransactionCategories(txn),
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
          {formatSignedAmount(txn, category)}
        </span>
      ),
    },
    {
      header: LABELS.status,
      key: "status",
      render: (txn) => {
        if (txn.method !== "credit") return null;

        return txn.settled ? (
          <Pill accent="revenue">{TEXT.settled}</Pill>
        ) : (
          <Pill accent="outcome">{TEXT.unsettled}</Pill>
        );
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
    bulkCategoryId,
    bulkError,
    categories,
    category,
    createError,
    deleteError,
    deleting,
    editError,
    editing,
    error,
    exportOpen,
    formOpen,
    hasNextPage,
    isBulkUpdating,
    isDeletingTxn,
    isEditingTxn,
    isFetchingNextPage,
    isFiltering,
    isLoading,
    isSubmitting,
    items,
    method,
    methodOptions,
    netValue,
    period,
    periodLabel,
    revenues,
    search,
    selectedIds,
    totalInValue,
    totalOutValue,
    wallet,
    wallets,
    applyBulkCategory,
    cancelDelete,
    cancelEdit,
    closeExport,
    closeForm,
    confirmDelete,
    createTransaction,
    fetchNextPage,
    openEditModal,
    openExport,
    openForm,
    requestDelete,
    setBulkCategoryId,
    setCategory,
    setMethod,
    setSearch,
    setWallet,
    submitEdit,
    toggleAll,
    toggleSelected,
  } = useTransactions();

  return (
    <>
      <PageHead
        actions={
          <>
            <button className={form.btnSecondary} onClick={openExport} type="button">
              {LABELS.exportReport}
            </button>
            {!isLoading && (
              <button className={form.btnPrimary} onClick={openForm} type="button">
                {LABELS.newTransaction}
              </button>
            )}
          </>
        }
        entity={META_ENTITY.Transactions}
        periodLabel={periodLabel}
        title={LABELS.title}
      />

      {exportOpen && <TransactionExportDialog initialPeriod={period} onClose={closeExport} />}

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

          {category && category !== "uncategorized" && <p>{TEXT.categoryTotals}</p>}
          <div className={styles.filterBar}>
            <FilterSegment onChange={setMethod} options={methodOptions} value={method} />
            <input
              aria-label={LABELS.search}
              className={form.input}
              maxLength={200}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={LABELS.search}
              type="search"
              value={search}
            />
            <select
              aria-label={LABELS.category}
              className={form.select}
              onChange={(event) => setCategory(event.target.value)}
              value={category}
            >
              <option value="">{LABELS.allCategories}</option>
              <option value="uncategorized">{LABELS.uncategorized}</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <select
              aria-label={LABELS.wallet}
              className={form.select}
              onChange={(event) => setWallet(event.target.value)}
              value={wallet}
            >
              <option value="">{LABELS.allWallets}</option>
              {wallets.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          {selectedIds.length > 0 && <p>{TEXT.bulkHelp}</p>}
          <div className={styles.bulkBar}>
            <label>
              <input
                aria-label={LABELS.selectAll}
                checked={
                  items.length > 0 &&
                  items.slice(0, 200).every((item) => selectedIds.includes(item.id))
                }
                disabled={isFiltering}
                onChange={toggleAll}
                type="checkbox"
              />{" "}
              {LABELS.selectAll}
            </label>
            <span aria-live="polite">
              {selectedIds.length} {LABELS.selected}
            </span>
            <select
              title={TEXT.bulkHelp}
              aria-label={LABELS.bulkCategory}
              className={form.select}
              onChange={(event) => setBulkCategoryId(event.target.value)}
              value={bulkCategoryId}
            >
              <option value="">{LABELS.chooseCategory}</option>
              {categories
                .filter((item) => !item.archived)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
            </select>
            <button
              className={form.btnSecondary}
              disabled={!selectedIds.length || !bulkCategoryId || isBulkUpdating || isFiltering}
              onClick={applyBulkCategory}
              type="button"
            >
              {LABELS.applyCategory}
            </button>
          </div>
          {bulkError && (
            <p className={styles.error} role="alert">
              {bulkError.message}
            </p>
          )}

          <div aria-busy={isFiltering} className={styles.tableWrap}>
            {isFiltering ? (
              <p role="status">{LABELS.loading}</p>
            ) : (
              <DataTable
                columns={buildColumns(
                  openEditModal,
                  requestDelete,
                  selectedIds,
                  toggleSelected,
                  category,
                )}
                emptyMessage={LABELS.noTransactions}
                keyExtractor={(txn) => txn.id}
                rows={items}
              />
            )}
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
          defaultMethod={method}
          isSubmitting={isSubmitting}
          onClose={closeForm}
          onSubmit={createTransaction}
          revenues={revenues}
          serverError={createError}
          wallets={wallets.filter((item) => !item.archived)}
        />
      )}

      {editing && (
        <TransactionEditDialog
          error={editError}
          isSubmitting={isEditingTxn}
          onClose={cancelEdit}
          onSubmit={submitEdit}
          transaction={editing}
        />
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
          {deleteError && <p role="alert">{deleteError.message}</p>}
        </Modal>
      )}
    </>
  );
}
