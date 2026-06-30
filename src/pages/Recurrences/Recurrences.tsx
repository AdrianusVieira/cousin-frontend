import type { Column } from "@/components/DataTable";
import { DataTable } from "@/components/DataTable";
import { PageHead } from "@/components/PageHead";
import { PeriodSelector } from "@/components/PeriodSelector";
import { Pill } from "@/components/Pill";
import { StatCard } from "@/components/StatCard";
import { formatDate, formatMoney } from "@/lib/format";
import type { RecurrenceListItem } from "@/types/api";
import { useNavigate } from "react-router-dom";

import styles from "./Recurrences.module.css";
import { useRecurrences } from "./useRecurrences";

const LABELS = {
  activeSchedules: "Active Schedules",
  estimatedValue: "Est. Value",
  frequency: "Frequency",
  inactive: "Inactive",
  loading: "Loading…",
  name: "Name",
  nextInstance: "Next Instance",
  noRecurrences: "No recurrences for this period.",
  recurringOutflow: "Recurring Outflow",
  title: "Recurrences",
  type: "Type",
};

const TEXT = {
  bill: "Bill",
  empty: "—",
  revenue: "Revenue",
};

function formatFrequency(item: RecurrenceListItem): string {
  const unit = item.intervalUnit;
  const val = item.intervalValue;

  if (val === 1) return `Every ${unit}`;

  return `Every ${val} ${unit}s`;
}

const COLUMNS: Column<RecurrenceListItem>[] = [
  {
    header: LABELS.name,
    key: "name",
    render: (r) => r.name,
  },
  {
    header: LABELS.type,
    key: "type",
    render: (r) => (
      <Pill accent={r.type === "bill" ? "outcome" : "revenue"}>
        {r.type === "bill" ? TEXT.bill : TEXT.revenue}
      </Pill>
    ),
  },
  {
    header: LABELS.frequency,
    key: "frequency",
    render: (r) => formatFrequency(r),
  },
  {
    header: LABELS.nextInstance,
    key: "nextInstance",
    render: (r) => (r.nextInstance ? formatDate(r.nextInstance) : TEXT.empty),
  },
  {
    align: "right",
    header: LABELS.estimatedValue,
    key: "estimatedValue",
    render: (r) => (r.estimatedValue ? formatMoney(r.estimatedValue) : TEXT.empty),
  },
];

export function Recurrences() {
  const navigate = useNavigate();

  const {
    activeCountValue,
    error,
    inactiveCountValue,
    isLoading,
    items,
    period,
    periodLabel,
    recurringOutflowValue,

    setPeriod,
  } = useRecurrences();

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
            <StatCard accent="outcome" label={LABELS.recurringOutflow} value={recurringOutflowValue} />
            <StatCard accent="revenue" label={LABELS.activeSchedules} value={activeCountValue} />
            <StatCard accent="net" label={LABELS.inactive} value={inactiveCountValue} />
          </div>

          <div className={styles.tableWrap}>
            <DataTable
              columns={COLUMNS}
              emptyMessage={LABELS.noRecurrences}
              keyExtractor={(r) => r.id}
              onRowClick={(r) => navigate(`/recurrences/${r.id}`)}
              rows={items}
            />
          </div>
        </>
      )}
    </>
  );
}
