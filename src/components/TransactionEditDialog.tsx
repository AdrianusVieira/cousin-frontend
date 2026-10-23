import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { FormField } from "@/components/FormField";
import { Modal } from "@/components/Modal";
import { api } from "@/lib/api/client";
import { mapFieldErrors } from "@/lib/api/mapFieldErrors";
import type { CategoryListResponse, PatchTransaction, Transaction } from "@/types/api";
import form from "@/styles/form.module.css";
import styles from "./TransactionsTable.module.css";

const LABELS = {
  amount: "Amount",
  cancel: "Cancel",
  category: "Category",
  date: "Date",
  description: "Description",
  save: "Save",
  title: "Edit Transaction",
  uncategorized: "Uncategorized",
};
const TEXT = {
  failed: "Could not save this transaction.",
  invalidAmount: "Enter an amount greater than zero with up to two decimal places",
  required: "Required",
};
interface Values {
  amount: string;
  categoryId: string;
  date: string;
  description: string;
}

export function TransactionEditDialog({
  error,
  isSubmitting,
  onClose,
  onSubmit,
  transaction,
}: {
  error?: Error | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: PatchTransaction) => void;
  transaction: Transaction;
}) {
  const { data, error: categoryError } = useQuery({
    queryKey: ["categories", "edit"],
    queryFn: () => api.get<CategoryListResponse>("/categories", { query: { active: true } }),
  });
  const {
    formState: { errors, isDirty },
    handleSubmit,
    register,
    setError,
  } = useForm<Values>({
    defaultValues: {
      amount: transaction.amount,
      categoryId: transaction.category?.id ?? "",
      date: transaction.date,
      description: transaction.description ?? "",
    },
  });
  useEffect(() => {
    mapFieldErrors(error, setError as Parameters<typeof mapFieldErrors>[1]);
  }, [error, setError]);
  const submit = handleSubmit((values) => {
    const patch: PatchTransaction = {};
    if (values.amount !== transaction.amount) patch.amount = values.amount;
    if (values.date !== transaction.date) patch.date = values.date;
    if (values.description !== (transaction.description ?? ""))
      patch.description = values.description || null;
    if (values.categoryId !== (transaction.category?.id ?? ""))
      patch.categoryId = values.categoryId || null;
    if (Object.keys(patch).length) onSubmit(patch);
  });
  return (
    <Modal
      footer={
        <>
          <button className={form.btnSecondary} onClick={onClose} type="button">
            {LABELS.cancel}
          </button>
          <button
            className={form.btnPrimary}
            disabled={isSubmitting || !isDirty}
            onClick={submit}
            type="button"
          >
            {LABELS.save}
          </button>
        </>
      }
      onClose={onClose}
      title={LABELS.title}
    >
      <div className={styles.editForm}>
        {error && <p role="alert">{error.message || TEXT.failed}</p>}
        {categoryError && <p role="alert">{categoryError.message}</p>}
        <FormField error={errors.amount?.message} label={LABELS.amount} required>
          <input
            aria-label={LABELS.amount}
            className={form.input}
            inputMode="decimal"
            {...register("amount", {
              validate: (value) =>
                (/^\d+(\.\d{1,2})?$/.test(value) && Number(value) > 0) || TEXT.invalidAmount,
            })}
          />
        </FormField>
        <FormField error={errors.date?.message} label={LABELS.date} required>
          <input
            aria-label={LABELS.date}
            className={form.input}
            type="date"
            {...register("date", { required: TEXT.required })}
          />
        </FormField>
        <FormField error={errors.description?.message} label={LABELS.description}>
          <input
            aria-label={LABELS.description}
            className={form.input}
            {...register("description")}
          />
        </FormField>
        <FormField error={errors.categoryId?.message} label={LABELS.category}>
          <select aria-label={LABELS.category} className={form.select} {...register("categoryId")}>
            <option value="">{LABELS.uncategorized}</option>
            {transaction.category &&
              !data?.items.some((item) => item.id === transaction.category!.id) && (
                <option value={transaction.category.id}>{transaction.category.name}</option>
              )}
            {data?.items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </FormField>
      </div>
    </Modal>
  );
}
