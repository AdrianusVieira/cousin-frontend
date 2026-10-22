import type { CSSProperties } from "react";
import { useTheme } from "@/hooks/useTheme";
import { THEMES } from "@/providers/themeContext";
import styles from "./AppearanceOptions.module.css";

const LABELS = { theme: "Theme" };
const TEXT = {
  intro: "Choose a color theme for Cousin.",
  saved: "Appearance is saved automatically in this browser.",
  error: "Browser storage is unavailable. Appearance changes will last for this visit.",
};

export function AppearanceOptions() {
  const { setTheme, storageError, theme } = useTheme();
  return (
    <div className={styles.appearance}>
      <p className={styles.note}>{TEXT.intro}</p>
      <fieldset className={styles.fieldset}>
        <legend>{LABELS.theme}</legend>
        <div className={styles.themes}>
          {THEMES.map((entry) => (
            <label
              className={styles.choice}
              key={entry.id}
              style={{ "--swatch": entry.color } as CSSProperties}
            >
              <input
                checked={theme === entry.id}
                name="cousin-theme"
                onChange={() => setTheme(entry.id)}
                type="radio"
                value={entry.id}
              />
              <span className={styles.swatch} />
              <span>{entry.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <p className={styles.note} role="status">
        {storageError ? TEXT.error : TEXT.saved}
      </p>
    </div>
  );
}
