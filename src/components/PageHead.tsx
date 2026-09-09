import type { ReactNode } from "react";

import { useLastUpdated } from "@/hooks/useLastUpdated";
import { formatDateTime } from "@/lib/format";
import type { MetaEntity } from "@/types/api";

import styles from "./PageHead.module.css";

const LABELS = {
  updated: "Updated",
};

interface PageHeadProps {
  actions?: ReactNode;
  /**
   * Which entity's last-change timestamp to stamp under the title. Omit on pages where
   * "last updated" has no single owning table (e.g. the dashboard).
   */
  entity?: MetaEntity;
  periodLabel?: string;
  title: string;
}

export function PageHead({ actions, entity, periodLabel, title }: PageHeadProps) {
  const { lastUpdatedAt } = useLastUpdated(entity);

  return (
    <header className={styles.head}>
      <div className={styles.left}>
        <h1 className={styles.title}>{title}</h1>

        {(periodLabel || lastUpdatedAt) && (
          <div className={styles.meta}>
            {periodLabel && <span>{periodLabel}</span>}
            {lastUpdatedAt && (
              <span>
                {LABELS.updated} {formatDateTime(lastUpdatedAt)}
              </span>
            )}
          </div>
        )}
      </div>

      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
