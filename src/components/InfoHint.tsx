import { useId } from "react";

import styles from "./InfoHint.module.css";

const LABELS = {
  trigger: "?",
  triggerAria: "What is this?",
};

interface InfoHintProps {
  text: string;
}

export function InfoHint({ text }: InfoHintProps) {
  const tooltipId = useId();

  return (
    <span className={styles.wrap}>
      <button
        aria-describedby={tooltipId}
        aria-label={LABELS.triggerAria}
        className={styles.trigger}
        type="button"
      >
        {LABELS.trigger}
      </button>

      <span className={styles.tooltip} id={tooltipId} role="tooltip">
        {text}
      </span>
    </span>
  );
}
