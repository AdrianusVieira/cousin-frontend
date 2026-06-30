import { Pill } from "@/components/Pill";
import { formatDate, formatMoney } from "@/lib/format";
import type { CreditResponse } from "@/types/api";

import form from "@/styles/form.module.css";

import styles from "./CreditGroupCard.module.css";

type CreditGroup = CreditResponse["groups"][number];

const LABELS = {
  amount: "Amount",
  date: "Date",
  description: "Description",
  settle: "Settle",
  settleGroup: "Settle group",
  settled: "Settled",
};

const TEXT = {
  empty: "—",
};

function formatTerm(iso: string): string {
  const d = new Date(iso + "T00:00:00");

  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

interface CreditGroupCardProps {
  group: CreditGroup;
  isSettling: boolean;
  onSettleGroup: (transactionIds: string[]) => void;
  onSettleRow: (txnId: string) => void;
}

export function CreditGroupCard({
  group,
  isSettling,
  onSettleGroup,
  onSettleRow,
}: CreditGroupCardProps) {
  const unsettledIds = group.transactions
    .filter((t) => !t.settled)
    .map((t) => t.id);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.walletName}>{group.walletName}</span>
          <span className={styles.term}>{formatTerm(group.term)}</span>
        </div>

        <div className={styles.headerRight}>
          <span className={styles.total}>{formatMoney(group.total)}</span>
          {group.settled ? (
            <Pill accent="revenue">{LABELS.settled}</Pill>
          ) : (
            <button
              className={form.btnPrimary}
              disabled={isSettling}
              onClick={() => onSettleGroup(unsettledIds)}
              type="button"
            >
              {LABELS.settleGroup}
            </button>
          )}
        </div>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>{LABELS.date}</th>
            <th className={styles.th}>{LABELS.description}</th>
            <th className={styles.thRight}>{LABELS.amount}</th>
            <th className={styles.th} />
          </tr>
        </thead>

        <tbody>
          {group.transactions.map((txn) => (
            <tr className={styles.row} key={txn.id}>
              <td className={styles.td}>{formatDate(txn.date)}</td>
              <td className={styles.td}>{txn.description ?? TEXT.empty}</td>
              <td className={styles.tdRight}>{formatMoney(txn.amount)}</td>
              <td className={styles.tdAction}>
                {txn.settled ? (
                  <Pill accent="revenue">{LABELS.settled}</Pill>
                ) : (
                  <button
                    className={styles.settleBtn}
                    disabled={isSettling}
                    onClick={() => onSettleRow(txn.id)}
                    type="button"
                  >
                    {LABELS.settle}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
