import type { StatAccent } from "@/components/StatCard";
import type { Column } from "@/components/DataTable";
import { DataTable } from "@/components/DataTable";
import { FormField } from "@/components/FormField";
import { Modal } from "@/components/Modal";
import { Pill } from "@/components/Pill";
import { formatDate, formatMoney } from "@/lib/format";

import form from "@/styles/form.module.css";

import type { PreviewRow, PreviewRowStatus } from "./useImportTransactions";
import { useImportTransactions } from "./useImportTransactions";
import styles from "./ImportCsvModal.module.css";

const LABELS = {
  amount: "Amount",
  cancel: "Cancel",
  close: "Close",
  confirm: "Confirm import",
  date: "Date",
  description: "Description",
  file: "CSV file",
  status: "Status",
  term: "Statement due date",
  title: "Import CSV (Fatura)",
  wallet: "Card (wallet)",
};

const TEXT = {
  duplicateSkip: "Duplicate — skipped",
  empty: "—",
  imported: "Imported",
  negativeAmount: "Skipped — not a purchase",
  negativeSkip: "Skipped — not a purchase",
  noWallets: "No wallets available",
  parseError: "Parse error",
  selectWallet: "Select a wallet…",
  willImport: "Will import",
};

const STATUS_ACCENT: Record<PreviewRowStatus, StatAccent> = {
  candidate: "net",
  duplicateSkip: "net",
  negativeSkip: "net",
  parseError: "outcome",
  willImport: "revenue",
};

const STATUS_LABEL: Record<PreviewRowStatus, string> = {
  candidate: TEXT.willImport,
  duplicateSkip: TEXT.duplicateSkip,
  negativeSkip: TEXT.negativeSkip,
  parseError: TEXT.parseError,
  willImport: TEXT.willImport,
};

const OUTCOME_ACCENT: Record<"imported" | "duplicate" | "negativeAmount", StatAccent> = {
  duplicate: "net",
  imported: "revenue",
  negativeAmount: "net",
};

const OUTCOME_LABEL: Record<"imported" | "duplicate" | "negativeAmount", string> = {
  duplicate: TEXT.duplicateSkip,
  imported: TEXT.imported,
  negativeAmount: TEXT.negativeAmount,
};

function buildColumns(): Column<PreviewRow>[] {
  return [
    {
      header: LABELS.date,
      key: "date",
      render: (row) => (row.date ? formatDate(row.date) : TEXT.empty),
    },
    {
      header: LABELS.description,
      key: "description",
      render: (row) => row.description ?? TEXT.empty,
    },
    {
      align: "right",
      header: LABELS.amount,
      key: "amount",
      render: (row) => (row.amount ? formatMoney(row.amount) : TEXT.empty),
    },
    {
      header: LABELS.status,
      key: "status",
      render: (row) => {
        if (row.outcome) {
          return <Pill accent={OUTCOME_ACCENT[row.outcome]}>{OUTCOME_LABEL[row.outcome]}</Pill>;
        }

        return (
          <Pill accent={STATUS_ACCENT[row.previewStatus]}>{STATUS_LABEL[row.previewStatus]}</Pill>
        );
      },
    },
  ];
}

const columns = buildColumns();

interface ImportCsvModalProps {
  onClose: () => void;
}

export function ImportCsvModal({ onClose }: ImportCsvModalProps) {
  const {
    canConfirm,
    file,
    isConfirming,
    parseError,
    previewRows,
    result,
    term,
    walletId,
    wallets,

    confirm,
    handleFileChange,
    setTerm,
    setWalletId,
  } = useImportTransactions();

  return (
    <Modal
      footer={
        result ? (
          <button className={form.btnPrimary} onClick={onClose} type="button">
            {LABELS.close}
          </button>
        ) : (
          <>
            <button className={form.btnSecondary} onClick={onClose} type="button">
              {LABELS.cancel}
            </button>
            <button
              className={form.btnPrimary}
              disabled={!canConfirm || isConfirming}
              onClick={() => confirm()}
              type="button"
            >
              {LABELS.confirm}
            </button>
          </>
        )
      }
      onClose={onClose}
      title={LABELS.title}
    >
      <div className={styles.form}>
        <div className={styles.row}>
          <FormField label={LABELS.file}>
            <input
              accept=".csv"
              className={form.input}
              onChange={(e) => {
                const next = e.target.files?.[0];
                if (next) void handleFileChange(next);
              }}
              type="file"
            />
          </FormField>

          <FormField label={LABELS.wallet}>
            <select
              className={form.select}
              onChange={(e) => setWalletId(e.target.value)}
              value={walletId}
            >
              <option value="">{wallets.length === 0 ? TEXT.noWallets : TEXT.selectWallet}</option>
              {wallets.map((wallet) => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label={LABELS.term}>
            <input
              className={form.input}
              onChange={(e) => setTerm(e.target.value)}
              type="date"
              value={term}
            />
          </FormField>
        </div>

        {parseError && <p className={styles.error}>! {parseError}</p>}

        {file && previewRows.length > 0 && (
          <div className={styles.tableWrap}>
            <DataTable columns={columns} keyExtractor={(row) => String(row.index)} rows={previewRows} />
          </div>
        )}

        {result && (
          <p className={styles.summary}>
            Imported {result.summary.importedCount}, skipped {result.summary.skippedCount} of{" "}
            {result.summary.totalRows} rows.
          </p>
        )}
      </div>
    </Modal>
  );
}
