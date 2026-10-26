import { useEffect, useId, useRef, useState, type FormEvent } from "react";

import type { Period } from "@/lib/period";
import {
  downloadTransactionReport,
  fetchTransactionReport,
  REPORT_FORMAT,
  type ReportFormat,
  validateReportPeriod,
} from "@/lib/transactionReport";

const TEXT = { failed: "Could not export transactions. Please try again." };

export function useTransactionExport(initialPeriod: Period, onClose: () => void) {
  const [from, setFrom] = useState(initialPeriod.from);
  const [to, setTo] = useState(initialPeriod.to);
  const [format, setFormat] = useState<ReportFormat>(REPORT_FORMAT.Csv);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const formId = useId();
  const rangeError = validateReportPeriod({ from, to });

  useEffect(() => () => controllerRef.current?.abort(), []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (rangeError || controllerRef.current) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    setIsExporting(true);
    setError(null);
    try {
      const period = { from, to };
      const report = await fetchTransactionReport(period, controller.signal);
      controller.signal.throwIfAborted();
      downloadTransactionReport(report, period, format);
      onClose();
    } catch (cause) {
      if (!controller.signal.aborted)
        setError(cause instanceof Error ? cause.message : TEXT.failed);
    } finally {
      if (!controller.signal.aborted) {
        controllerRef.current = null;
        setIsExporting(false);
      }
    }
  };

  return {
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
  };
}
