
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home,
  CreditCard,
  Target,
  PieChart,
  MessageSquare,
  Banknote,
  Trophy,
  BarChart3
} from 'lucide-react';

const MobileNavigation = () => {
  const location = useLocation();

  const navigationItems = [
    { path: '/', icon: Home, label: 'Inicio' },
    { path: '/transactions', icon: CreditCard, label: 'Transacciones' },
    { path: '/budget', icon: PieChart, label: 'Presupuesto' },
    { path: '/goals', icon: Target, label: 'Metas' },
    { path: '/analytics', icon: BarChart3, label: 'Análisis' },
    { path: '/assistant', icon: MessageSquare, label: 'Asistente' },
    { path: '/debt', icon: Banknote, label: 'Deudas' },
    { path: '/gamification', icon: Trophy, label: 'Logros' }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-finflow-card border-t border-gray-700 px-2 py-2 z-50">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navigationItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center px-2 py-1 rounded-lg transition-colors min-w-0 ${
                isActive
                  ? 'bg-finflow-mint text-black'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNavigation;
