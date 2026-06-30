import type { ReactNode } from "react";

import styles from "./FormField.module.css";

interface FormFieldProps {
  children: ReactNode;
  error?: string;
  label: string;
  required?: boolean;
}

export function FormField({ children, error, label, required }: FormFieldProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>

      {children}

      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
