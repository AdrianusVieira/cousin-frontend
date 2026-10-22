import { useCallback, useEffect, useId, useRef, type ReactNode } from "react";

import styles from "./Modal.module.css";

const LABELS = { close: "Close dialog" };

interface ModalProps {
  children: ReactNode;
  footer: ReactNode;
  onClose: () => void;
  title: string;
}

export function Modal({ children, footer, onClose, title }: ModalProps) {
  const titleId = useId();
  const overlayRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const opener = document.activeElement;
    const dialog = overlayRef.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, []);

  const handleOverlayClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === overlayRef.current) onClose();
    },
    [onClose],
  );

  return (
    <dialog
      aria-labelledby={titleId}
      className={styles.overlay}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={handleOverlayClick}
      ref={overlayRef}
    >
      <div className={styles.modal}>
        <header className={styles.header}>
          <span className={styles.title} id={titleId}>
            {title}
          </span>
          <button
            aria-label={LABELS.close}
            className={styles.close}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </header>

        <div className={styles.body}>{children}</div>

        <footer className={styles.footer}>{footer}</footer>
      </div>
    </dialog>
  );
}
