import { useCallback, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { INTERVAL_UNIT_OPTIONS } from "@/constants/intervals";
import { mapFieldErrors } from "@/lib/api/mapFieldErrors";

import { BackLink } from "@/components/BackLink";
import type { Column } from "@/components/DataTable";
import { DataTable } from "@/components/DataTable";
import { FormField } from "@/components/FormField";
import { Modal } from "@/components/Modal";
import { PageHead } from "@/components/PageHead";
import { Pill } from "@/components/Pill";
import { StatCard } from "@/components/StatCard";
import { VarianceChart } from "@/components/VarianceChart";
import { formatDateWithYear, formatMoney } from "@/lib/format";
import type { Bill, Recurrence, Revenue } from "@/types/api";

import form from "@/styles/form.module.css";

import styles from "./RecurrenceDetail.module.css";
import { useRecurrenceDetail } from "./useRecurrenceDetail";

const LABELS = {
  cancel: "Cancel",
  deactivate: "Deactivate",
  edit: "Edit config",
  estimatedValue: "Estimated Value",
  intervalUnit: "Interval unit",
  intervalValue: "Interval",
  loading: "Loading…",
  name: "Name",
  recurrentDay: "Recurrent day",
  recurrentMonth: "Recurrent month",
  save: "Save",
  status: "Status",
  term: "Term",
  title: "Edit Recurrence",
  type: "Type",
  value: "Value",
  variable: "Variable amount",
};

const TEXT = {
  no: "No",
  paid: "Paid",
  pending: "Pending",
  received: "Received",
  unpaid: "Unpaid",
  yes: "Yes",
};

type Instance = Bill | Revenue;

function isSettled(instance: Instance): boolean {
  return "paid" in instance ? instance.paid : instance.received;
}

function getInstanceColumns(type: "bill" | "revenue"): Column<Instance>[] {
  return [
    { header: LABELS.name, key: "name", render: (i) => i.name },
    { header: LABELS.term, key: "term", render: (i) => formatDateWithYear(i.term) },
    {
      header: LABELS.status,
      key: "status",
      render: (i) => isSettled(i)
        ? <Pill accent="revenue">{type === "bill" ? TEXT.paid : TEXT.received}</Pill>
        : <Pill accent="outcome">{type === "bill" ? TEXT.unpaid : TEXT.pending}</Pill>,
    },
    { align: "right", header: LABELS.value, key: "value", render: (i) => formatMoney(i.value) },
  ];
}

function EditModal({
  isSubmitting,
  onClose,
  onSubmit,
  recurrence,
  serverError,
}: {
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Pick<Recurrence, "intervalUnit" | "intervalValue" | "isVariable" | "recurrentDay" | "recurrentMonth">>) => void;
  recurrence: Recurrence;
  serverError?: unknown;
}) {
  const { control, handleSubmit, register, setError } = useForm({
    defaultValues: {
      intervalUnit: recurrence.intervalUnit,
      intervalValue: String(recurrence.intervalValue),
      isVariable: String(recurrence.isVariable),
      recurrentDay: String(recurrence.recurrentDay),
      recurrentMonth: recurrence.recurrentMonth ? String(recurrence.recurrentMonth) : "",
    },
  });

  useEffect(() => {
    mapFieldErrors(serverError, setError as Parameters<typeof mapFieldErrors>[1]);
  }, [serverError, setError]);

  const intervalUnit = useWatch({ control, name: "intervalUnit" });

  const processSubmit = useCallback(
    (values: { intervalUnit: string; intervalValue: string; isVariable: string; recurrentDay: string; recurrentMonth: string }) => {
      onSubmit({
        intervalUnit: values.intervalUnit as Recurrence["intervalUnit"],
        intervalValue: Number(values.intervalValue),
        isVariable: values.isVariable === "true",
        recurrentDay: Number(values.recurrentDay),
        ...(values.intervalUnit === "year" && values.recurrentMonth
          ? { recurrentMonth: Number(values.recurrentMonth) }
          : { recurrentMonth: null }),
      });
    },
    [onSubmit],
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
        <div className={styles.row}>
          <FormField label={LABELS.intervalUnit}>
            <select className={form.select} {...register("intervalUnit")}>
              {INTERVAL_UNIT_OPTIONS.map((u) => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
          </FormField>

          <FormField label={LABELS.intervalValue}>
            <input className={form.input} min="1" type="number" {...register("intervalValue")} />
          </FormField>
        </div>

        <div className={styles.row}>
          <FormField label={LABELS.recurrentDay}>
            <input className={form.input} max="31" min="1" type="number" {...register("recurrentDay")} />
          </FormField>

          {intervalUnit === "year" && (
            <FormField label={LABELS.recurrentMonth}>
              <input className={form.input} max="12" min="1" type="number" {...register("recurrentMonth")} />
            </FormField>
          )}
        </div>

        <FormField label={LABELS.variable}>
          <select className={form.select} {...register("isVariable")}>
            <option value="false">{TEXT.no}</option>
            <option value="true">{TEXT.yes}</option>
          </select>
        </FormField>
      </div>
    </Modal>
  );
}

export function RecurrenceDetail() {
  const navigate = useNavigate();

  const {
    editOpen,
    error,
    estimatedValueFormatted,
    instances,
    isLoading,
    isSubmitting,
    name,
    recurrence,
    type,
    typeLabel,
    variance,

    closeEdit,
    deactivate,
    editError,
    openEdit,
    submitEdit,
  } = useRecurrenceDetail();

  return (
    <>
      <BackLink label="Recurrences" to="/recurrences" />

      {error && <div className={styles.error}>! {error.message}</div>}

      {isLoading || !recurrence ? (
        <div className={styles.loading}>{LABELS.loading}</div>
      ) : (
        <>
          <PageHead
            actions={
              <>
                <button className={form.btnSecondary} onClick={openEdit} type="button">
                  {LABELS.edit}
                </button>
                <button className={form.btnSecondary} onClick={deactivate} type="button">
                  {LABELS.deactivate}
                </button>
              </>
            }
            title={name}
          />

          <div className={styles.statGrid}>
            <StatCard accent="net" label={LABELS.estimatedValue} value={estimatedValueFormatted} />
            <StatCard
              accent={typeLabel === "Bill" ? "outcome" : "revenue"}
              label={LABELS.type}
              value={typeLabel}
            />
          </div>

          <div className={styles.chartWrap}>
            <VarianceChart data={variance} />
          </div>

          <div className={styles.tableWrap}>
            <DataTable
              columns={getInstanceColumns(type)}
              keyExtractor={(i) => i.id}
              onRowClick={(i) => navigate(`/${type === "bill" ? "bills" : "revenues"}/${i.id}`)}
              rows={instances}
            />
          </div>
        </>
      )}

      {editOpen && recurrence && (
        <EditModal
          isSubmitting={isSubmitting}
          onClose={closeEdit}
          onSubmit={submitEdit}
          recurrence={recurrence}
          serverError={editError}
        />
      )}
    </>
  );
}
