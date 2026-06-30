import { useNavigate } from "react-router-dom";

import styles from "./BackLink.module.css";

interface BackLinkProps {
  label: string;
  to: string;
}

export function BackLink({ label, to }: BackLinkProps) {
  const navigate = useNavigate();

  return (
    <button
      className={styles.link}
      onClick={() => navigate(to)}
      type="button"
    >
      ← {label}
    </button>
  );
}
