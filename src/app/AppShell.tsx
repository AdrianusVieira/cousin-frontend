import type { ReactNode } from "react";

import { useSidebar } from "@/hooks/useSidebar";

import { Sidebar } from "./Sidebar";
import styles from "./AppShell.module.css";

const LABELS = {
  hide: "Hide sidebar",
  hideGlyph: "«",
  show: "Show sidebar",
  showGlyph: "»",
};

/** Persistent navigation and responsive content; decoration stays behind cards. */
export function AppShell({ children }: { children: ReactNode }) {
  const { sidebarOpen, toggleSidebar } = useSidebar();

  return (
    <div className={styles.shell}>
      <Sidebar hidden={!sidebarOpen} />
      <main className={`${styles.main} page-shell`}>
        <div className={styles.content}>
          <button
            aria-expanded={sidebarOpen}
            aria-label={sidebarOpen ? LABELS.hide : LABELS.show}
            className={styles.sidebarToggle}
            onClick={toggleSidebar}
            type="button"
          >
            {sidebarOpen ? LABELS.hideGlyph : LABELS.showGlyph}
          </button>
          {children}
        </div>
      </main>
    </div>
  );
}
