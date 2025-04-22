import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { HomeIcon, BanknoteIcon, BrainCircuitIcon } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();
  
  const menuItems = [
    { 
      label: 'Dashboard', 
      path: '/', 
      icon: <HomeIcon size={22} strokeWidth={1.5} /> 
    },
    { 
      label: 'My Debts', 
      path: '/debt', 
      icon: <BanknoteIcon size={22} strokeWidth={1.5} /> 
    },
    { 
      label: 'Financial AI', 
      path: '/assistant', 
      icon: <BrainCircuitIcon size={22} strokeWidth={1.5} /> 
    },
  ];
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-finflow-card border-t border-gray-800 flex justify-around items-center p-3 z-10">
      {menuItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link 
            to={item.path} 
            key={item.path}
            className={`flex flex-col items-center p-3 rounded-lg transition-all ${
              isActive 
                ? 'text-finflow-mint bg-gray-800 bg-opacity-50' 
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800 hover:bg-opacity-30'
            }`}
          >
            {item.icon}
            <span className="text-xs font-medium mt-1.5">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
};

export default Navigation;
