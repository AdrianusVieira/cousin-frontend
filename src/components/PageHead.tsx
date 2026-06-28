import type { ReactNode } from "react";

import styles from "./PageHead.module.css";

interface PageHeadProps {
  actions?: ReactNode;
  periodLabel?: string;
  title: string;
}

export function PageHead({ actions, periodLabel, title }: PageHeadProps) {
  return (
    <header className={styles.head}>
      <div className={styles.left}>
        <h1 className={styles.title}>{title}</h1>
        {periodLabel && <span className={styles.periodLabel}>{periodLabel}</span>}
      </div>

      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
