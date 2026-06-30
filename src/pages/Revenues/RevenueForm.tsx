import { useCallback, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { INTERVAL_UNIT_OPTIONS } from "@/constants/intervals";
import { mapFieldErrors } from "@/lib/api/mapFieldErrors";

import { FormField } from "@/components/FormField";
import { Modal } from "@/components/Modal";
import type { CreateRevenue, Source } from "@/types/api";

import form from "@/styles/form.module.css";

import styles from "./RevenueForm.module.css";

const LABELS = {
  cancel: "Cancel",
  create: "Create revenue",
  description: "Description",
  intervalUnit: "Interval unit",
  intervalValue: "Interval",
  name: "Name",
  recurrence: "Recurring",
  recurrentDay: "Recurrent day",
  recurrentMonth: "Recurrent month",
  source: "Source",
  term: "Term",
  title: "New Revenue",
  value: "Value",
  variable: "Variable amount",
};

const TEXT = {
  no: "No",
  none: "None",
  yes: "Yes",
};

interface FormValues {
  description: string;
  intervalUnit: string;
  intervalValue: string;
  isVariable: string;
  name: string;
  recurrentDay: string;
  recurrentMonth: string;
  sourceId: string;
  term: string;
  value: string;
}

interface RevenueFormProps {
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRevenue) => void;
  serverError?: unknown;
  sources: Source[];
}

export function RevenueForm({ isSubmitting, onClose, onSubmit, serverError, sources }: RevenueFormProps) {
  const [recurring, setRecurring] = useState(false);

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = useForm<FormValues>({
    defaultValues: {
      description: "",
      intervalUnit: "month",
      intervalValue: "1",
      isVariable: "false",
      name: "",
      recurrentDay: "1",
      recurrentMonth: "",
      sourceId: "",
      term: "",
      value: "",
    },
  });

  useEffect(() => {
    mapFieldErrors(serverError, setError as Parameters<typeof mapFieldErrors>[1]);
  }, [serverError, setError]);

  const intervalUnit = useWatch({ control, name: "intervalUnit" });

  const processSubmit = useCallback(
    (values: FormValues) => {
      if (!values.name.trim()) { setError("name", { message: "Required" }); return; }
      if (!values.value || Number(values.value) <= 0) { setError("value", { message: "Required" }); return; }
      if (!values.term) { setError("term", { message: "Required" }); return; }
      if (!values.sourceId) { setError("sourceId", { message: "Required" }); return; }

      const payload: CreateRevenue = {
        name: values.name.trim(),
        sourceId: values.sourceId,
        term: values.term,
        value: values.value,
        ...(values.description.trim() ? { description: values.description.trim() } : {}),
      };

      if (recurring) {
        payload.recurrence = {
          intervalUnit: values.intervalUnit as NonNullable<CreateRevenue["recurrence"]>["intervalUnit"],
          intervalValue: Number(values.intervalValue),
          isVariable: values.isVariable === "true",
          recurrentDay: Number(values.recurrentDay),
          ...(values.intervalUnit === "year" && values.recurrentMonth
            ? { recurrentMonth: Number(values.recurrentMonth) }
            : {}),
        };
      }

      onSubmit(payload);
    },
    [onSubmit, recurring, setError],
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
        <FormField error={errors.name?.message} label={LABELS.name} required>
          <input className={form.input} type="text" {...register("name")} />
        </FormField>

        <div className={styles.row}>
          <FormField error={errors.value?.message} label={LABELS.value} required>
            <input
              className={form.input}
              inputMode="decimal"
              placeholder="0.00"
              step="0.01"
              type="number"
              {...register("value")}
            />
          </FormField>

          <FormField error={errors.term?.message} label={LABELS.term} required>
            <input className={form.input} type="date" {...register("term")} />
          </FormField>
        </div>

        <FormField error={errors.sourceId?.message} label={LABELS.source} required>
          <select className={form.select} {...register("sourceId")}>
            <option value="">{TEXT.none}</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </FormField>

        <FormField label={LABELS.description}>
          <input className={form.input} type="text" {...register("description")} />
        </FormField>

        <FormField label={LABELS.recurrence}>
          <select
            className={form.select}
            onChange={(e) => setRecurring(e.target.value === "true")}
            value={String(recurring)}
          >
            <option value="false">{TEXT.no}</option>
            <option value="true">{TEXT.yes}</option>
          </select>
        </FormField>

        {recurring && (
          <>
            <div className={styles.row}>
              <FormField label={LABELS.intervalUnit}>
                <select className={form.select} {...register("intervalUnit")}>
                  {INTERVAL_UNIT_OPTIONS.map((u) => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
              </FormField>

              <FormField label={LABELS.intervalValue}>
                <input
                  className={form.input}
                  min="1"
                  type="number"
                  {...register("intervalValue")}
                />
              </FormField>
            </div>

            <div className={styles.row}>
              <FormField label={LABELS.recurrentDay}>
                <input
                  className={form.input}
                  max="31"
                  min="1"
                  type="number"
                  {...register("recurrentDay")}
                />
              </FormField>

              {intervalUnit === "year" && (
                <FormField label={LABELS.recurrentMonth}>
                  <input
                    className={form.input}
                    max="12"
                    min="1"
                    type="number"
                    {...register("recurrentMonth")}
                  />
                </FormField>
              )}
            </div>

            <FormField label={LABELS.variable}>
              <select className={form.select} {...register("isVariable")}>
                <option value="false">{TEXT.no}</option>
                <option value="true">{TEXT.yes}</option>
              </select>
            </FormField>
          </>
        )}
      </div>
    </Modal>
  );
}
