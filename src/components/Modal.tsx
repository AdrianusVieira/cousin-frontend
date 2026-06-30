import { useCallback, useEffect, useRef, type ReactNode } from "react";

import styles from "./Modal.module.css";

interface ModalProps {
  children: ReactNode;
  footer: ReactNode;
  onClose: () => void;
  title: string;
}

export function Modal({ children, footer, onClose, title }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) onClose();
    },
    [onClose],
  );

  return (
    <div className={styles.overlay} onClick={handleOverlayClick} ref={overlayRef}>
      <div className={styles.modal}>
        <header className={styles.header}>
          <span className={styles.title}>{title}</span>
          <button className={styles.close} onClick={onClose} type="button">
            ×
          </button>
        </header>

        <div className={styles.body}>{children}</div>

        <footer className={styles.footer}>{footer}</footer>
      </div>
    </div>
  );
}
