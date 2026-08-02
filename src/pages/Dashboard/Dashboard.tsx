import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";

import { CashFlowChart } from "./CashFlowChart";
import styles from "./Dashboard.module.css";
import { FlowBar } from "./FlowBar";
import { useDashboard } from "./useDashboard";

const LABELS = {
  income: "Income",
  loading: "Loading…",
  net: "Net Balance",
  outcome: "Outcome",
  savingsRate: "Savings Rate",
  title: "Dashboard",
};

export function Dashboard() {
  const {
    cashFlow,
    error,
    flowScaleMax,
    incomeSegments,
    incomeTotal,
    isLoading,
    netValue,
    outcomeSegments,
    outcomeTotal,
    periodLabel,
    savingsRateValue,
  } = useDashboard();

  return (
    <>
      <PageHead periodLabel={periodLabel} title={LABELS.title} />

      {error && <div className={styles.error}>! {error.message}</div>}

      {isLoading ? (
        <div className={styles.loading}>{LABELS.loading}</div>
      ) : (
        <>
          <div className={styles.statRow}>
            <StatCard accent="net" label={LABELS.net} value={netValue} />
            <StatCard accent="credit" label={LABELS.savingsRate} value={savingsRateValue} />
          </div>

          <div className={styles.flowBars}>
            <FlowBar
              accent="revenue"
              label={LABELS.income}
              scaleMax={flowScaleMax}
              segments={incomeSegments}
              total={incomeTotal}
            />
            <FlowBar
              accent="outcome"
              label={LABELS.outcome}
              scaleMax={flowScaleMax}
              segments={outcomeSegments}
              total={outcomeTotal}
            />
          </div>

          <div className={styles.chartRow}>
            <CashFlowChart data={cashFlow} />
          </div>
        </>
      )}
    </>
  );
}
