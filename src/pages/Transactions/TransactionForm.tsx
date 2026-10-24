import { useCallback, useEffect, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { mapFieldErrors } from "@/lib/api/mapFieldErrors";

import { CategoryAllocationFields } from "@/components/CategoryAllocationFields";
import {
  AMOUNT_INPUT_PATTERN,
  AMOUNT_PATTERN,
  validateCategoryAllocations,
} from "@/lib/categoryAllocations";
import type { CategoryAllocationInput } from "@/types/api";
import { FilterSegment } from "@/components/FilterSegment";
import { FormField } from "@/components/FormField";
import { Modal } from "@/components/Modal";
import { TXN_FROM_TYPE, TXN_METHOD } from "@/constants/transactions";
import { toTypesFor } from "@/constants/transactionMatrix";
import type {
  Bill,
  Category,
  CreateCreditTransaction,
  CreateDebitTransaction,
  CreateTransaction,
  Revenue,
  Wallet,
} from "@/types/api";

import form from "@/styles/form.module.css";

import styles from "./TransactionForm.module.css";

const LABELS = {
  amount: "Amount",
  cancel: "Cancel",
  create: "Create transaction",
  date: "Date",
  description: "Description",
  from: "From",
  fromType: "From type",
  installments: "Installments",
  method: "Method",
  placeholder: "—",
  term: "Term",
  title: "New Transaction",
  to: "To",
  toType: "To type",
};

const METHOD_OPTIONS = [
  { label: "Debit", value: "debit" },
  { label: "Credit", value: "credit" },
];

const TEXT = {
  installmentAmounts: "The transaction amount and category amounts apply to each installment.",
  invalidAmount: "Enter an amount greater than zero with up to two decimal places",
  required: "Required",
  noCategories: "Create an active category in Categories before recording a transaction.",
};

const FROM_TYPE_OPTIONS = [
  { label: "External", value: "external" },
  { label: "Revenue", value: "revenue" },
  { label: "Wallet", value: "wallet" },
];

const TO_TYPE_LABELS: Record<string, string> = {
  bill: "Bill",
  external: "External",
  wallet: "Wallet",
};

interface FormValues {
  amount: string;
  categoryAllocations: CategoryAllocationInput[];
  date: string;
  description: string;
  fromId: string;
  fromType: string;
  installmentTotal: string;
  method: string;
  term: string;
  toId: string;
  toType: string;
}

interface TransactionFormProps {
  bills: Bill[];
  categories: Category[];
  defaultMethod: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTransaction) => void;
  revenues: Revenue[];
  serverError?: unknown;
  wallets: Wallet[];
}

function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function defaultTerm(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");

  const monthOffset = d.getDate() > 9 ? 1 : 0;
  const term = new Date(d.getFullYear(), d.getMonth() + monthOffset, 15);

  return `${term.getFullYear()}-${pad(term.getMonth() + 1)}-15`;
}

