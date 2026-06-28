import { NavLink } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";

import { NAV_GROUPS } from "./navigation";
import styles from "./Sidebar.module.css";

export function Sidebar() {
  const { signOut } = useAuth();

  return (
    <nav className={styles.sidebar} aria-label="Primary">
      <div className={styles.brand}>cou$in</div>

      {NAV_GROUPS.map((group) => (
        <div key={group.title} className={styles.group}>
          <div className={styles.groupTitle}>{group.title}</div>

          {group.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                isActive ? `${styles.item} ${styles.itemActive}` : styles.item
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      ))}

      <div className={styles.footer}>
        <button className={styles.signOut} onClick={signOut} type="button">
          Sign out
        </button>
      </div>
    </nav>
  );
}
