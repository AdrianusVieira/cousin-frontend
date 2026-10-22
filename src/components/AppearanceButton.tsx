import { useState } from "react";

import form from "@/styles/form.module.css";

import { AppearanceDialog } from "./AppearanceDialog";

const LABELS = { appearance: "Appearance" };

export function AppearanceButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        aria-haspopup="dialog"
        className={form.btnSecondary}
        onClick={() => setOpen(true)}
        type="button"
      >
        {LABELS.appearance}
      </button>
      {open && <AppearanceDialog onClose={() => setOpen(false)} />}
    </>
  );
}
