import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { ROUTES } from "@/app/navigation";
import { DataTable } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import { Pill } from "@/components/Pill";
import { api } from "@/lib/api/client";
import { formatDateWithYear, formatMoney, formatPercent } from "@/lib/format";
import { usePeriod } from "@/lib/period";
import type { DashboardDetailsResponse, DashboardMetric } from "@/types/api";
import form from "@/styles/form.module.css";
import styles from "./Dashboard.module.css";

const LABELS = {
  amount: "Amount",
  close: "Close",
  countedOn: "Counted on",
  empty: "No contributions in this period.",
  entry: "Entry",
  loading: "Loading contributions…",
  purchase: "Purchase / movement",
  settled: "Actually settled",
  state: "Status",
};
const TITLES: Record<DashboardMetric, string> = {
  income: "Income details",
  outcome: "Outcome details",
  net: "Net balance details",
  savingsRate: "Savings rate details",
};
const STATES = {
  settled: "Settled",
  pendingCredit: "Pending credit",
  unpaid: "Unpaid bill",
  unreceived: "Unreceived revenue",
};
const TEXT = {
  basis:
    "Counted on is the statement due date for credit, the movement date for debit, or the due date for an obligation. Actual settlement can be on a different date. Transfers and balance adjustments are excluded.",
  flags:
    "Bill paid and revenue received flags are managed separately from linked transactions. An obligation left open can appear alongside its payment; these rows show exactly what the dashboard currently includes.",
  formula:
    "Net = Income − Outcome. Savings rate = Net ÷ Income × 100; shown as 0% when Income is zero.",
  missing: "—",
};
type Contribution = DashboardDetailsResponse["items"][number];
const columns = [
  {
    key: "entry",
    header: LABELS.entry,
    render: (row: Contribution) => (
      <Link
        to={
          row.entity === "bill"
            ? ROUTES.bill(row.id)
            : row.entity === "revenue"
              ? ROUTES.revenue(row.id)
              : `${ROUTES.transactions}?${new URLSearchParams({ transaction: row.id })}`
        }
      >
        {row.label}
      </Link>
    ),
  },
  {
    key: "state",
    header: LABELS.state,
    render: (row: Contribution) => (
      <Pill accent={row.direction === "income" ? "revenue" : "outcome"}>{STATES[row.state]}</Pill>
    ),
  },
  {
    key: "date",
    header: LABELS.countedOn,
    render: (row: Contribution) => formatDateWithYear(row.date),
  },
  {
    key: "purchase",
    header: LABELS.purchase,
    render: (row: Contribution) =>
      row.purchaseDate ? formatDateWithYear(row.purchaseDate) : TEXT.missing,
  },
  {
    key: "settled",
    header: LABELS.settled,
    render: (row: Contribution) =>
      row.settlementDate ? formatDateWithYear(row.settlementDate) : TEXT.missing,
  },
  {
    key: "amount",
    header: LABELS.amount,
    align: "right" as const,
    render: (row: Contribution) =>
      `${row.direction === "income" ? "+" : "−"}${formatMoney(row.amount)}`,
  },
];

export function DashboardDetails({
  metric,
  onClose,
}: {
  metric: DashboardMetric;
  onClose: () => void;
}) {
  const { period } = usePeriod();
  const { data, error, isLoading } = useQuery({
    queryKey: ["dashboard", "details", metric, period],
    queryFn: () =>
      api.get<DashboardDetailsResponse>("/dashboard/details", { query: { ...period, metric } }),
  });
  return (
    <Modal
      wide
      footer={
        <button className={form.btnSecondary} onClick={onClose} type="button">
          {LABELS.close}
        </button>
      }
      onClose={onClose}
      title={TITLES[metric]}
    >
      <div className={styles.details}>
        {isLoading && <p role="status">{LABELS.loading}</p>}
        {error && <p role="alert">{error.message}</p>}
        {data && (
          <>
            <p className={styles.detailTotal}>
              {metric === "savingsRate"
                ? formatPercent(data.savingsRate)
                : formatMoney(data[metric])}
            </p>
            <p>{TEXT.basis}</p>
            {(metric === "net" || metric === "savingsRate") && <p>{TEXT.formula}</p>}
            <DataTable
              columns={columns}
              emptyMessage={LABELS.empty}
              keyExtractor={(row) => `${row.entity}-${row.id}`}
              rows={data.items}
            />
            <p>{TEXT.flags}</p>
          </>
        )}
      </div>
    </Modal>
  );
}
