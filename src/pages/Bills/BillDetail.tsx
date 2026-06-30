import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";

import { mapFieldErrors } from "@/lib/api/mapFieldErrors";

import { BackLink } from "@/components/BackLink";
import type { Column } from "@/components/DataTable";
import { DataTable } from "@/components/DataTable";
import { FormField } from "@/components/FormField";
import { Modal } from "@/components/Modal";
import { PageHead } from "@/components/PageHead";
import { Pill } from "@/components/Pill";
import { StatCard } from "@/components/StatCard";
import { formatDateWithYear, formatMoney } from "@/lib/format";
import type { Bill } from "@/types/api";

import form from "@/styles/form.module.css";

import styles from "./BillDetail.module.css";
import { useBillDetail } from "./useBillDetail";

const LABELS = {
  cancel: "Cancel",
  delete: "Delete",
  description: "Description",
  edit: "Edit",
  flag: "Flag",
  linkedTxn: "Linked Transaction",
  loading: "Loading…",
  markPaid: "Mark paid",
  markUnpaid: "Mark unpaid",
  name: "Name",
  save: "Save",
  status: "Status",
  term: "Term",
  title: "Edit Bill",
  value: "Value",
};

const TEXT = {
  deleteBlocked: "! Cannot delete a paid bill.",
  flagged: "! This bill is flagged — check its payment status.",
  paid: "Paid",
  unpaid: "Unpaid",
};

const INSTANCE_COLUMNS: Column<Bill>[] = [
  { header: LABELS.name, key: "name", render: (b) => b.name },
  { header: LABELS.term, key: "term", render: (b) => formatDateWithYear(b.term) },
  {
    header: LABELS.status,
    key: "status",
    render: (b) => b.paid
      ? <Pill accent="revenue">{TEXT.paid}</Pill>
      : <Pill accent="outcome">{TEXT.unpaid}</Pill>,
  },
  { align: "right", header: LABELS.value, key: "value", render: (b) => formatMoney(b.value) },
];

function EditModal({
  bill,
  isSubmitting,
  onClose,
  onSubmit,
  serverError,
}: {
  bill: Bill;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Pick<Bill, "description" | "name" | "term" | "value">>) => void;
  serverError?: unknown;
}) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = useForm({
    defaultValues: {
      description: bill.description ?? "",
      name: bill.name,
      term: bill.term,
      value: bill.value,
    },
  });

  useEffect(() => {
    mapFieldErrors(serverError, setError as Parameters<typeof mapFieldErrors>[1]);
  }, [serverError, setError]);

  const processSubmit = useCallback(
    (values: { description: string; name: string; term: string; value: string }) => {
      if (!values.name.trim()) { setError("name", { message: "Required" }); return; }

      const payload: Record<string, string> = {};
      if (values.name.trim() !== bill.name) payload.name = values.name.trim();
      if (values.value !== bill.value) payload.value = values.value;
      if (values.term !== bill.term) payload.term = values.term;
      if (values.description.trim() !== (bill.description ?? ""))
        payload.description = values.description.trim();

      if (Object.keys(payload).length > 0) onSubmit(payload);
      else onClose();
    },
    [bill, onClose, onSubmit, setError],
  );

  return (
    <Modal
      footer={
        <>
          <button className={form.btnSecondary} onClick={onClose} type="button">
            {LABELS.cancel}
          </button>
          <button
            className={form.btnPrimary}
            disabled={isSubmitting}
            onClick={handleSubmit(processSubmit)}
            type="button"
          >
            {LABELS.save}
          </button>
        </>
      }
      onClose={onClose}
      title={LABELS.title}
    >
      <div className={styles.form}>
        <FormField error={errors.name?.message} label={LABELS.name} required>
          <input className={form.input} type="text" {...register("name")} />
        </FormField>
        <FormField label={LABELS.value}>
          <input className={form.input} inputMode="decimal" step="0.01" type="number" {...register("value")} />
        </FormField>
        <FormField label={LABELS.term}>
          <input className={form.input} type="date" {...register("term")} />
        </FormField>
        <FormField label={LABELS.description}>
          <input className={form.input} type="text" {...register("description")} />
        </FormField>
      </div>
    </Modal>
  );
}

export function BillDetail() {
  const {
    bill,
    deleteBlocked,
    editOpen,
    error,
    instances,
    isLoading,
    isSubmitting,
    linkedTxnValue,
    statusValue,
    valueFormatted,

    closeEdit,
    deleteBill,
    editError,
    openEdit,
    submitEdit,
    togglePaid,
  } = useBillDetail();

  return (
    <>
      <BackLink label="Bills" to="/bills" />

      {error && <div className={styles.error}>! {error.message}</div>}

      {isLoading || !bill ? (
        <div className={styles.loading}>{LABELS.loading}</div>
      ) : (
        <>
          <PageHead
            actions={
              <>
                <button className={form.btnSecondary} onClick={openEdit} type="button">
                  {LABELS.edit}
                </button>
                <button className={form.btnSecondary} onClick={togglePaid} type="button">
                  {bill.paid ? LABELS.markUnpaid : LABELS.markPaid}
                </button>
                <button
                  className={form.btnSecondary}
                  disabled={bill.paid}
                  onClick={deleteBill}
                  type="button"
                >
                  {LABELS.delete}
                </button>
              </>
            }
            title={bill.name}
          />

          {deleteBlocked && <div className={styles.notice}>{TEXT.deleteBlocked}</div>}
          {bill.flagged && <div className={styles.notice}>{TEXT.flagged}</div>}

          <div className={styles.statGrid}>
            <StatCard accent="net" label={LABELS.value} value={valueFormatted} />
            <StatCard
              accent={bill.paid ? "revenue" : "outcome"}
              label={LABELS.status}
              value={statusValue}
            />
            <StatCard accent="credit" label={LABELS.linkedTxn} value={linkedTxnValue} />
          </div>

          <div className={styles.tableWrap}>
            <DataTable
              columns={INSTANCE_COLUMNS}
              keyExtractor={(b) => b.id}
              rows={instances}
            />
          </div>
        </>
      )}

      {editOpen && bill && (
        <EditModal
          bill={bill}
          isSubmitting={isSubmitting}
          onClose={closeEdit}
          onSubmit={submitEdit}
          serverError={editError}
        />
      )}
    </>
  );
}
