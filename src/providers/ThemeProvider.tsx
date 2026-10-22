import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { THEMES, THEME_STORAGE_KEY, ThemeContext, type Theme } from "./themeContext";

function initialAppearance() {
  let theme: Theme = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "monochrome"
    : "light";
  let storageError = false;
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "dark") theme = "monochrome";
    else if (THEMES.some((entry) => entry.id === stored)) theme = stored as Theme;
  } catch {
    storageError = true;
  }
  return { storageError, theme };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearance] = useState(initialAppearance);
  const { storageError, theme } = appearance;

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme === "light" ? "light" : "dark";
    root.dataset.palette = theme;
    root.style.colorScheme = theme === "light" ? "light" : "dark";
  }, [theme]);

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === null || event.key === THEME_STORAGE_KEY) setAppearance(initialAppearance());
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    let failed = false;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      failed = true;
    }
    setAppearance({ storageError: failed, theme: next });
  }, []);
  const value = useMemo(() => ({ setTheme, storageError, theme }), [setTheme, storageError, theme]);
  return <ThemeContext value={value}>{children}</ThemeContext>;
}
