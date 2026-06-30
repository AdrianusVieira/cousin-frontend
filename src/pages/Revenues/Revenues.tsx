import type { Column } from "@/components/DataTable";
import { DataTable } from "@/components/DataTable";
import { FilterSegment } from "@/components/FilterSegment";
import { PageHead } from "@/components/PageHead";
import { PeriodSelector } from "@/components/PeriodSelector";
import { Pill } from "@/components/Pill";
import { StatCard } from "@/components/StatCard";
import { formatDate, formatMoney } from "@/lib/format";
import type { Revenue } from "@/types/api";
import { useNavigate } from "react-router-dom";

import form from "@/styles/form.module.css";

import { RevenueForm } from "./RevenueForm";
import styles from "./Revenues.module.css";
import { useRevenues } from "./useRevenues";

const LABELS = {
  flag: "Flag",
  loading: "Loading…",
  name: "Name",
  newRevenue: "New revenue",
  noRevenues: "No revenues for this period.",
  overdue: "Overdue",
  status: "Status",
  term: "Term",
  title: "Revenues",
  totalExpected: "Total Expected",
  totalPending: "Total Pending",
  totalReceived: "Total Received",
  value: "Value",
};

const TEXT = {
  flag: "! flag",
  pending: "Pending",
  received: "Received",
};

const COLUMNS: Column<Revenue>[] = [
  {
    header: LABELS.name,
    key: "name",
    render: (r) => (
      <span>
        {r.name}
        {r.recurrenceId && <span className={styles.recurrenceIcon}> ↻</span>}
      </span>
    ),
  },
  {
    header: LABELS.term,
    key: "term",
    render: (r) => formatDate(r.term),
  },
  {
    header: LABELS.status,
    key: "status",
    render: (r) =>
      r.received
        ? <Pill accent="revenue">{TEXT.received}</Pill>
        : <Pill accent="outcome">{TEXT.pending}</Pill>,
  },
  {
    header: LABELS.flag,
    key: "flag",
    render: (r) =>
      r.flagged ? <Pill accent="credit">{TEXT.flag}</Pill> : null,
  },
  {
    align: "right",
    header: LABELS.value,
    key: "value",
    render: (r) => formatMoney(r.value),
  },
];

export function Revenues() {
  const navigate = useNavigate();

  const {
    error,
    formOpen,
    isLoading,
    isSubmitting,
    items,
    overdueValue,
    period,
    periodLabel,
    sources,
    status,
    statusOptions,
    totalExpectedValue,
    totalPendingValue,
    totalReceivedValue,

    closeForm,
    createError,
    createRevenue,
    openForm,
    setPeriod,
    setStatus,
  } = useRevenues();

  return (
    <>
      <PageHead
        actions={
          <>
            <PeriodSelector onChange={setPeriod} value={period} />
            <button className={form.btnPrimary} onClick={openForm} type="button">
              {LABELS.newRevenue}
            </button>
          </>
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
            <StatCard accent="net" label={LABELS.totalExpected} value={totalExpectedValue} />
            <StatCard accent="revenue" label={LABELS.totalReceived} value={totalReceivedValue} />
            <StatCard accent="outcome" label={LABELS.totalPending} value={totalPendingValue} />
            <StatCard accent="credit" label={LABELS.overdue} value={overdueValue} />
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
              emptyMessage={LABELS.noRevenues}
              keyExtractor={(r) => r.id}
              onRowClick={(r) => navigate(`/revenues/${r.id}`)}
              rows={items}
            />
          </div>
        </>
      )}

      {formOpen && (
        <RevenueForm
          isSubmitting={isSubmitting}
          onClose={closeForm}
          onSubmit={createRevenue}
          serverError={createError}
          sources={sources}
        />
      )}
    </>
  );
}
