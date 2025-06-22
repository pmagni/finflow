
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
  Trophy,
  BarChart3
} from 'lucide-react';

const DesktopSidebar = () => {
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

  const mainNavigationItems = [
    { path: '/', icon: Home, label: 'Inicio' },
    { path: '/transactions', icon: CreditCard, label: 'Transacciones' },
    { path: '/budget', icon: PieChart, label: 'Presupuesto' },
    { path: '/goals', icon: Target, label: 'Metas' },
    { path: '/analytics', icon: BarChart3, label: 'Analíticas' },
    { path: '/assistant', icon: MessageSquare, label: 'Asistente' },
    { path: '/debt', icon: Banknote, label: 'Deudas' },
    { path: '/gamification', icon: Trophy, label: 'Gamificación' }
  ];

  const secondaryNavigationItems = [
    { path: '/categories', icon: FolderTree, label: 'Categorías' },
    { path: '/profile', icon: User, label: 'Perfil' },
    { path: '/settings', icon: Settings, label: 'Configuración' },
    ...(isAdmin ? [{ path: '/admin', icon: Shield, label: 'Admin' }] : [])
  ];

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-finflow-card border-r border-gray-700 flex-col z-40">
      <div className="p-6">
        <Link to="/" className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-finflow-mint rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-lg">F</span>
          </div>
          <span className="text-finflow-mint font-bold text-xl">FinFlow</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Principal
          </h3>
          {mainNavigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-finflow-mint text-black'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Configuración
          </h3>
          {secondaryNavigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-finflow-mint text-black'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
};

export default DesktopSidebar;
