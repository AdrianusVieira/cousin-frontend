import { NavLink } from "react-router-dom";

import { BrandIcon } from "@/components/BrandIcon";
import { PeriodSelector } from "@/components/PeriodSelector";
import { useAuth } from "@/hooks/useAuth";
import { AppearanceButton } from "@/components/AppearanceButton";

import { NAV_GROUPS } from "./navigation";
import styles from "./Sidebar.module.css";

const LABELS = {
  brand: "cou$in",
  period: "Period",
  signOut: "Sign out",
};

export function Sidebar({ hidden }: { hidden: boolean }) {
  const { signOut } = useAuth();

  return (
    <nav
      aria-label="Primary"
      className={hidden ? `${styles.sidebar} ${styles.sidebarHidden}` : styles.sidebar}
    >
      <div className={styles.brand}>
        <BrandIcon />
        <span>{LABELS.brand}</span>
      </div>

      <div className={styles.period}>
        <div className={styles.groupTitle}>{LABELS.period}</div>
        <PeriodSelector />
      </div>

      {NAV_GROUPS.map((group) => (
        <div key={group.title} className={styles.group}>
          <div className={styles.groupTitle}>{group.title}</div>

          {group.items.map((item) => (
            <NavLink
              className={({ isActive }) =>
                isActive ? `${styles.item} ${styles.itemActive}` : styles.item
              }
              end={item.to === "/"}
              key={item.to}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      ))}

      <div className={styles.footer}>
        <AppearanceButton />
        <button className={styles.signOut} onClick={signOut} type="button">
          {LABELS.signOut}
        </button>
      </div>
    </nav>
  );
}
