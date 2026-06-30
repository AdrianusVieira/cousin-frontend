import type { ReactElement } from "react";
import { ResponsiveContainer } from "recharts";

import styles from "./ChartFrame.module.css";

interface ChartFrameProps {
  children: ReactElement;
  fill?: boolean;
  title: string;
}

export function ChartFrame({ children, fill = false, title }: ChartFrameProps) {
  return (
    <div className={fill ? `${styles.card} ${styles.fill}` : styles.card}>
      <div className={styles.label}>{title}</div>

      <div className={styles.chartWrap}>
        <ResponsiveContainer height="100%" width="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
