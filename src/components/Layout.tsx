
import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import DesktopSidebar from './Layout/DesktopSidebar';
import MobileNavigation from './Layout/MobileNavigation';

const Layout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-finflow-dark">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-finflow-mint"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-finflow-dark">
      <DesktopSidebar />
      <MobileNavigation />
      <main className="md:ml-64 pb-16 md:pb-0">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
