import { FilterSegment } from "@/components/FilterSegment";
import { PageHead } from "@/components/PageHead";
import { PeriodSelector } from "@/components/PeriodSelector";
import { StatCard } from "@/components/StatCard";

import { CreditGroupCard } from "./CreditGroupCard";
import styles from "./Credit.module.css";
import { useCredit } from "./useCredit";

const LABELS = {
  loading: "Loading…",
  noGroups: "No credit transactions for this period.",
  openStatements: "Open Statements",
  pendingCredit: "Pending Credit",
  settledInPeriod: "Settled in Period",
  title: "Credit",
};

export function Credit() {
  const {
    error,
    groups,
    isLoading,
    isSettling,
    openStatementsValue,
    pendingCreditValue,
    period,
    periodLabel,
    settledInPeriodValue,
    status,
    statusOptions,

    confirmSettle,
    setPeriod,
    setStatus,
    settleRow,
  } = useCredit();

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
            <StatCard accent="credit" label={LABELS.pendingCredit} value={pendingCreditValue} />
            <StatCard accent="net" label={LABELS.openStatements} value={openStatementsValue} />
            <StatCard accent="revenue" label={LABELS.settledInPeriod} value={settledInPeriodValue} />
          </div>

          <div className={styles.filterBar}>
            <FilterSegment
              onChange={setStatus}
              options={statusOptions}
              value={status}
            />
          </div>

          {groups.length === 0 ? (
            <div className={styles.empty}>{LABELS.noGroups}</div>
          ) : (
            <div className={styles.groupList}>
              {groups.map((group) => (
                <CreditGroupCard
                  group={group}
                  isSettling={isSettling}
                  key={`${group.walletId}-${group.term}`}
                  onSettleGroup={confirmSettle}
                  onSettleRow={settleRow}
                />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
