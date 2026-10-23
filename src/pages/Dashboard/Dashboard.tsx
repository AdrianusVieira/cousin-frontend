import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";

import { DashboardDetails } from "./DashboardDetails";
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
    detailMetric,
    closeDetails,
    inspectIncome,
    inspectOutcome,
    inspectNet,
    inspectSavingsRate,
    cashFlow,
    error,
    flowScaleMax,
    incomeInfo,
    incomeSegments,
    incomeTotal,
    isLoading,
    netInfo,
    netValue,
    outcomeInfo,
    outcomeSegments,
    outcomeTotal,
    periodLabel,
    savingsRateInfo,
    savingsRateValue,
  } = useDashboard();

  return (
    <>
      <PageHead periodLabel={periodLabel} title={LABELS.title} />

      {detailMetric && <DashboardDetails metric={detailMetric} onClose={closeDetails} />}
      {error && <div className={styles.error}>! {error.message}</div>}

      {isLoading ? (
        <div className={styles.loading}>{LABELS.loading}</div>
      ) : (
        <>
          <div className={styles.statRow}>
            <StatCard
              accent="net"
              onInspect={inspectNet}
              info={netInfo}
              label={LABELS.net}
              value={netValue}
            />
            <StatCard
              onInspect={inspectSavingsRate}
              accent="credit"
              info={savingsRateInfo}
              label={LABELS.savingsRate}
              value={savingsRateValue}
            />
          </div>

          <div className={styles.flowBars}>
            <FlowBar
              onInspect={inspectIncome}
              accent="revenue"
              info={incomeInfo}
              label={LABELS.income}
              scaleMax={flowScaleMax}
              segments={incomeSegments}
              total={incomeTotal}
            />
            <FlowBar
              onInspect={inspectOutcome}
              accent="outcome"
              info={outcomeInfo}
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