export function TransactionForm({
  bills,
  categories,
  defaultMethod,
  isSubmitting,
  onClose,
  onSubmit,
  revenues,
  serverError,
  wallets,
}: TransactionFormProps) {
  const initialMethod = defaultMethod === TXN_METHOD.Credit ? TXN_METHOD.Credit : TXN_METHOD.Debit;

  const {
    control,
    formState: { errors },
    getValues,
    handleSubmit,
    register,
    resetField,
    setError,
    setValue,
  } = useForm<FormValues>({
    defaultValues: {
      amount: "",
      categoryAllocations: [{ categoryId: "", amount: "" }],
      date: todayISO(),
      description: "",
      fromId: "",
      fromType: initialMethod === TXN_METHOD.Credit ? TXN_FROM_TYPE.Wallet : "",
      installmentTotal: "",
      method: initialMethod,
      term: defaultTerm(),
      toId: "",
      toType: "",
    },
  });

  useEffect(() => {
    mapFieldErrors(serverError, setError as Parameters<typeof mapFieldErrors>[1]);
  }, [serverError, setError]);

  const amount = useWatch({ control, name: "amount" });
  useEffect(() => {
    const allocations = getValues("categoryAllocations");
    if (allocations.length === 1) {
      setValue("categoryAllocations", [{ ...allocations[0], amount }]);
    }
  }, [amount, getValues, setValue]);

  const installmentTotal = useWatch({ control, name: "installmentTotal" });
  const method = useWatch({ control, name: "method" });
  const fromType = useWatch({ control, name: "fromType" });
  const toType = useWatch({ control, name: "toType" });

  const isCredit = method === TXN_METHOD.Credit;

  const validToTypes = useMemo(() => {
    if (isCredit) {
      return toTypesFor(TXN_FROM_TYPE.Wallet);
    }

    return toTypesFor(fromType as (typeof TXN_FROM_TYPE)[keyof typeof TXN_FROM_TYPE]);
  }, [fromType, isCredit]);

  useEffect(() => {
    if (toType && !validToTypes.includes(toType as (typeof validToTypes)[number])) {
      setValue("toType", "");
      resetField("toId", { defaultValue: "" });
    }
  }, [resetField, setValue, toType, validToTypes]);

  useEffect(() => {
    resetField("fromId", { defaultValue: "" });
  }, [fromType, resetField]);

  useEffect(() => {
    resetField("toId", { defaultValue: "" });
  }, [toType, resetField]);

  const handleMethodChange = useCallback(
    (val: string) => {
      setValue("method", val);
      setValue("fromType", val === TXN_METHOD.Credit ? "wallet" : "");
      setValue("toType", "");
    },
    [setValue],
  );

  const showFromId = isCredit || (fromType !== "" && fromType !== "external");
  const showToId = toType !== "" && toType !== "external";

  const fromIdOptions = useMemo(() => {
    if (isCredit) return wallets.filter((wallet) => wallet.creditEnabled);
    if (fromType === "wallet") return wallets;
    if (fromType === "revenue") return revenues;

    return [];
  }, [fromType, isCredit, revenues, wallets]);

  const toIdOptions = useMemo(() => {
    if (toType === "wallet") return wallets;
    if (toType === "bill") return bills;

    return [];
  }, [bills, toType, wallets]);

  const processSubmit = useCallback(
    (values: FormValues) => {
      if (!values.date) {
        setError("date", { message: "Required" });
        return;
      }

      if (!isCredit && !values.fromType) {
        setError("fromType", { message: "Required" });
        return;
      }

      if (!values.toType) {
        setError("toType", { message: "Required" });
        return;
      }

      if (showFromId && !values.fromId) {
        setError("fromId", { message: "Required" });
        return;
      }

      if (showToId && !values.toId) {
        setError("toId", { message: "Required" });
        return;
      }

      const base = {
        amount: values.amount,
        date: values.date,
        description: values.description.trim(),
        categoryAllocations: values.categoryAllocations,
      };

      if (values.method === TXN_METHOD.Credit) {
        const payload: CreateCreditTransaction = {
          ...base,
          fromId: values.fromId,
          method: "credit",
          toType: values.toType as CreateCreditTransaction["toType"],
          ...(values.toId ? { toId: values.toId } : {}),
          ...(values.term ? { term: values.term } : {}),
          ...(values.installmentTotal && Number(values.installmentTotal) > 1
            ? { installmentTotal: Number(values.installmentTotal) }
            : {}),
        };
        onSubmit(payload);
      } else {
        const payload: CreateDebitTransaction = {
          ...base,
          fromType: values.fromType as CreateDebitTransaction["fromType"],
          method: "debit",
          toType: values.toType as CreateDebitTransaction["toType"],
          ...(values.fromId ? { fromId: values.fromId } : {}),
          ...(values.toId ? { toId: values.toId } : {}),
        };
        onSubmit(payload);
      }
    },
    [isCredit, onSubmit, setError, showFromId, showToId],
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
            {LABELS.create}
          </button>
        </>
      }
      onClose={onClose}
      title={LABELS.title}
    >
      <div className={styles.form}>
        <FormField label={LABELS.method}>
          <FilterSegment onChange={handleMethodChange} options={METHOD_OPTIONS} value={method} />
        </FormField>

        <div className={styles.row}>
          <FormField error={errors.amount?.message} label={LABELS.amount} required>
            <Controller
              control={control}
              name="amount"
              render={({ field }) => (
                <input
                  {...field}
                  aria-label={LABELS.amount}
                  className={form.input}
                  inputMode="decimal"
                  onChange={(event) => {
                    if (AMOUNT_INPUT_PATTERN.test(event.target.value)) {
                      field.onChange(event);
                    }
                  }}
                  placeholder="0.00"
                  type="text"
                />
              )}
              rules={{
                required: TEXT.required,
                validate: (value) =>
                  (AMOUNT_PATTERN.test(value) &&
                    Number.isFinite(Number(value)) &&
                    Number(value) > 0) ||
                  TEXT.invalidAmount,
              }}
            />
          </FormField>

          <FormField error={errors.date?.message} label={LABELS.date} required>
            <input className={form.input} type="date" {...register("date")} />
          </FormField>
        </div>

        {!isCredit && (
          <FormField error={errors.fromType?.message} label={LABELS.fromType} required>
            <select className={form.select} {...register("fromType")}>
              <option value="">{LABELS.placeholder}</option>
              {FROM_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FormField>
        )}

        {showFromId && (
          <FormField error={errors.fromId?.message} label={LABELS.from} required>
            <select className={form.select} {...register("fromId")}>
              <option value="">{LABELS.placeholder}</option>
              {fromIdOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </FormField>
        )}

        <FormField error={errors.toType?.message} label={LABELS.toType} required>
          <select className={form.select} {...register("toType")}>
            <option value="">{LABELS.placeholder}</option>
            {validToTypes.map((t) => (
              <option key={t} value={t}>
                {TO_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </FormField>

        {showToId && (
          <FormField error={errors.toId?.message} label={LABELS.to} required>
            <select className={form.select} {...register("toId")}>
              <option value="">{LABELS.placeholder}</option>
              {toIdOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </FormField>
        )}

        <Controller
          control={control}
          name="categoryAllocations"
          rules={{ validate: (items) => validateCategoryAllocations(items, getValues("amount")) }}
          render={({ field }) => (
            <CategoryAllocationFields
              categories={categories}
              compactSingleCategory
              error={errors.categoryAllocations?.message}
              onChange={field.onChange}
              total={amount}
              value={field.value}
            />
          )}
        />

        {categories.filter((cat) => !cat.archived).length === 0 && (
          <p role="status">{TEXT.noCategories}</p>
        )}

        <FormField error={errors.description?.message} label={LABELS.description} required>
          <input
            aria-label={LABELS.description}
            aria-required="true"
            className={form.input}
            placeholder=""
            type="text"
            {...register("description", {
              validate: (value) => value.trim().length > 0 || TEXT.required,
            })}
          />
        </FormField>

        {isCredit && Number(installmentTotal) > 1 && <p>{TEXT.installmentAmounts}</p>}
        {isCredit && (
          <div className={styles.row}>
            <FormField label={LABELS.term}>
              <input className={form.input} type="date" {...register("term")} />
            </FormField>

            <FormField label={LABELS.installments}>
              <input
                className={form.input}
                min="1"
                placeholder="1"
                type="number"
                {...register("installmentTotal")}
              />
            </FormField>
          </div>
        )}
      </div>
    </Modal>
  );
}
