import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { BarChart3, Calculator, MessageSquare, Home, DollarSign, FileText, User2 } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();
  
  const menuItems = [
    { label: 'Dashboard', path: '/', icon: <Home size={18} /> },
    { label: 'Transactions', path: '/transactions', icon: <FileText size={18} /> },
    { label: 'Debt Assassin', path: '/debt', icon: <DollarSign size={18} /> },
    { label: 'Financial Assistant', path: '/assistant', icon: <User2 size={18} /> },
  ];
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-finflow-card border-t border-gray-800 flex justify-around items-center p-3 z-10">
      {menuItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link 
            to={item.path} 
            key={item.path}
            className={`flex flex-col items-center p-2 rounded-lg transition-all ${
              isActive ? 'text-finflow-mint' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {item.icon}
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
};

export default Navigation;
