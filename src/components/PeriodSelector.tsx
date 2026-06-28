import { useCallback, useEffect, useRef, useState } from "react";

import {
  formatPeriodLabel,
  PERIOD_PRESET,
  presetLabel,
  resolvePreset,
  type Period,
  type PeriodPreset,
} from "@/lib/period";

import styles from "./PeriodSelector.module.css";

const LABELS = {
  apply: "Apply",
  from: "From",
  to: "To",
};

const PRESETS: PeriodPreset[] = [
  PERIOD_PRESET.CurrentTrimester,
  PERIOD_PRESET.Last3Months,
  PERIOD_PRESET.ThisMonth,
  PERIOD_PRESET.ThisYear,
  PERIOD_PRESET.Custom,
];

interface PeriodSelectorProps {
  onChange: (period: Period) => void;
  value: Period;
}

export function PeriodSelector({ onChange, value }: PeriodSelectorProps) {
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(value.from);
  const [customTo, setCustomTo] = useState(value.to);
  const [showCustom, setShowCustom] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowCustom(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePreset = useCallback(
    (preset: PeriodPreset) => {
      if (preset === PERIOD_PRESET.Custom) {
        setCustomFrom(value.from);
        setCustomTo(value.to);
        setShowCustom(true);
        return;
      }

      onChange(resolvePreset(preset));
      setOpen(false);
      setShowCustom(false);
    },
    [onChange, value],
  );

  const handleApplyCustom = useCallback(() => {
    if (customFrom && customTo) {
      onChange({ from: customFrom, to: customTo });
      setOpen(false);
      setShowCustom(false);
    }
  }, [customFrom, customTo, onChange]);

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        className={styles.trigger}
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        {formatPeriodLabel(value)}
      </button>

      {open && (
        <div className={styles.panel}>
          {PRESETS.map((preset) => (
            <button
              className={`${styles.option}${
                !showCustom && preset !== PERIOD_PRESET.Custom &&
                JSON.stringify(resolvePreset(preset)) === JSON.stringify(value)
                  ? ` ${styles.optionActive}`
                  : ""
              }`}
              key={preset}
              onClick={() => handlePreset(preset)}
              type="button"
            >
              {presetLabel(preset)}
            </button>
          ))}

          {showCustom && (
            <div className={styles.customRange}>
              <div className={styles.dateRow}>
                <span className={styles.dateLabel}>{LABELS.from}</span>
                <input
                  className={styles.dateInput}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  type="date"
                  value={customFrom}
                />
              </div>

              <div className={styles.dateRow}>
                <span className={styles.dateLabel}>{LABELS.to}</span>
                <input
                  className={styles.dateInput}
                  onChange={(e) => setCustomTo(e.target.value)}
                  type="date"
                  value={customTo}
                />
              </div>

              <button
                className={styles.applyBtn}
                onClick={handleApplyCustom}
                type="button"
              >
                {LABELS.apply}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
