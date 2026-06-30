import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";

import { mapFieldErrors } from "@/lib/api/mapFieldErrors";

import { BackLink } from "@/components/BackLink";
import { FormField } from "@/components/FormField";
import { Modal } from "@/components/Modal";
import { PageHead } from "@/components/PageHead";
import { PeriodSelector } from "@/components/PeriodSelector";
import { StatCard } from "@/components/StatCard";
import { TransactionsTable } from "@/components/TransactionsTable";

import { BreakdownChart } from "./BreakdownChart";
import type { Category } from "@/types/api";

import form from "@/styles/form.module.css";

import styles from "./CategoryDetail.module.css";
import { useCategoryDetail } from "./useCategoryDetail";

const LABELS = {
  archive: "Archive",
  cancel: "Cancel",
  description: "Description",
  edit: "Edit",
  loading: "Loading…",
  name: "Name",
  save: "Save",
  title: "Edit Category",
  totalIncome: "Total Income",
  totalOutcome: "Total Outcome",
  unarchive: "Unarchive",
};

function EditModal({
  category,
  isSubmitting,
  onClose,
  onSubmit,
  serverError,
}: {
  category: Category;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: { description?: string; name?: string }) => void;
  serverError?: unknown;
}) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = useForm({
    defaultValues: {
      description: category.description ?? "",
      name: category.name,
    },
  });

  useEffect(() => {
    mapFieldErrors(serverError, setError as Parameters<typeof mapFieldErrors>[1]);
  }, [serverError, setError]);

  const processSubmit = useCallback(
    (values: { description: string; name: string }) => {
      if (!values.name.trim()) { setError("name", { message: "Required" }); return; }

      const payload: Record<string, string> = {};
      if (values.name.trim() !== category.name) payload.name = values.name.trim();
      if (values.description.trim() !== (category.description ?? ""))
        payload.description = values.description.trim();

      if (Object.keys(payload).length > 0) onSubmit(payload);
      else onClose();
    },
    [category, onClose, onSubmit, setError],
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

export function CategoryDetail() {
  const {
    breakdown,
    category,
    editOpen,
    error,
    id,
    isArchived,
    isLoading,
    isSubmitting,
    period,
    periodLabel,
    totalIncomeValue,
    totalOutcomeValue,

    archive,
    closeEdit,
    editError,
    openEdit,
    setPeriod,
    submitEdit,
    unarchive,
  } = useCategoryDetail();

  return (
    <>
      <BackLink label="Categories" to="/categories" />

      {error && <div className={styles.error}>! {error.message}</div>}

      {isLoading || !category ? (
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
                {isArchived ? (
                  <button className={form.btnSecondary} onClick={unarchive} type="button">
                    {LABELS.unarchive}
                  </button>
                ) : (
                  <button className={form.btnSecondary} onClick={archive} type="button">
                    {LABELS.archive}
                  </button>
                )}
              </>
            }
            periodLabel={periodLabel}
            title={category.name}
          />

          <div className={styles.statGrid}>
            <StatCard accent="revenue" label={LABELS.totalIncome} value={totalIncomeValue} />
            <StatCard accent="outcome" label={LABELS.totalOutcome} value={totalOutcomeValue} />
          </div>

          <div className={styles.chartWrap}>
            <BreakdownChart data={breakdown} />
          </div>

          <div className={styles.tableWrap}>
            <TransactionsTable category={id} from={period.from} to={period.to} />
          </div>
        </>
      )}

      {editOpen && category && (
        <EditModal
          category={category}
          isSubmitting={isSubmitting}
          onClose={closeEdit}
          onSubmit={submitEdit}
          serverError={editError}
        />
      )}
    </>
  );
}
