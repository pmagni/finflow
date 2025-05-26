import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, BanknoteIcon, BrainCircuitIcon, User, LogOut, FolderTree } from 'lucide-react';
import FinFlowIcon from '@/assets/favicon.svg';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const menuItems = [
  { label: 'Home', path: '/', icon: <HomeIcon size={22} strokeWidth={1.5} /> },
  { label: 'Mis Ahorros', path: '/savings', icon: <BanknoteIcon size={22} strokeWidth={1.5} /> },
  { label: 'Mis Deudas', path: '/debt', icon: <BanknoteIcon size={22} strokeWidth={1.5} /> },
  { label: 'Asistente Fin', path: '/assistant', icon: <BrainCircuitIcon size={22} strokeWidth={1.5} /> },
];

const Sidebar = ({ className = '' }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    if (user) {
      setUserEmail(user.email || '');
      // Buscar el nombre en el perfil
      const fetchUserProfile = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_name')
          .eq('id', user.id)
          .single();
        if (data && !error) {
          setUserName(data.user_name || '');
        }
      };
      fetchUserProfile();
    }
  }, [user]);

  // Función para obtener iniciales
  const getInitials = () => {
    if (userName) {
      const parts = userName.trim().split(' ');
      if (parts.length === 1) return parts[0][0].toUpperCase();
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    if (userEmail) return userEmail.substring(0, 2).toUpperCase();
    return 'U';
  };

  return (
    <aside className={`fixed top-0 left-0 h-screen w-64 bg-finflow-card border-r border-gray-800 flex flex-col items-center py-8 justify-between hidden md:flex ${className}`}>
      <div className="w-full">
        <div className="flex items-center gap-2 mb-10 px-6">
          <img src={FinFlowIcon} alt="FinFlow Icon" className="w-8 h-8" />
          <span className="text-2xl font-bold">FinFlow</span>
        </div>
        <nav className="flex flex-col gap-4 w-full">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                to={item.path}
                key={item.path}
                className={`flex items-center gap-3 px-6 py-3 rounded-lg transition-all w-full font-medium text-lg ${
                  isActive
                    ? 'bg-gray-800 text-finflow-mint'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="w-full flex flex-col items-center mb-2 hidden md:flex">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-12 h-12 rounded-full bg-finflow-card hover:bg-gray-800 transition-colors flex items-center justify-center p-0">
              <Avatar>
                <AvatarFallback className="bg-finflow-mint text-black font-bold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userEmail}</p>
                <p className="text-xs leading-none text-gray-500">Usuario</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile" className="flex items-center cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Editar Perfil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/categories" className="flex items-center cursor-pointer">
                <FolderTree className="mr-2 h-4 w-4" />
                <span>Administrar Categorías</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => supabase.auth.signOut()}
              className="text-red-500 focus:text-red-500 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <span className="mt-2 text-sm font-medium text-gray-200 truncate max-w-[140px]">{userName || userEmail}</span>
      </div>
    </aside>
  );
};

export default Sidebar; 
