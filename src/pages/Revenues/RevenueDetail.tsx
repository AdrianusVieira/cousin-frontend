import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { mapFieldErrors } from "@/lib/api/mapFieldErrors";

import { BackLink } from "@/components/BackLink";
import { FormField } from "@/components/FormField";
import { Modal } from "@/components/Modal";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { formatDateWithYear } from "@/lib/format";
import type { Revenue } from "@/types/api";

import form from "@/styles/form.module.css";

import styles from "./RevenueDetail.module.css";
import { useRevenueDetail } from "./useRevenueDetail";

const LABELS = {
  cancel: "Cancel",
  delete: "Delete",
  description: "Description",
  edit: "Edit",
  linkedTxn: "Linked Transaction",
  loading: "Loading…",
  markPending: "Mark pending",
  markReceived: "Mark received",
  name: "Name",
  save: "Save",
  status: "Status",
  term: "Term",
  title: "Edit Revenue",
  value: "Value",
  viewRecurrence: "View recurrence",
};

const TEXT = {
  deleteBlocked: "! Cannot delete a received revenue.",
  flagged: "! This revenue is flagged — check its receipt status.",
};

function EditModal({
  isSubmitting,
  onClose,
  onSubmit,
  revenue,
  serverError,
}: {
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Pick<Revenue, "description" | "name" | "term" | "value">>) => void;
  revenue: Revenue;
  serverError?: unknown;
}) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = useForm({
    defaultValues: {
      description: revenue.description ?? "",
      name: revenue.name,
      term: revenue.term,
      value: revenue.value,
    },
  });

  useEffect(() => {
    mapFieldErrors(serverError, setError as Parameters<typeof mapFieldErrors>[1]);
  }, [serverError, setError]);

  const processSubmit = useCallback(
    (values: { description: string; name: string; term: string; value: string }) => {
      if (!values.name.trim()) { setError("name", { message: "Required" }); return; }

      const payload: Record<string, string> = {};
      if (values.name.trim() !== revenue.name) payload.name = values.name.trim();
      if (values.value !== revenue.value) payload.value = values.value;
      if (values.term !== revenue.term) payload.term = values.term;
      if (values.description.trim() !== (revenue.description ?? ""))
        payload.description = values.description.trim();

      if (Object.keys(payload).length > 0) onSubmit(payload);
      else onClose();
    },
    [onClose, onSubmit, revenue, setError],
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

export function RevenueDetail() {
  const navigate = useNavigate();

  const {
    deleteBlocked,
    editOpen,
    error,
    isLoading,
    isSubmitting,
    linkedTxnValue,
    revenue,
    statusValue,
    valueFormatted,

    closeEdit,
    deleteRevenue,
    editError,
    openEdit,
    submitEdit,
    toggleReceived,
  } = useRevenueDetail();

  return (
    <>
      <BackLink label="Revenues" to="/revenues" />

      {error && <div className={styles.error}>! {error.message}</div>}

      {isLoading || !revenue ? (
        <div className={styles.loading}>{LABELS.loading}</div>
      ) : (
        <>
          <PageHead
            actions={
              <>
                {revenue.recurrenceId && (
                  <button
                    className={form.btnSecondary}
                    onClick={() => navigate(`/recurrences/${revenue.recurrenceId}`)}
                    type="button"
                  >
                    {LABELS.viewRecurrence}
                  </button>
                )}
                <button className={form.btnSecondary} onClick={openEdit} type="button">
                  {LABELS.edit}
                </button>
                <button className={form.btnSecondary} onClick={toggleReceived} type="button">
                  {revenue.received ? LABELS.markPending : LABELS.markReceived}
                </button>
                <button
                  className={form.btnSecondary}
                  disabled={revenue.received}
                  onClick={deleteRevenue}
                  type="button"
                >
                  {LABELS.delete}
                </button>
              </>
            }
            title={revenue.name}
          />

          {deleteBlocked && <div className={styles.notice}>{TEXT.deleteBlocked}</div>}
          {revenue.flagged && <div className={styles.notice}>{TEXT.flagged}</div>}

          <div className={styles.statGrid}>
            <StatCard accent="net" label={LABELS.value} value={valueFormatted} />
            <StatCard accent="net" label={LABELS.term} value={formatDateWithYear(revenue.term)} />
            <StatCard
              accent={revenue.received ? "revenue" : "outcome"}
              label={LABELS.status}
              value={statusValue}
            />
            <StatCard accent="credit" label={LABELS.linkedTxn} value={linkedTxnValue} />
          </div>
        </>
      )}

      {editOpen && revenue && (
        <EditModal
          isSubmitting={isSubmitting}
          onClose={closeEdit}
          onSubmit={submitEdit}
          revenue={revenue}
          serverError={editError}
        />
      )}
    </>
  );
}
