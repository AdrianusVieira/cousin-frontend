import { useParams } from "react-router-dom";

import styles from "./PagePlaceholder.module.css";

/**
 * Temporary stand-in so the routing skeleton is navigable. Each route gets a real page
 * component (owning its aggregate query) in a later session — see components-tree.md.
 */
export function PagePlaceholder({ title }: { title: string }) {
  const params = useParams();
  const id = params.id;

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>{title}</h1>
      {id ? <p className={styles.note}>detail · id {id}</p> : null}
      <p className={styles.note}>! screen not built yet</p>
    </div>
  );
}
