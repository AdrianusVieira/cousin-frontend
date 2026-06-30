import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { api } from "@/lib/api/client";
import { formatMoney } from "@/lib/format";
import { formatPeriodLabel, PERIOD_PRESET, usePeriod } from "@/lib/period";
import type { Bill, BillListResponse, CreateBill, SourceListResponse } from "@/types/api";

const STATUS_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Unpaid", value: "unpaid" },
  { label: "Paid", value: "paid" },
  { label: "Overdue", value: "overdue" },
] as const;

const TEXT = {
  empty: "—",
};

export function useBills() {
  const queryClient = useQueryClient();
  const { period, setPeriod } = usePeriod(PERIOD_PRESET.Last3Months);
  const [searchParams, setSearchParams] = useSearchParams();
  const [formOpen, setFormOpen] = useState(false);

  const status = searchParams.get("status") ?? "all";

  const setStatus = useCallback(
    (next: string) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (next === "all") {
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
    queryFn: () =>
      api.get<BillListResponse>("/bills", {
        query: {
          from: period.from,
          status,
          to: period.to,
        },
      }),
    queryKey: ["bills", period.from, period.to, status],
  });

  const sourcesQuery = useQuery({
    enabled: formOpen,
    queryFn: () => api.get<SourceListResponse>("/sources"),
    queryKey: ["sources", "all"],
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateBill) => api.post<Bill>("/bills", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["recurrences"] });
      setFormOpen(false);
    },
  });

  const data = query.data;

  return {
    // data
    createError: createMutation.error,
    error: query.error,
    formOpen,
    isLoading: query.isLoading,
    isSubmitting: createMutation.isPending,
    items: data?.items ?? [],
    overdueValue: data ? formatMoney(data.summary.overdue) : TEXT.empty,
    period,
    periodLabel: formatPeriodLabel(period),
    sources: sourcesQuery.data?.items ?? [],
    status,
    statusOptions: STATUS_OPTIONS,
    totalBilledValue: data ? formatMoney(data.summary.totalBilled) : TEXT.empty,
    totalPaidValue: data ? formatMoney(data.summary.totalPaid) : TEXT.empty,
    totalUnpaidValue: data ? formatMoney(data.summary.totalUnpaid) : TEXT.empty,

    // handlers
    closeForm: useCallback(() => setFormOpen(false), []),
    createBill: createMutation.mutate,
    openForm: useCallback(() => setFormOpen(true), []),
    setPeriod,
    setStatus,
  };
}
