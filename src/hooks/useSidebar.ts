import { useCallback, useEffect, useState } from "react";

const SIDEBAR_STORAGE_KEY = "cousin-sidebar";

function resolveInitialOpen(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) !== "hidden";
  } catch {
    return true;
  }
}

/** Sidebar visibility is AppShell-local, not global client state — no provider. */
export function useSidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(resolveInitialOpen);

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === null || event.key === SIDEBAR_STORAGE_KEY) {
        setSidebarOpen(resolveInitialOpen());
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const toggleSidebar = useCallback(() => {
    const next = !sidebarOpen;
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? "open" : "hidden");
    } catch {
      // Navigation remains usable when browser storage is unavailable.
    }
    setSidebarOpen(next);
  }, [sidebarOpen]);

  return {
    // data
    sidebarOpen,

    // handlers
    toggleSidebar,
  };
}
