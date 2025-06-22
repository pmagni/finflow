
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import ProfileMenu from '@/components/UserProfile/ProfileMenu';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const AppHeader = ({ title, subtitle, actions }: AppHeaderProps) => {
  const { user } = useAuth();

  return (
    <header className="bg-finflow-card border-b border-gray-700 md:hidden">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-finflow-mint rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-lg">F</span>
            </div>
            <div>
              {title && <h1 className="text-xl font-bold text-white">{title}</h1>}
              {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {actions}
            <ProfileMenu />
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
