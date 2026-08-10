import { FilterSegment } from "@/components/FilterSegment";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";

import { CreditGroupCard } from "./CreditGroupCard";
import { CreditHistoryChart } from "./CreditHistoryChart";
import styles from "./Credit.module.css";
import { PendingCreditPanel } from "./PendingCreditPanel";
import { useCredit } from "./useCredit";

const LABELS = {
  loading: "Loading…",
  noGroups: "No credit transactions.",
  openStatements: "Open Statements",
  settledInPeriod: "Total Settled",
  title: "Credit",
};

const TEXT = {
  openStatements:
    "How many statements in the period still have at least one unsettled transaction. A statement " +
    "is one wallet's card bill for one term, so this is the number of card bills you still owe.",
  settledInPeriod:
    "Total of the statements in the period where every transaction is already marked settled — " +
    "card bills you have paid off. Partly settled statements count as open, not here.",
};

export function Credit() {
  const {
    error,
    groups,
    historyPoints,
    historyWallets,
    isLoading,
    isSettling,
    openStatementsValue,
    pendingCreditPerWallet,
    pendingCreditTotal,
    settledInPeriodValue,
    status,
    statusOptions,

    confirmSettle,
    setStatus,
    settleRow,
  } = useCredit();

  return (
    <>
      <PageHead title={LABELS.title} />

      {error && <div className={styles.error}>! {error.message}</div>}

      {isLoading ? (
        <div className={styles.loading}>{LABELS.loading}</div>
      ) : (
        <>
          <div className={styles.statGrid}>
            <PendingCreditPanel perWallet={pendingCreditPerWallet} total={pendingCreditTotal} />
            <StatCard
              accent="net"
              info={TEXT.openStatements}
              label={LABELS.openStatements}
              value={openStatementsValue}
            />
            <StatCard
              accent="revenue"
              info={TEXT.settledInPeriod}
              label={LABELS.settledInPeriod}
              value={settledInPeriodValue}
            />
          </div>

          <div className={styles.chartSection}>
            <CreditHistoryChart points={historyPoints} wallets={historyWallets} />
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
