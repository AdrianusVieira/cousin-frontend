import { createContext } from "react";

export const THEMES = [
  { id: "monochrome", label: "Monochrome", color: "#e4edf3" },
  { id: "purple", label: "Purple", color: "#bb92ff" },
  { id: "green", label: "Green", color: "#43ef9b" },
  { id: "blue", label: "Blue", color: "#6195ff" },
  { id: "light", label: "Light", color: "#2456d9" },
] as const;
export type Theme = (typeof THEMES)[number]["id"];

export interface ThemeContextValue {
  theme: Theme;
  storageError: boolean;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export const THEME_STORAGE_KEY = "cousin-theme";
