import { InfoHint } from "@/components/InfoHint";

import styles from "./StatCard.module.css";

export type StatAccent = "credit" | "net" | "outcome" | "revenue";

const LABELS = { details: "View details" };

interface StatCardProps {
  onInspect?: () => void;
  accent: StatAccent;
  info?: string;
  label: string;
  note?: string;
  noteAccent?: StatAccent;
  value: string;
}

const ACCENT_VAR: Record<StatAccent, string> = {
  credit: "var(--color-credit)",
  net: "var(--color-net)",
  outcome: "var(--color-outcome)",
  revenue: "var(--color-revenue)",
};

export function StatCard({
  accent,
  info,
  label,
  note,
  noteAccent,
  onInspect,
  value,
}: StatCardProps) {
  return (
    <div
      className={styles.card}
      style={{ borderLeftWidth: 2, borderLeftColor: ACCENT_VAR[accent] }}
    >
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        {info !== undefined && <InfoHint text={info} />}
      </div>
      <div className={styles.value} style={{ color: ACCENT_VAR[accent] }}>
        {value}
      </div>
      {onInspect && (
        <button className={styles.inspect} onClick={onInspect} type="button">
          {LABELS.details}
        </button>
      )}
      {note && (
        <div
          className={styles.note}
          style={noteAccent ? { color: ACCENT_VAR[noteAccent] } : undefined}
        >
          {note}
        </div>
      )}
    </div>
  );
}
