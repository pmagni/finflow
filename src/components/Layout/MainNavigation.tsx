
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  CreditCard, 
  Target, 
  PiggyBank, 
  BarChart3, 
  Settings,
  Calculator
} from 'lucide-react';

const MainNavigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/transactions', label: 'Transacciones', icon: CreditCard },
    { path: '/budget', label: 'Presupuesto', icon: PiggyBank },
    { path: '/goals', label: 'Metas', icon: Target },
    { path: '/debt', label: 'Deudas', icon: Calculator },
    { path: '/analytics', label: 'Análisis', icon: BarChart3 },
    { path: '/settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <nav className="flex flex-col space-y-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        
        return (
          <Link key={item.path} to={item.path}>
            <Button
              variant={isActive ? 'default' : 'ghost'}
              className="w-full justify-start"
            >
              <Icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          </Link>
        );
      })}
    </nav>
  );
};

export default MainNavigation;
