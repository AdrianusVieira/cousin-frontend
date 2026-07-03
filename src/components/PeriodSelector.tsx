import { usePeriod } from "@/lib/period";

import styles from "./PeriodSelector.module.css";

const LABELS = {
  from: "From",
  to: "To",
};

/**
 * App-global date-range control living in the sidebar. Two always-visible date inputs;
 * each edit commits immediately to the shared period. Reads/writes via usePeriod, so it
 * needs no props — there is a single instance for the whole app.
 */
export function PeriodSelector() {
  const { period, setPeriod } = usePeriod();

  return (
    <div className={styles.wrap}>
      <label className={styles.field}>
        <span className={styles.label}>{LABELS.from}</span>
        <input
          className={styles.input}
          onChange={(e) => {
            if (e.target.value) setPeriod({ ...period, from: e.target.value });
          }}
          type="date"
          value={period.from}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>{LABELS.to}</span>
        <input
          className={styles.input}
          onChange={(e) => {
            if (e.target.value) setPeriod({ ...period, to: e.target.value });
          }}
          type="date"
          value={period.to}
        />
      </label>
    </div>
  );
}
