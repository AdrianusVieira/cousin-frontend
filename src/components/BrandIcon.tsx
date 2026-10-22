import { useId } from "react";

import { BRAND_ACCENT_PATH, BRAND_BODY_PATH, BRAND_VIEW_BOX } from "@/lib/brand";

import styles from "./BrandIcon.module.css";

export function BrandIcon({ className }: { className?: string }) {
  const id = `cousin-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}-glow`;

  return (
    <svg
      aria-hidden="true"
      className={className ? `${styles.icon} ${className}` : styles.icon}
      focusable="false"
      viewBox={BRAND_VIEW_BOX}
    >
      <defs>
        <filter height="140%" id={id} width="140%" x="-20%" y="-20%">
          <feDropShadow
            dx="0"
            dy="0"
            floodColor="var(--color-net)"
            floodOpacity="var(--brand-glow)"
            stdDeviation="18"
          />
        </filter>
      </defs>
      <g fillRule="evenodd" filter={`url(#${id})`}>
        <path d={BRAND_BODY_PATH} fill="var(--brand-body)" />
        <path d={BRAND_ACCENT_PATH} fill="var(--color-net)" />
      </g>
    </svg>
  );
}
