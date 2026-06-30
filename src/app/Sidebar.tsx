import { NavLink } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";

import { NAV_GROUPS } from "./navigation";
import styles from "./Sidebar.module.css";

const LABELS = {
  dark: "Dark",
  light: "Light",
  signOut: "Sign out",
};

export function Sidebar() {
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className={styles.sidebar} aria-label="Primary">
      <div className={styles.brand}>cou$in</div>

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
        <button className={styles.themeToggle} onClick={toggleTheme} type="button">
          {theme === "dark" ? LABELS.light : LABELS.dark}
        </button>
        <button className={styles.signOut} onClick={signOut} type="button">
          {LABELS.signOut}
        </button>
      </div>
    </nav>
  );
}
