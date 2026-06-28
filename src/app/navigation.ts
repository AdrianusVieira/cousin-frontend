/** Route paths and the grouped sidebar nav (ui-spec.md §0.1). Detail routes are not nav items. */

export const ROUTES = {
  bill: (id = ":id") => `/bills/${id}`,
  bills: "/bills",
  categories: "/categories",
  category: (id = ":id") => `/categories/${id}`,
  credit: "/credit",
  dashboard: "/",
  recurrence: (id = ":id") => `/recurrences/${id}`,
  recurrences: "/recurrences",
  revenue: (id = ":id") => `/revenues/${id}`,
  revenues: "/revenues",
  source: (id = ":id") => `/sources/${id}`,
  sources: "/sources",
  transactions: "/transactions",
  wallet: (id = ":id") => `/wallets/${id}`,
  wallets: "/wallets",
} as const;

export interface NavItem {
  label: string;
  to: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", to: ROUTES.dashboard }],
  },
  {
    title: "Money",
    items: [
      { label: "Transactions", to: ROUTES.transactions },
      { label: "Credit", to: ROUTES.credit },
    ],
  },
  {
    title: "Ledger",
    items: [
      { label: "Bills", to: ROUTES.bills },
      { label: "Revenues", to: ROUTES.revenues },
      { label: "Recurrences", to: ROUTES.recurrences },
    ],
  },
  {
    title: "Structure",
    items: [
      { label: "Wallets", to: ROUTES.wallets },
      { label: "Sources", to: ROUTES.sources },
      { label: "Categories", to: ROUTES.categories },
    ],
  },
];
