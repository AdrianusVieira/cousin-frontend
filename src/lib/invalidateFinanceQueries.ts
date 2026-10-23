import type { QueryClient } from "@tanstack/react-query";

const FINANCE_KEYS = [
  "transactions",
  "dashboard",
  "wallets",
  "wallet",
  "categories",
  "category",
  "credit",
  "bills",
  "bill",
  "revenues",
  "revenue",
  "meta",
];

export function invalidateFinanceQueries(client: QueryClient) {
  return Promise.all(FINANCE_KEYS.map((key) => client.invalidateQueries({ queryKey: [key] })));
}
