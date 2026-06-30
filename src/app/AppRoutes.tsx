import { Route, Routes } from "react-router-dom";

import { BillDetail } from "@/pages/Bills/BillDetail";
import { Bills } from "@/pages/Bills/Bills";
import { Categories } from "@/pages/Categories/Categories";
import { CategoryDetail } from "@/pages/Categories/CategoryDetail";
import { Credit } from "@/pages/Credit/Credit";
import { Dashboard } from "@/pages/Dashboard/Dashboard";
import { PagePlaceholder } from "@/pages/PagePlaceholder";
import { RecurrenceDetail } from "@/pages/Recurrences/RecurrenceDetail";
import { Recurrences } from "@/pages/Recurrences/Recurrences";
import { RevenueDetail } from "@/pages/Revenues/RevenueDetail";
import { Revenues } from "@/pages/Revenues/Revenues";
import { SourceDetail } from "@/pages/Sources/SourceDetail";
import { Sources } from "@/pages/Sources/Sources";
import { Transactions } from "@/pages/Transactions/Transactions";
import { WalletDetail } from "@/pages/Wallets/WalletDetail";
import { Wallets } from "@/pages/Wallets/Wallets";

import { ROUTES } from "./navigation";

/** Routes map 1:1 to ui-spec.md. Detail routes highlight their parent nav entry. */
export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.dashboard} element={<Dashboard />} />

      <Route path={ROUTES.transactions} element={<Transactions />} />
      <Route path={ROUTES.credit} element={<Credit />} />

      <Route path={ROUTES.bills} element={<Bills />} />
      <Route path={ROUTES.bill()} element={<BillDetail />} />
      <Route path={ROUTES.revenues} element={<Revenues />} />
      <Route path={ROUTES.revenue()} element={<RevenueDetail />} />
      <Route path={ROUTES.recurrences} element={<Recurrences />} />
      <Route path={ROUTES.recurrence()} element={<RecurrenceDetail />} />

      <Route path={ROUTES.wallets} element={<Wallets />} />
      <Route path={ROUTES.wallet()} element={<WalletDetail />} />
      <Route path={ROUTES.sources} element={<Sources />} />
      <Route path={ROUTES.source()} element={<SourceDetail />} />
      <Route path={ROUTES.categories} element={<Categories />} />
      <Route path={ROUTES.category()} element={<CategoryDetail />} />

      <Route path="*" element={<PagePlaceholder title="Not found" />} />
    </Routes>
  );
}
