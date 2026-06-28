import { useEffect, useState, type ReactNode } from "react";

import { checkHealth } from "@/lib/api/health";

import styles from "./HealthGate.module.css";

const POLL_INTERVAL_MS = 3_000;

const TEXT = {
  brand: "cou$in",
  message: "Waking up the server…",
  submessage: "This usually takes 30–60 seconds on the first visit.",
};

export function HealthGate({ children }: { children: ReactNode }) {
  const [healthy, setHealthy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const ok = await checkHealth();

      if (cancelled) return;

      if (ok) {
        setHealthy(true);
        return;
      }

      setTimeout(poll, POLL_INTERVAL_MS);
    }

    poll();

    return () => {
      cancelled = true;
    };
  }, []);

  if (healthy) {
    return <>{children}</>;
  }

  return (
    <div className={styles.gate}>
      <div className={styles.brand}>{TEXT.brand}</div>
      <div className={styles.message}>{TEXT.message}</div>
      <div className={styles.submessage}>{TEXT.submessage}</div>
    </div>
  );
}
