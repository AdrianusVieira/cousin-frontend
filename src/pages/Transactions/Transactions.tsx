import type { Column } from "@/components/DataTable";
import { DataTable } from "@/components/DataTable";
import { FilterSegment } from "@/components/FilterSegment";
import { PageHead } from "@/components/PageHead";
import { PeriodSelector } from "@/components/PeriodSelector";
import { Pill } from "@/components/Pill";
import { StatCard } from "@/components/StatCard";
import { formatMoney } from "@/lib/format";
import type { Transaction } from "@/types/api";

import styles from "./Transactions.module.css";
import { useTransactions } from "./useTransactions";

const LABELS = {
  amount: "Amount",
  category: "Category",
  date: "Date",
  description: "Description",
  fromTo: "From → To",
  loading: "Loading…",
  loadMore: "Load more",
  method: "Method",
  net: "Net",
  noTransactions: "No transactions for this period.",
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
  settled: "Settled",
  unsettled: "Unsettled",
};

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");

  return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

function formatEndpoint(endpoint: { name: string | null }): string {
  return endpoint.name ?? TEXT.external;
}

function formatSignedAmount(txn: Transaction): string {
  const formatted = formatMoney(txn.amount);

  if (txn.sign === "+") return `+${formatted}`;
  if (txn.sign === "-") return `-${formatted}`;

  return formatted;
}

const COLUMNS: Column<Transaction>[] = [
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
      <span
        className={styles.amount}
        data-sign={txn.sign}
      >
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
];

export function Transactions() {
  const {
    error,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    items,
    method,
    methodOptions,
    netValue,
    period,
    periodLabel,
    totalInValue,
    totalOutValue,

    fetchNextPage,
    setMethod,
    setPeriod,
  } = useTransactions();

  return (
    <>
      <PageHead
        actions={<PeriodSelector onChange={setPeriod} value={period} />}
        periodLabel={periodLabel}
        title={LABELS.title}
      />

      {error && <div className={styles.error}>! {error.message}</div>}

      {isLoading ? (
        <div className={styles.loading}>{LABELS.loading}</div>
      ) : (
        <>
          <div className={styles.statGrid}>
            <StatCard accent="revenue" label={LABELS.totalIn} value={totalInValue} />
            <StatCard accent="outcome" label={LABELS.totalOut} value={totalOutValue} />
            <StatCard accent="net" label={LABELS.net} value={netValue} />
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
              columns={COLUMNS}
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
    </>
  );
}
