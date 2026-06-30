import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";

import { mapFieldErrors } from "@/lib/api/mapFieldErrors";

import { BackLink } from "@/components/BackLink";
import { BalanceChart } from "@/components/BalanceChart";
import { FormField } from "@/components/FormField";
import { Modal } from "@/components/Modal";
import { PageHead } from "@/components/PageHead";
import { PeriodSelector } from "@/components/PeriodSelector";
import { StatCard } from "@/components/StatCard";
import { TransactionsTable } from "@/components/TransactionsTable";

import form from "@/styles/form.module.css";

import styles from "./WalletDetail.module.css";
import { useWalletDetail } from "./useWalletDetail";

const LABELS = {
  archive: "Archive",
  balance: "Balance",
  cancel: "Cancel",
  currentBalance: "Current Balance",
  description: "Description",
  edit: "Edit",
  loading: "Loading…",
  name: "Name",
  save: "Save",
  status: "Status",
  threeMonthAvg: "3-mo Average",
  title: "Edit Wallet",
  unarchive: "Unarchive",
};

function EditModal({
  isSubmitting,
  onClose,
  onSubmit,
  serverError,
  wallet,
}: {
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: { balance?: string; description?: string; name?: string }) => void;
  serverError?: unknown;
  wallet: { balance: string; description: string | null; name: string };
}) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = useForm({
    defaultValues: {
      balance: wallet.balance,
      description: wallet.description ?? "",
      name: wallet.name,
    },
  });

  useEffect(() => {
    mapFieldErrors(serverError, setError as Parameters<typeof mapFieldErrors>[1]);
  }, [serverError, setError]);

  const processSubmit = useCallback(
    (values: { balance: string; description: string; name: string }) => {
      if (!values.name.trim()) {
        setError("name", { message: "Required" });
        return;
      }

      const payload: Record<string, string> = {};
      if (values.name.trim() !== wallet.name) payload.name = values.name.trim();
      if (values.description.trim() !== (wallet.description ?? ""))
        payload.description = values.description.trim();
      if (values.balance !== wallet.balance) payload.balance = values.balance;

      if (Object.keys(payload).length > 0) onSubmit(payload);
      else onClose();
    },
    [onClose, onSubmit, setError, wallet],
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

        <FormField label={LABELS.description}>
          <input className={form.input} type="text" {...register("description")} />
        </FormField>

        <FormField label={LABELS.balance}>
          <input
            className={form.input}
            inputMode="decimal"
            step="0.01"
            type="number"
            {...register("balance")}
          />
        </FormField>
      </div>
    </Modal>
  );
}

export function WalletDetail() {
  const {
    balanceSeries,
    currentBalanceValue,
    editOpen,
    error,
    id,
    isArchived,
    isLoading,
    isSubmitting,
    period,
    periodLabel,
    statusValue,
    threeMonthAvgValue,
    wallet,

    archive,
    closeEdit,
    editError,
    openEdit,
    setPeriod,
    submitEdit,
    unarchive,
  } = useWalletDetail();

  return (
    <>
      <BackLink label="Wallets" to="/wallets" />

      {error && <div className={styles.error}>! {error.message}</div>}

      {isLoading || !wallet ? (
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
            title={wallet.name}
          />

          <div className={styles.statGrid}>
            <StatCard accent="net" label={LABELS.currentBalance} value={currentBalanceValue} />
            <StatCard accent="revenue" label={LABELS.threeMonthAvg} value={threeMonthAvgValue} />
            <StatCard accent={isArchived ? "outcome" : "revenue"} label={LABELS.status} value={statusValue} />
          </div>

          <div className={styles.chartWrap}>
            <BalanceChart data={balanceSeries} />
          </div>

          <div className={styles.tableWrap}>
            <TransactionsTable from={period.from} to={period.to} wallet={id} />
          </div>
        </>
      )}

      {editOpen && wallet && (
        <EditModal
          isSubmitting={isSubmitting}
          onClose={closeEdit}
          onSubmit={submitEdit}
          serverError={editError}
          wallet={wallet}
        />
      )}
    </>
  );
}
