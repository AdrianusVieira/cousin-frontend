import styles from "./FilterSegment.module.css";

export interface FilterOption {
  label: string;
  value: string;
}

interface FilterSegmentProps {
  onChange: (value: string) => void;
  options: readonly FilterOption[];
  value: string;
}

export function FilterSegment({ onChange, options, value }: FilterSegmentProps) {
  return (
    <div className={styles.segment}>
      {options.map((option) => (
        <button
          className={`${styles.option}${option.value === value ? ` ${styles.active}` : ""}`}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
