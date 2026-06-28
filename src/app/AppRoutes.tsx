import { Route, Routes } from "react-router-dom";

import { PagePlaceholder } from "@/pages/PagePlaceholder";

import { ROUTES } from "./navigation";

/** Routes map 1:1 to ui-spec.md. Detail routes highlight their parent nav entry. */
export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.dashboard} element={<PagePlaceholder title="Dashboard" />} />

      <Route path={ROUTES.transactions} element={<PagePlaceholder title="Transactions" />} />
      <Route path={ROUTES.credit} element={<PagePlaceholder title="Credit" />} />

      <Route path={ROUTES.bills} element={<PagePlaceholder title="Bills" />} />
      <Route path={ROUTES.bill()} element={<PagePlaceholder title="Bill" />} />
      <Route path={ROUTES.revenues} element={<PagePlaceholder title="Revenues" />} />
      <Route path={ROUTES.revenue()} element={<PagePlaceholder title="Revenue" />} />
      <Route path={ROUTES.recurrences} element={<PagePlaceholder title="Recurrences" />} />
      <Route path={ROUTES.recurrence()} element={<PagePlaceholder title="Recurrence" />} />

      <Route path={ROUTES.wallets} element={<PagePlaceholder title="Wallets" />} />
      <Route path={ROUTES.wallet()} element={<PagePlaceholder title="Wallet" />} />
      <Route path={ROUTES.sources} element={<PagePlaceholder title="Sources" />} />
      <Route path={ROUTES.source()} element={<PagePlaceholder title="Source" />} />
      <Route path={ROUTES.categories} element={<PagePlaceholder title="Categories" />} />
      <Route path={ROUTES.category()} element={<PagePlaceholder title="Category" />} />

      <Route path="*" element={<PagePlaceholder title="Not found" />} />
    </Routes>
  );
}
