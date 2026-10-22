import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { brandSvg } from "@/lib/brand";
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
    const style = getComputedStyle(root);
    const accent = style.getPropertyValue("--color-net").trim();
    const body = style.getPropertyValue("--color-text").trim();
    const glow = Number(style.getPropertyValue("--brand-glow"));
    const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (icon && accent && body) {
      icon.href = `data:image/svg+xml,${encodeURIComponent(brandSvg(accent, body, glow))}`;
    }
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
