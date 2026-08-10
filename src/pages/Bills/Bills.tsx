import type { Column } from "@/components/DataTable";
import { DataTable } from "@/components/DataTable";
import { FilterSegment } from "@/components/FilterSegment";
import { PageHead } from "@/components/PageHead";
import { Pill } from "@/components/Pill";
import { StatCard } from "@/components/StatCard";
import { formatDate, formatMoney } from "@/lib/format";
import type { Bill } from "@/types/api";
import { useNavigate } from "react-router-dom";

import form from "@/styles/form.module.css";

import { BillForm } from "./BillForm";
import styles from "./Bills.module.css";
import { useBills } from "./useBills";

const LABELS = {
  flag: "Flag",
  loading: "Loading…",
  name: "Name",
  newBill: "New bill",
  noBills: "No bills for this period.",
  overdue: "Overdue",
  status: "Status",
  term: "Term",
  title: "Bills",
  totalBilled: "Total Billed",
  totalPaid: "Total Paid",
  totalUnpaid: "Total Unpaid",
  value: "Value",
};

const TEXT = {
  flag: "! flag",
  overdue:
    "Unpaid bills whose term is already in the past. A subset of Total Unpaid, listed separately " +
    "because these are the ones costing you late fees.",
  paid: "Paid",
  totalBilled:
    "Every bill with a term inside the period, paid or not. It is what the period owes in total, " +
    "regardless of what you have settled so far.",
  totalPaid:
    "Bills in the period you have marked paid. Marking a bill paid is what moves it here — " +
    "recording a transaction against it does not do it on its own.",
  totalUnpaid:
    "Bills in the period still not marked paid, whether or not their term has passed. This is the " +
    "amount the dashboard's Outcome carries as committed but unsettled.",
  unpaid: "Unpaid",
};

const COLUMNS: Column<Bill>[] = [
  {
    header: LABELS.name,
    key: "name",
    render: (b) => (
      <span>
        {b.name}
        {b.recurrenceId && <span className={styles.recurrenceIcon}> ↻</span>}
      </span>
    ),
  },
  {
    header: LABELS.term,
    key: "term",
    render: (b) => formatDate(b.term),
  },
  {
    header: LABELS.status,
    key: "status",
    render: (b) =>
      b.paid
        ? <Pill accent="revenue">{TEXT.paid}</Pill>
        : <Pill accent="outcome">{TEXT.unpaid}</Pill>,
  },
  {
    header: LABELS.flag,
    key: "flag",
    render: (b) =>
      b.flagged ? <Pill accent="credit">{TEXT.flag}</Pill> : null,
  },
  {
    align: "right",
    header: LABELS.value,
    key: "value",
    render: (b) => formatMoney(b.value),
  },
];

export function Bills() {
  const navigate = useNavigate();

  const {
    error,
    formOpen,
    isLoading,
    isSubmitting,
    items,
    overdueValue,
    periodLabel,
    sources,
    status,
    statusOptions,
    totalBilledValue,
    totalPaidValue,
    totalUnpaidValue,

    closeForm,
    createBill,
    createError,
    openForm,
    setStatus,
  } = useBills();

  return (
    <>
      <PageHead
        actions={
          !isLoading && (
            <button className={form.btnPrimary} onClick={openForm} type="button">
              {LABELS.newBill}
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
              accent="net"
              info={TEXT.totalBilled}
              label={LABELS.totalBilled}
              value={totalBilledValue}
            />
            <StatCard
              accent="revenue"
              info={TEXT.totalPaid}
              label={LABELS.totalPaid}
              value={totalPaidValue}
            />
            <StatCard
              accent="outcome"
              info={TEXT.totalUnpaid}
              label={LABELS.totalUnpaid}
              value={totalUnpaidValue}
            />
            <StatCard
              accent="credit"
              info={TEXT.overdue}
              label={LABELS.overdue}
              value={overdueValue}
            />
          </div>

          <div className={styles.filterBar}>
            <FilterSegment
              onChange={setStatus}
              options={statusOptions}
              value={status}
            />
          </div>

          <div className={styles.tableWrap}>
            <DataTable
              columns={COLUMNS}
              emptyMessage={LABELS.noBills}
              keyExtractor={(b) => b.id}
              onRowClick={(b) => navigate(`/bills/${b.id}`)}
              rows={items}
            />
          </div>
        </>
      )}

      {formOpen && (
        <BillForm
          isSubmitting={isSubmitting}
          onClose={closeForm}
          onSubmit={createBill}
          serverError={createError}
          sources={sources}
        />
      )}
    </>
  );
}
