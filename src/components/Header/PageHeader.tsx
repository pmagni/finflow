
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, User, LogOut, FolderTree } from 'lucide-react';
import FinFlowIcon from '@/assets/favicon.svg';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PageHeaderProps {
  onAddTransaction: () => void;
}

const PageHeader = ({ onAddTransaction }: PageHeaderProps) => {
  const { user } = useAuth();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    if (user) {
      setUserEmail(user.email || '');
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
    <header className="flex justify-between items-center py-4">
      <div className="flex items-center gap-2">
        <img src={FinFlowIcon} alt="FinFlow Icon" className="w-6 h-6" />
        <h1 className="text-2xl font-bold">FinFlow</h1>
      </div>
      <div className="flex items-center gap-4">
        <Button
          onClick={onAddTransaction}
          className="bg-finflow-mint hover:bg-finflow-mint-dark text-black"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Agregar Transacción</span>
        </Button>
        
        {/* Avatar with user menu - only visible on mobile */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-10 h-10 rounded-full bg-finflow-card hover:bg-gray-800 transition-colors p-0"
              >
                <Avatar>
                  <AvatarFallback className="bg-finflow-mint text-black font-bold">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
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
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
