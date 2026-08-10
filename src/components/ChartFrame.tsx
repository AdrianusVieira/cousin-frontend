import type { ReactElement } from "react";
import { ResponsiveContainer } from "recharts";

import { InfoHint } from "@/components/InfoHint";

import styles from "./ChartFrame.module.css";

interface ChartFrameProps {
  children: ReactElement;
  fill?: boolean;
  info?: string;
  title: string;
}

export function ChartFrame({ children, fill = false, info, title }: ChartFrameProps) {
  return (
    <div className={fill ? `${styles.card} ${styles.fill}` : styles.card}>
      <div className={styles.header}>
        <span className={styles.label}>{title}</span>
        {info !== undefined && <InfoHint text={info} />}
      </div>

      <div className={styles.chartWrap}>
        <ResponsiveContainer height="100%" width="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
