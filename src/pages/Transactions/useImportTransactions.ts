import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

import { api } from "@/lib/api/client";
import { parseInterFaturaRows, readInterFaturaCsv, type ParsedFaturaRow } from "@/lib/import/interFatura";
import type {
  ImportTransactionRow,
  ImportTransactionsResponse,
  SkippedImportReason,
  TransactionListResponse,
  WalletListResponse,
} from "@/types/api";

const MAX_DEDUP_PAGES = 10; // a few months of one wallet's credit history won't exceed this

export type PreviewRowStatus = ParsedFaturaRow["status"] | "duplicateSkip" | "willImport";

export interface PreviewRow extends ParsedFaturaRow {
  outcome?: "imported" | SkippedImportReason; // set once the import has been confirmed
  previewStatus: PreviewRowStatus;
}

function normalizeDescription(description: string | null | undefined): string {
  return (description ?? "").trim().replace(/\s+/g, " ");
}

function dedupKey(date: string, description: string | null | undefined, amount: string): string {
  return `${date}|${normalizeDescription(description)}|${amount}`;
}

export function useImportTransactions() {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedFaturaRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportTransactionsResponse | null>(null);
  const [term, setTerm] = useState("");
  const [walletId, setWalletId] = useState("");

  const walletsQuery = useQuery({
    queryFn: () => api.get<WalletListResponse>("/wallets", { query: { active: true } }),
    queryKey: ["wallets", "active"],
  });

  const candidateDates = useMemo(
    () => parsedRows.map((r) => r.date).filter((d): d is string => d !== null),
    [parsedRows],
  );
  const fromDate = candidateDates.length > 0 ? candidateDates.reduce((a, b) => (a < b ? a : b)) : undefined;
  const toDate = candidateDates.length > 0 ? candidateDates.reduce((a, b) => (a > b ? a : b)) : undefined;

  const dedupQuery = useQuery({
    enabled: !!walletId && candidateDates.length > 0,
    queryFn: async () => {
      const items: TransactionListResponse["items"] = [];
      let cursor: string | undefined;

      for (let page = 0; page < MAX_DEDUP_PAGES; page++) {
        const res = await api.get<TransactionListResponse>("/transactions", {
          query: { cursor, from: fromDate, limit: 200, method: "credit", to: toDate, wallet: walletId },
        });
        items.push(...res.items);
        if (!res.nextCursor) break;
        cursor = res.nextCursor;
      }

      return items;
    },
    queryKey: ["transactions", "import-dedup", walletId, fromDate, toDate],
  });

  const previewRows: PreviewRow[] = useMemo(() => {
    const existingKeys = new Set(
      (dedupQuery.data ?? []).map((t) => dedupKey(t.date, t.description, t.amount)),
    );
    const seenInBatch = new Set<string>();

    return parsedRows.map((row) => {
      if (row.status !== "candidate") {
        return { ...row, previewStatus: row.status };
      }

      const key = dedupKey(row.date!, row.description, row.amount!);
      const isDuplicate = existingKeys.has(key) || seenInBatch.has(key);
      seenInBatch.add(key);

      return { ...row, previewStatus: isDuplicate ? "duplicateSkip" : "willImport" };
    });
  }, [parsedRows, dedupQuery.data]);

  const wireIndexToPreviewIndex = useMemo(
    () =>
      previewRows.reduce<number[]>((acc, row, i) => {
        if (row.status !== "parseError") acc.push(i);
        return acc;
      }, []),
    [previewRows],
  );

  const canConfirm =
    !!term && !!walletId && wireIndexToPreviewIndex.length > 0 && !result && !dedupQuery.isFetching;

  const importMutation = useMutation({
    mutationFn: () => {
      const rows: ImportTransactionRow[] = wireIndexToPreviewIndex.map((previewIdx) => {
        const row = previewRows[previewIdx]!;
        return {
          amount: row.amount!,
          date: row.date!,
          ...(row.description ? { description: row.description } : {}),
          ...(row.installmentNumber !== undefined ? { installmentNumber: row.installmentNumber } : {}),
          ...(row.installmentTotal !== undefined ? { installmentTotal: row.installmentTotal } : {}),
        };
      });

      return api.post<ImportTransactionsResponse>("/transactions/import", { rows, term, walletId });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["credit"] });
      setResult(data);
    },
  });

  const resultRows: PreviewRow[] = useMemo(() => {
    if (!result) return previewRows;

    const skippedByWireIndex = new Map(result.skipped.map((s) => [s.index, s.reason]));

    return previewRows.map((row, i) => {
      const wireIndex = wireIndexToPreviewIndex.indexOf(i);
      if (wireIndex === -1) return row;

      const reason = skippedByWireIndex.get(wireIndex);
      return { ...row, outcome: reason ?? "imported" };
    });
  }, [previewRows, result, wireIndexToPreviewIndex]);

  const handleFileChange = useCallback(async (nextFile: File) => {
    setFile(nextFile);
    setResult(null);
    setParseError(null);

    try {
      const rawRows = await readInterFaturaCsv(nextFile);
      setParsedRows(parseInterFaturaRows(rawRows));
    } catch {
      setParsedRows([]);
      setParseError("Could not read this file as CSV.");
    }
  }, []);

  const reset = useCallback(() => {
    setFile(null);
    setParsedRows([]);
    setParseError(null);
    setResult(null);
    setTerm("");
    setWalletId("");
  }, []);

  return {
    // data
    canConfirm,
    file,
    isConfirming: importMutation.isPending,
    parseError,
    previewRows: resultRows,
    result,
    term,
    walletId,
    wallets: walletsQuery.data?.items ?? [],

    // handlers
    confirm: importMutation.mutate,
    handleFileChange,
    reset,
    setTerm,
    setWalletId,
  };
}
