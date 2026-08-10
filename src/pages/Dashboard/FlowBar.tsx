import { InfoHint } from "@/components/InfoHint";
import { formatMoney } from "@/lib/format";
import type { Money } from "@/types/api";

import styles from "./FlowBar.module.css";

export interface FlowSegment {
  label: string;
  value: Money;
}

interface FlowBarProps {
  accent: "revenue" | "outcome";
  info?: string;
  label: string;
  scaleMax: number;
  segments: FlowSegment[];
  total: Money;
}

/**
 * The first segment is money that has already moved. Everything after it is
 * committed but not settled -- pending credit, unpaid bills, unreceived
 * revenues -- and shares one faded shade so the split reads at a glance.
 */
const PENDING_OPACITY = 0.4;
const SETTLED_OPACITY = 0.85;

const segmentOpacity = (index: number) => (index === 0 ? SETTLED_OPACITY : PENDING_OPACITY);

export function FlowBar({ accent, info, label, scaleMax, segments, total }: FlowBarProps) {
  const accentVar = `var(--color-${accent})`;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.labelGroup}>
          <span className={styles.label}>{label}</span>
          {info !== undefined && <InfoHint text={info} />}
        </span>
        <span className={styles.total} style={{ color: accentVar }}>
          {formatMoney(total)}
        </span>
      </div>

      <div className={styles.legend}>
        {segments.map((segment, index) => (
          <span className={styles.legendItem} key={segment.label}>
            <span
              className={styles.swatch}
              style={{ background: accentVar, opacity: segmentOpacity(index) }}
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
              style={{ background: accentVar, opacity: segmentOpacity(index), width: `${pct}%` }}
            />
          );
        })}
      </div>
    </div>
  );
}
