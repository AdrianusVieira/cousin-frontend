import { formatMoney } from "@/lib/format";
import type { Money } from "@/types/api";

import styles from "./FlowBar.module.css";

export interface FlowSegment {
  label: string;
  value: Money;
}

interface FlowBarProps {
  accent: "revenue" | "outcome";
  label: string;
  scaleMax: number;
  segments: FlowSegment[];
  total: Money;
}

const SEGMENT_OPACITIES = [0.85, 0.4];

export function FlowBar({ accent, label, scaleMax, segments, total }: FlowBarProps) {
  const accentVar = `var(--color-${accent})`;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        <span className={styles.total} style={{ color: accentVar }}>
          {formatMoney(total)}
        </span>
      </div>

      <div className={styles.legend}>
        {segments.map((segment, index) => (
          <span className={styles.legendItem} key={segment.label}>
            <span
              className={styles.swatch}
              style={{ background: accentVar, opacity: SEGMENT_OPACITIES[index] }}
            />
            <span className={styles.legendLabel}>{segment.label}</span>
            <span className={styles.legendValue}>{formatMoney(segment.value)}</span>
          </span>
        ))}
      </div>

      <div className={styles.track}>
        {segments.map((segment, index) => {
          const pct = scaleMax > 0 ? (Number(segment.value) / scaleMax) * 100 : 0;

          return (
            <div
              className={styles.fill}
              key={segment.label}
              style={{ background: accentVar, opacity: SEGMENT_OPACITIES[index], width: `${pct}%` }}
            />
          );
        })}
      </div>
    </div>
  );
}
