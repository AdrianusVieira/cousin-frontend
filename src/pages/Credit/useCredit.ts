import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { api } from "@/lib/api/client";
import { formatMoney } from "@/lib/format";
import type { CreditResponse, Transaction } from "@/types/api";

import type { CreditHistoryPoint, CreditHistoryWallet } from "./CreditHistoryChart";

const STATUS_OPTIONS = [
  { label: "Unsettled", value: "unsettled" },
  { label: "Settled", value: "settled" },
  { label: "All", value: "all" },
] as const;

// Credit always leaves a wallet, but the transaction model allows an external source —
// those statements are bucketed here instead of vanishing from the chart.
const EXTERNAL_WALLET_ID = "external";

const LABELS = {
  externalWallet: "External",
};

const TEXT = {
  empty: "â€”",
};

/**
 * Per-wallet pending totals, largest first. Mirrors the backend's `summary.pendingCredit`:
 * a statement counts in full until every transaction in it is settled.
 */
function toPendingCredit(groups: CreditResponse["groups"]) {
  const totals = new Map<string, { total: number; walletId: string; walletName: string }>();

  for (const group of groups) {
    if (group.settled) continue;

    const walletId = group.walletId || EXTERNAL_WALLET_ID;
    const entry = totals.get(walletId) ?? {
      total: 0,
      walletId,
      walletName: group.walletName || LABELS.externalWallet,
    };

    entry.total += Number(group.total);
    totals.set(walletId, entry);
  }

  const sorted = [...totals.values()].sort((a, b) => b.total - a.total);

  return {
    perWallet: sorted.map(({ total, walletId, walletName }) => ({
      total: total.toFixed(2),
      walletId,
      walletName,
    })),
    total: sorted.reduce((sum, entry) => sum + entry.total, 0).toFixed(2),
  };
}

/** Pivot statement groups into one row per term with a total column per wallet. */
function toHistory(groups: CreditResponse["groups"]) {
  const wallets = new Map<string, CreditHistoryWallet>();
  const totalsByTerm = new Map<string, Map<string, number>>();

  for (const group of groups) {
    const id = group.walletId || EXTERNAL_WALLET_ID;
    wallets.set(id, { id, name: group.walletName || LABELS.externalWallet });

    const totals = totalsByTerm.get(group.term) ?? new Map<string, number>();
    totals.set(id, (totals.get(id) ?? 0) + Number(group.total));
    totalsByTerm.set(group.term, totals);
  }

  const sortedWallets = [...wallets.values()].sort((a, b) => a.name.localeCompare(b.name));

  const points: CreditHistoryPoint[] = [...totalsByTerm.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([term, totals]) => {
      const point: CreditHistoryPoint = { term };
      for (const wallet of sortedWallets) {
        point[wallet.id] = totals.get(wallet.id) ?? 0;
      }

      return point;
    });

  return { points, wallets: sortedWallets };
}

export function useCredit() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [settlingGroupKey, setSettlingGroupKey] = useState<string | null>(null);

  const status = searchParams.get("status") ?? "unsettled";

  const setStatus = useCallback(
    (next: string) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (next === "unsettled") {
          params.delete("status");
        } else {
          params.set("status", next);
        }
        return params;
      }, { replace: true });
    },
    [setSearchParams],
  );

  const query = useQuery({
    queryFn: () => api.get<CreditResponse>("/credit", { query: { status } }),
    queryKey: ["credit", status],
  });

  // The chart always spans the whole history, independent of the status filter. When the
  // filter is already "all" this shares a cache entry with the query above.
  const historyQuery = useQuery({
    queryFn: () => api.get<CreditResponse>("/credit", { query: { status: "all" } }),
    queryKey: ["credit", "all"],
  });

  const historyGroups = historyQuery.data?.groups;
  const history = useMemo(() => toHistory(historyGroups ?? []), [historyGroups]);
  const pendingCredit = useMemo(() => toPendingCredit(historyGroups ?? []), [historyGroups]);

  const settleMutation = useMutation({
    mutationFn: (transactionIds: string[]) =>
      api.post<Transaction[]>("/credit/settle", { transactionIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setSettlingGroupKey(null);
    },
  });

  const data = query.data;
  const groups = [...(data?.groups ?? [])].sort((a, b) => b.term.localeCompare(a.term));

  return {
    // data
    error: query.error,
    groups,
    historyPoints: history.points,
    historyWallets: history.wallets,
    isLoading: query.isLoading,
    isSettling: settleMutation.isPending,
    openStatementsValue: data ? String(data.summary.openStatements) : TEXT.empty,
    pendingCreditPerWallet: pendingCredit.perWallet,
    pendingCreditTotal: pendingCredit.total,
    settledInPeriodValue: data ? formatMoney(data.summary.settledInPeriod) : TEXT.empty,
    settlingGroupKey,
    status,
    statusOptions: STATUS_OPTIONS,

    // handlers
    cancelSettle: useCallback(() => setSettlingGroupKey(null), []),
    confirmSettle: settleMutation.mutate,
    requestSettle: setSettlingGroupKey,
    setStatus,
    settleRow: useCallback(
      (txnId: string) => settleMutation.mutate([txnId]),
      [settleMutation],
    ),
  };
}
