import { useEffect, useRef } from "react";
import form from "@/styles/form.module.css";
import { AppearanceOptions } from "./AppearanceOptions";
import styles from "./AppearanceDialog.module.css";

const LABELS = { close: "Done", title: "Appearance" };

export function AppearanceDialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const opener = document.activeElement;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, []);
  return (
    <dialog
      aria-labelledby="appearance-title"
      className={styles.dialog}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      ref={ref}
    >
      <header className={styles.header}>
        <h2 id="appearance-title">{LABELS.title}</h2>
        <button autoFocus className={form.btnSecondary} onClick={onClose} type="button">
          {LABELS.close}
        </button>
      </header>
      <AppearanceOptions />
    </dialog>
  );
}
