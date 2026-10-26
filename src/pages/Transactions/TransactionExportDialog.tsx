import { Modal } from "@/components/Modal";
import type { Period } from "@/lib/period";
import { REPORT_FORMAT, type ReportFormat } from "@/lib/transactionReport";
import form from "@/styles/form.module.css";

import styles from "./Transactions.module.css";
import { useTransactionExport } from "./useTransactionExport";

const LABELS = {
  cancel: "Cancel",
  csv: "CSV (.csv)",
  download: "Download report",
  exporting: "Exporting…",
  format: "File format",
  from: "Start date",
  markdown: "Markdown (.md)",
  title: "Export report",
  to: "End date",
};
const TEXT = {
  help: "Export all transactions between these dates, inclusive, using purchase/movement dates. Table filters and row selection do not limit the export.",
  progress: "Fetching all transactions in this period…",
};

interface Props {
  initialPeriod: Period;
  onClose: () => void;
}

export function TransactionExportDialog({ initialPeriod, onClose }: Props) {
  const {
    error,
    format,
    formId,
    from,
    isExporting,
    rangeError,
    to,
    setFormat,
    setFrom,
    setTo,
    submit,
  } = useTransactionExport(initialPeriod, onClose);

  return (
    <Modal
      footer={
        <>
          <button className={form.btnSecondary} onClick={onClose} type="button">
            {LABELS.cancel}
          </button>
          <button
            className={form.btnPrimary}
            disabled={isExporting || !!rangeError}
            form={formId}
            type="submit"
          >
            {isExporting ? LABELS.exporting : LABELS.download}
          </button>
        </>
      }
      onClose={onClose}
      title={LABELS.title}
    >
      <form aria-busy={isExporting} className={form.form} id={formId} onSubmit={submit}>
        <p className={styles.confirmText}>{TEXT.help}</p>
        <label className={styles.exportField}>
          {LABELS.from}
          <input
            className={form.input}
            disabled={isExporting}
            onChange={(event) => setFrom(event.target.value)}
            required
            type="date"
            value={from}
          />
        </label>
        <label className={styles.exportField}>
          {LABELS.to}
          <input
            className={form.input}
            disabled={isExporting}
            min={from}
            onChange={(event) => setTo(event.target.value)}
            required
            type="date"
            value={to}
          />
        </label>
        <label className={styles.exportField}>
          {LABELS.format}
          <select
            className={form.select}
            disabled={isExporting}
            onChange={(event) => setFormat(event.target.value as ReportFormat)}
            value={format}
          >
            <option value={REPORT_FORMAT.Csv}>{LABELS.csv}</option>
            <option value={REPORT_FORMAT.Markdown}>{LABELS.markdown}</option>
          </select>
        </label>
        {rangeError && (
          <p className={styles.error} role="alert">
            {rangeError}
          </p>
        )}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        {isExporting && <p role="status">{TEXT.progress}</p>}
      </form>
    </Modal>
  );
}
