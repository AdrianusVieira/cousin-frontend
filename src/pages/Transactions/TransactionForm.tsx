import { useCallback, useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";

import { mapFieldErrors } from "@/lib/api/mapFieldErrors";

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
  category: "Category",
  create: "Create transaction",
  date: "Date",
  description: "Description",
  from: "From",
  fromType: "From type",
  installments: "Installments",
  method: "Method",
  none: "None",
  term: "Term",
  title: "New Transaction",
  to: "To",
  toType: "To type",
};

const METHOD_OPTIONS = [
  { label: "Debit", value: "debit" },
  { label: "Credit", value: "credit" },
];

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
  categoryId: string;
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

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-15`;
}

export function TransactionForm({
  bills,
  categories,
  isSubmitting,
  onClose,
  onSubmit,
  revenues,
  serverError,
  wallets,
}: TransactionFormProps) {
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    resetField,
    setError,
    setValue,
  } = useForm<FormValues>({
    defaultValues: {
      amount: "",
      categoryId: "",
      date: todayISO(),
      description: "",
      fromId: "",
      fromType: "external",
      installmentTotal: "",
      method: "debit",
      term: defaultTerm(),
      toId: "",
      toType: "wallet",
    },
  });

  useEffect(() => {
    mapFieldErrors(serverError, setError as Parameters<typeof mapFieldErrors>[1]);
  }, [serverError, setError]);

  const method = useWatch({ control, name: "method" });
  const fromType = useWatch({ control, name: "fromType" });
  const toType = useWatch({ control, name: "toType" });

  const isCredit = method === TXN_METHOD.Credit;

  const validToTypes = useMemo(() => {
    if (isCredit) {
      return toTypesFor(TXN_FROM_TYPE.Wallet);
    }

    return toTypesFor(fromType as typeof TXN_FROM_TYPE[keyof typeof TXN_FROM_TYPE]);
  }, [fromType, isCredit]);

  useEffect(() => {
    if (!validToTypes.includes(toType as typeof validToTypes[number])) {
      setValue("toType", validToTypes[0]);
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
      if (val === TXN_METHOD.Credit) {
        setValue("fromType", "wallet");
      }
    },
    [setValue],
  );

  const showFromId = isCredit || fromType !== "external";
  const showToId = toType !== "external";

  const fromIdOptions = useMemo(() => {
    if (isCredit || fromType === "wallet") return wallets;
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
      if (!values.amount || Number(values.amount) <= 0) {
        setError("amount", { message: "Required" });
        return;
      }

      if (!values.date) {
        setError("date", { message: "Required" });
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
        ...(values.categoryId ? { categoryId: values.categoryId } : {}),
        ...(values.description ? { description: values.description } : {}),
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
    [onSubmit, setError, showFromId, showToId],
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
          <FilterSegment
            onChange={handleMethodChange}
            options={METHOD_OPTIONS}
            value={method}
          />
        </FormField>

        <div className={styles.row}>
          <FormField error={errors.amount?.message} label={LABELS.amount} required>
            <input
              className={form.input}
              inputMode="decimal"
              placeholder="0.00"
              step="0.01"
              type="number"
              {...register("amount")}
            />
          </FormField>

          <FormField error={errors.date?.message} label={LABELS.date} required>
            <input className={form.input} type="date" {...register("date")} />
          </FormField>
        </div>

        {!isCredit && (
          <FormField label={LABELS.fromType}>
            <select className={form.select} {...register("fromType")}>
              {FROM_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </FormField>
        )}

        {showFromId && (
          <FormField error={errors.fromId?.message} label={LABELS.from} required>
            <select className={form.select} {...register("fromId")}>
              <option value="">{LABELS.none}</option>
              {fromIdOptions.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </FormField>
        )}

        <FormField label={LABELS.toType}>
          <select className={form.select} {...register("toType")}>
            {validToTypes.map((t) => (
              <option key={t} value={t}>{TO_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </FormField>

        {showToId && (
          <FormField error={errors.toId?.message} label={LABELS.to} required>
            <select className={form.select} {...register("toId")}>
              <option value="">{LABELS.none}</option>
              {toIdOptions.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </FormField>
        )}

        <FormField label={LABELS.category}>
          <select className={form.select} {...register("categoryId")}>
            <option value="">{LABELS.none}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </FormField>

        <FormField label={LABELS.description}>
          <input
            className={form.input}
            placeholder=""
            type="text"
            {...register("description")}
          />
        </FormField>

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
