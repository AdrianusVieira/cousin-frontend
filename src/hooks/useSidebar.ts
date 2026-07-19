import { useCallback, useState } from "react";

const SIDEBAR_STORAGE_KEY = "cousin-sidebar";

function resolveInitialOpen(): boolean {
  return localStorage.getItem(SIDEBAR_STORAGE_KEY) !== "hidden";
}

/** Sidebar visibility is AppShell-local, not global client state — no provider. */
export function useSidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(resolveInitialOpen);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((current) => {
      const next = !current;
      localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? "open" : "hidden");

      return next;
    });
  }, []);

  return {
    // data
    sidebarOpen,

    // handlers
    toggleSidebar,
  };
}
