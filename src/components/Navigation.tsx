
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { BarChart3, Calculator, MessageSquare } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: BarChart3, label: 'Overview' },
    { path: '/debt', icon: Calculator, label: 'Debt' },
    { path: '/assistant', icon: MessageSquare, label: 'Assistant' },
  ];
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-finflow-card border-t border-gray-800 flex justify-around items-center p-3 z-10">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link 
            to={item.path} 
            key={item.path}
            className={`flex flex-col items-center p-2 rounded-lg transition-all ${
              isActive ? 'text-finflow-mint' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <item.icon size={20} />
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
};

export default Navigation;
