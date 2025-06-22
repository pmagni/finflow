
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Index from './pages/Index';
import AuthPage from './pages/AuthPage';
import TransactionsPage from './pages/TransactionsPage';
import BudgetPage from './pages/BudgetPage';
import GoalsPage from './pages/GoalsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AssistantPage from './pages/AssistantPage';
import DebtPage from './pages/DebtPage';
import CategoriesPage from './pages/CategoriesPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import TavilySearchPage from './pages/TavilySearchPage';
import AdminPage from './pages/AdminPage';
import GamificationPage from './pages/GamificationPage';
import NotFound from './pages/NotFound';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Index />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="budget" element={<BudgetPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="assistant" element={<AssistantPage />} />
        <Route path="debt" element={<DebtPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="search" element={<TavilySearchPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="gamification" element={<GamificationPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
