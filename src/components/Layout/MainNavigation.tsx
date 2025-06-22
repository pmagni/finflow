
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  Home,
  CreditCard,
  Target,
  PieChart,
  MessageSquare,
  Banknote,
  FolderTree,
  User,
  Settings,
  Shield,
  Trophy
} from 'lucide-react';
import ProfileMenu from '@/components/UserProfile/ProfileMenu';

const MainNavigation = () => {
  const location = useLocation();
  const { user, hasRole } = useAuth();
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    const checkAdminRole = async () => {
      if (user) {
        const adminStatus = await hasRole('admin');
        setIsAdmin(adminStatus);
      }
    };
    
    checkAdminRole();
  }, [user, hasRole]);

  const navigationItems = [
    { path: '/', icon: Home, label: 'Inicio' },
    { path: '/transactions', icon: CreditCard, label: 'Transacciones' },
    { path: '/budget', icon: PieChart, label: 'Presupuesto' },
    { path: '/goals', icon: Target, label: 'Metas' },
    { path: '/analytics', icon: PieChart, label: 'Analíticas' },
    { path: '/assistant', icon: MessageSquare, label: 'Asistente' },
    { path: '/debt', icon: Banknote, label: 'Deudas' },
    { path: '/gamification', icon: Trophy, label: 'Gamificación' },
    { path: '/categories', icon: FolderTree, label: 'Categorías' },
    { path: '/profile', icon: User, label: 'Perfil' },
    { path: '/settings', icon: Settings, label: 'Configuración' },
    ...(isAdmin ? [{ path: '/admin', icon: Shield, label: 'Admin' }] : [])
  ];

  return (
    <nav className="bg-finflow-card border-b border-gray-700 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link to="/" className="text-finflow-mint font-bold text-xl">
            FinFlow
          </Link>
          
          <div className="hidden lg:flex items-center space-x-6">
            {navigationItems.slice(0, 8).map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-finflow-mint text-black'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <ProfileMenu />
        </div>
      </div>
    </nav>
  );
};

export default MainNavigation;
