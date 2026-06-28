import type { StatAccent } from "./StatCard";

import styles from "./Pill.module.css";

interface PillProps {
  accent: StatAccent;
  children: string;
}

export function Pill({ accent, children }: PillProps) {
  return (
    <span className={`${styles.pill} ${styles[accent]}`}>
      {children}
    </span>
  );
}
