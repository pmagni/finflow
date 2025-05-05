import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import AppLayout from "@/components/Layout/AppLayout";

import Index from "./pages/Index";
import DebtPage from "./pages/DebtPage";
import AssistantPage from "./pages/AssistantPage";
import TransactionsPage from "./pages/TransactionsPage";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import SettingsPage from "./pages/SettingsPage";
import { TavilySearchPage } from "./pages/TavilySearchPage";
import CategoriesPage from "./pages/CategoriesPage";

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<AuthPage />} />
    <Route
      path="/"
      element={
        <RequireAuth>
          <AppLayout>
            <Index />
          </AppLayout>
        </RequireAuth>
      }
    />
    <Route
      path="/debt"
      element={
        <RequireAuth>
          <AppLayout>
            <DebtPage />
          </AppLayout>
        </RequireAuth>
      }
    />
    <Route
      path="/assistant"
      element={
        <RequireAuth>
          <AppLayout>
            <AssistantPage />
          </AppLayout>
        </RequireAuth>
      }
    />
    <Route
      path="/transactions"
      element={
        <RequireAuth>
          <AppLayout>
            <TransactionsPage />
          </AppLayout>
        </RequireAuth>
      }
    />
    <Route
      path="/settings"
      element={
        <RequireAuth>
          <AppLayout>
            <SettingsPage />
          </AppLayout>
        </RequireAuth>
      }
    />
    <Route
      path="/categories"
      element={
        <RequireAuth>
          <AppLayout>
            <CategoriesPage />
          </AppLayout>
        </RequireAuth>
      }
    />
    <Route
      path="/tavily-search"
      element={
        <RequireAuth>
          <AppLayout>
            <TavilySearchPage />
          </AppLayout>
        </RequireAuth>
      }
    />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes; 