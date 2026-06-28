import styles from "./StatCard.module.css";

export type StatAccent = "credit" | "net" | "outcome" | "revenue";

interface StatCardProps {
  accent: StatAccent;
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

export function StatCard({ accent, label, note, noteAccent, value }: StatCardProps) {
  return (
    <div className={styles.card} style={{ borderLeftWidth: 2, borderLeftColor: ACCENT_VAR[accent] }}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value} style={{ color: ACCENT_VAR[accent] }}>{value}</div>
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
