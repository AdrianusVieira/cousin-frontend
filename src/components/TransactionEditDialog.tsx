import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { CategoryAllocationFields } from "./CategoryAllocationFields";
import { transactionAllocations, validateCategoryAllocations } from "@/lib/categoryAllocations";
import type { CategoryAllocationInput } from "@/types/api";
import { FormField } from "@/components/FormField";
import { Modal } from "@/components/Modal";
import { api } from "@/lib/api/client";
import { mapFieldErrors } from "@/lib/api/mapFieldErrors";
import type { Category, CategoryListResponse, PatchTransaction, Transaction } from "@/types/api";
import form from "@/styles/form.module.css";
import styles from "./TransactionsTable.module.css";

const LABELS = {
  amount: "Amount",
  cancel: "Cancel",
  date: "Date",
  description: "Description",
  save: "Save",
  title: "Edit Transaction",
};
const TEXT = {
  failed: "Could not save this transaction.",
  invalidAmount: "Enter an amount greater than zero with up to two decimal places",
  required: "Required",
};
interface Values {
  amount: string;
  categoryAllocations: CategoryAllocationInput[];
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
  const originalAllocations = transactionAllocations(transaction);
  const {
    control,
    getValues,
    formState: { errors, isDirty },
    handleSubmit,
    register,
    setError,
    setValue,
  } = useForm<Values>({
    defaultValues: {
      amount: transaction.amount,
      categoryAllocations: originalAllocations,
      date: transaction.date,
      description: transaction.description ?? "",
    },
  });
  const amount = useWatch({ control, name: "amount" });
  useEffect(() => {
    if (getValues("categoryAllocations").length === 1) {
      setValue("categoryAllocations.0.amount", amount);
    }
  }, [amount, getValues, setValue]);
  const categoryOptions: Pick<Category, "id" | "name" | "archived">[] = [...(data?.items ?? [])];
  for (const item of transaction.categoryAllocations ?? []) {
    if (!categoryOptions.some((cat) => cat.id === item.categoryId)) {
      categoryOptions.push({ id: item.categoryId, name: item.categoryName, archived: true });
    }
  }
  if (transaction.category && !categoryOptions.some((cat) => cat.id === transaction.category!.id)) {
    categoryOptions.push({ ...transaction.category, archived: true });
  }
  useEffect(() => {
    mapFieldErrors(error, setError as Parameters<typeof mapFieldErrors>[1]);
  }, [error, setError]);
  const submit = handleSubmit((values) => {
    const patch: PatchTransaction = {};
    if (values.amount !== transaction.amount) patch.amount = values.amount;
    if (values.date !== transaction.date) patch.date = values.date;
    if (values.description !== (transaction.description ?? ""))
      patch.description = values.description || null;
    if (JSON.stringify(values.categoryAllocations) !== JSON.stringify(originalAllocations))
      patch.categoryAllocations = values.categoryAllocations;
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
        <Controller
          control={control}
          name="categoryAllocations"
          rules={{
            validate: (items) => validateCategoryAllocations(items, getValues("amount"), false),
          }}
          render={({ field }) => (
            <CategoryAllocationFields
              categories={categoryOptions}
              error={errors.categoryAllocations?.message}
              onChange={field.onChange}
              total={amount}
              value={field.value}
            />
          )}
        />
      </div>
    </Modal>
  );
}
