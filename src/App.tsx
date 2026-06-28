import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";

import { AppRoutes } from "@/app/AppRoutes";
import { AppShell } from "@/app/AppShell";
import { queryClient } from "@/lib/query";
import { ThemeProvider } from "@/providers/ThemeProvider";

export function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppShell>
            <AppRoutes />
          </AppShell>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
