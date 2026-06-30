import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";

import { mapFieldErrors } from "@/lib/api/mapFieldErrors";

import { BackLink } from "@/components/BackLink";
import type { Column } from "@/components/DataTable";
import { DataTable } from "@/components/DataTable";
import { FormField } from "@/components/FormField";
import { Modal } from "@/components/Modal";
import { PageHead } from "@/components/PageHead";
import { PeriodSelector } from "@/components/PeriodSelector";
import { Pill } from "@/components/Pill";
import { StatCard } from "@/components/StatCard";
import { formatDate, formatMoney } from "@/lib/format";
import type { Bill, Revenue, Source } from "@/types/api";

import form from "@/styles/form.module.css";

import styles from "./SourceDetail.module.css";
import { useSourceDetail } from "./useSourceDetail";

const LABELS = {
  archive: "Archive",
  archiveBlocked: "! Cannot archive — source has unpaid bills or unreceived revenues.",
  bills: "Bills",
  cancel: "Cancel",
  description: "Description",
  edit: "Edit",
  loading: "Loading…",
  name: "Name",
  revenues: "Revenues",
  save: "Save",
  status: "Status",
  term: "Term",
  title: "Edit Source",
  totalIncome: "Total Income",
  totalOutcome: "Total Outcome",
  unarchive: "Unarchive",
  value: "Value",
};

const TEXT = {
  paid: "Paid",
  pending: "Pending",
  received: "Received",
  unpaid: "Unpaid",
};

const BILL_COLUMNS: Column<Bill>[] = [
  { header: LABELS.name, key: "name", render: (b) => b.name },
  { header: LABELS.term, key: "term", render: (b) => formatDate(b.term) },
  {
    header: LABELS.status,
    key: "status",
    render: (b) => b.paid
      ? <Pill accent="revenue">{TEXT.paid}</Pill>
      : <Pill accent="outcome">{TEXT.unpaid}</Pill>,
  },
  { align: "right", header: LABELS.value, key: "value", render: (b) => formatMoney(b.value) },
];

const REVENUE_COLUMNS: Column<Revenue>[] = [
  { header: LABELS.name, key: "name", render: (r) => r.name },
  { header: LABELS.term, key: "term", render: (r) => formatDate(r.term) },
  {
    header: LABELS.status,
    key: "status",
    render: (r) => r.received
      ? <Pill accent="revenue">{TEXT.received}</Pill>
      : <Pill accent="outcome">{TEXT.pending}</Pill>,
  },
  { align: "right", header: LABELS.value, key: "value", render: (r) => formatMoney(r.value) },
];

function EditModal({
  isSubmitting,
  onClose,
  onSubmit,
  serverError,
  source,
}: {
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: { description?: string; name?: string }) => void;
  serverError?: unknown;
  source: Source;
}) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = useForm({
    defaultValues: {
      description: source.description ?? "",
      name: source.name,
    },
  });

  useEffect(() => {
    mapFieldErrors(serverError, setError as Parameters<typeof mapFieldErrors>[1]);
  }, [serverError, setError]);

  const processSubmit = useCallback(
    (values: { description: string; name: string }) => {
      if (!values.name.trim()) { setError("name", { message: "Required" }); return; }

      const payload: Record<string, string> = {};
      if (values.name.trim() !== source.name) payload.name = values.name.trim();
      if (values.description.trim() !== (source.description ?? ""))
        payload.description = values.description.trim();

      if (Object.keys(payload).length > 0) onSubmit(payload);
      else onClose();
    },
    [onClose, onSubmit, setError, source],
  );

  return (
    <Modal
      footer={
        <>
          <button className={form.btnSecondary} onClick={onClose} type="button">
            {LABELS.cancel}
          </button>
          <button className={form.btnPrimary} disabled={isSubmitting} onClick={handleSubmit(processSubmit)} type="button">
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
        <FormField label={LABELS.description}>
          <input className={form.input} type="text" {...register("description")} />
        </FormField>
      </div>
    </Modal>
  );
}

export function SourceDetail() {
  const {
    archiveBlocked,
    bills,
    editOpen,
    error,
    isLoading,
    isSubmitting,
    period,
    periodLabel,
    revenues,
    source,
    totalIncomeValue,
    totalOutcomeValue,

    archive,
    closeEdit,
    editError,
    openEdit,
    setPeriod,
    submitEdit,
    unarchive,
  } = useSourceDetail();

  return (
    <>
      <BackLink label="Sources" to="/sources" />

      {error && <div className={styles.error}>! {error.message}</div>}

      {isLoading || !source ? (
        <div className={styles.loading}>{LABELS.loading}</div>
      ) : (
        <>
          <PageHead
            actions={
              <>
                <PeriodSelector onChange={setPeriod} value={period} />
                <button className={form.btnSecondary} onClick={openEdit} type="button">
                  {LABELS.edit}
                </button>
                {source.archived ? (
                  <button className={form.btnSecondary} onClick={unarchive} type="button">
                    {LABELS.unarchive}
                  </button>
                ) : (
                  <button
                    className={form.btnSecondary}
                    disabled={source.hasOpenItems}
                    onClick={archive}
                    type="button"
                  >
                    {LABELS.archive}
                  </button>
                )}
              </>
            }
            periodLabel={periodLabel}
            title={source.name}
          />

          {archiveBlocked && <div className={styles.notice}>{LABELS.archiveBlocked}</div>}

          <div className={styles.statGrid}>
            <StatCard accent="revenue" label={LABELS.totalIncome} value={totalIncomeValue} />
            <StatCard accent="outcome" label={LABELS.totalOutcome} value={totalOutcomeValue} />
          </div>

          <div className={styles.splitRow}>
            <div className={styles.splitCol}>
              <h2 className={styles.sectionTitle}>{LABELS.bills}</h2>
              <DataTable columns={BILL_COLUMNS} keyExtractor={(b) => b.id} rows={bills} />
            </div>

            <div className={styles.splitCol}>
              <h2 className={styles.sectionTitle}>{LABELS.revenues}</h2>
              <DataTable columns={REVENUE_COLUMNS} keyExtractor={(r) => r.id} rows={revenues} />
            </div>
          </div>
        </>
      )}

      {editOpen && source && (
        <EditModal isSubmitting={isSubmitting} onClose={closeEdit} onSubmit={submitEdit} serverError={editError} source={source} />
      )}
    </>
  );
}
