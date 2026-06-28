import type { ReactNode } from "react";

import { Sidebar } from "./Sidebar";
import styles from "./AppShell.module.css";

/** Persistent sidebar + scrollable main area; main carries the ledger-line texture. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={`${styles.main} page-shell`}>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
