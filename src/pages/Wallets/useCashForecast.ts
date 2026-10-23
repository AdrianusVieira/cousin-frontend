import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { api } from "@/lib/api/client";
import type { WalletForecastResponse } from "@/types/api";

export const FORECAST_OPTIONS = [
  { label: "30 days", value: "30" },
  { label: "60 days", value: "60" },
  { label: "90 days", value: "90" },
];

export function useCashForecast() {
  const [days, setDays] = useState("30");
  const query = useQuery({
    queryKey: ["wallets", "forecast", days],
    queryFn: () => api.get<WalletForecastResponse>("/wallets/forecast", { query: { days } }),
  });
  return { data: query.data, days, error: query.error, isLoading: query.isLoading, setDays };
}
