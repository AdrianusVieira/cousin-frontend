import { PageHead } from "@/components/PageHead";
import { PeriodSelector } from "@/components/PeriodSelector";
import { StatCard } from "@/components/StatCard";

import { CashFlowChart } from "./CashFlowChart";
import styles from "./Dashboard.module.css";
import { PendingCreditPanel } from "./PendingCreditPanel";
import { useDashboard } from "./useDashboard";

const LABELS = {
  loading: "Loading…",
  net: "Net Balance",
  outcome: "Total Outcome",
  revenue: "Total Revenue",
  savingsRate: "Savings Rate",
  title: "Dashboard",
};

export function Dashboard() {
  const {
    cashFlow,
    error,
    isLoading,
    netNote,
    netValue,
    outcomeValue,
    pendingCreditPerWallet,
    pendingCreditTotal,
    period,
    periodLabel,
    revenueValue,
    savingsRateNote,
    savingsRateValue,
    setPeriod,
  } = useDashboard();

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
            <StatCard accent="revenue" label={LABELS.revenue} value={revenueValue} />
            <StatCard accent="outcome" label={LABELS.outcome} value={outcomeValue} />
            <StatCard accent="net" label={LABELS.net} note={netNote} value={netValue} />
            <StatCard
              accent="credit"
              label={LABELS.savingsRate}
              note={savingsRateNote}
              value={savingsRateValue}
            />
          </div>

          <div className={styles.bottomRow}>
            <CashFlowChart data={cashFlow} />
            <PendingCreditPanel perWallet={pendingCreditPerWallet} total={pendingCreditTotal} />
          </div>
        </>
      )}
    </>
  );
}
