import { formatMoney } from "@/lib/format";
import type { Money, UUID } from "@/types/api";

import styles from "./PendingCreditPanel.module.css";

interface WalletCredit {
  total: Money;
  walletId: UUID;
  walletName: string;
}

interface PendingCreditPanelProps {
  perWallet: WalletCredit[];
  total: Money;
}

const LABELS = {
  title: "Pending Credit",
};

export function PendingCreditPanel({ perWallet, total }: PendingCreditPanelProps) {
  const totalNum = Number(total);

  return (
    <div className={styles.card}>
      <div className={styles.label}>{LABELS.title}</div>
      <div className={styles.total}>{formatMoney(total)}</div>

      {perWallet.length > 0 && (
        <div className={styles.wallets}>
          {perWallet.map((w) => {
            const pct = totalNum > 0 ? (Number(w.total) / totalNum) * 100 : 0;

            return (
              <div className={styles.walletRow} key={w.walletId}>
                <div className={styles.walletHeader}>
                  <span className={styles.walletName}>{w.walletName}</span>
                  <span className={styles.walletTotal}>{formatMoney(w.total)}</span>
                </div>

                <div className={styles.progressTrack}>
                  <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
