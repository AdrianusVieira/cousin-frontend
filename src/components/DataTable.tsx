import type { ReactNode } from "react";

import styles from "./DataTable.module.css";

export interface Column<T> {
  align?: "left" | "right";
  header: string;
  key: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  emptyMessage?: string;
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  rows: T[];
}

export function DataTable<T>({
  columns,
  emptyMessage,
  keyExtractor,
  onRowClick,
  rows,
}: DataTableProps<T>) {
  if (rows.length === 0 && emptyMessage) {
    return <div className={styles.empty}>{emptyMessage}</div>;
  }

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                className={col.align === "right" ? styles.thRight : styles.th}
                key={col.key}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr
              className={onRowClick ? styles.clickableRow : styles.row}
              key={keyExtractor(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col) => (
                <td
                  className={col.align === "right" ? styles.tdRight : styles.td}
                  key={col.key}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
