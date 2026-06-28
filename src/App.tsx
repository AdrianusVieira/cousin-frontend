import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";

import { AppRoutes } from "@/app/AppRoutes";
import { AppShell } from "@/app/AppShell";
import { HealthGate } from "@/app/HealthGate";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/query";
import { Login } from "@/pages/Login/Login";
import { AuthProvider } from "@/providers/AuthProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";

function AuthGate() {
  const { session } = useAuth();

  if (!session) {
    return <Login />;
  }

  return (
    <HealthGate>
      <AppShell>
        <AppRoutes />
      </AppShell>
    </HealthGate>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <AuthGate />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
