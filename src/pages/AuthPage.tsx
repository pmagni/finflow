
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import FinFlowIcon from '@/assets/favicon.svg';

const AuthPage = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              user_name: userName,
            },
          },
        });
        if (error) throw error;
        toast.success('Revisa tu email para confirmar tu cuenta');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Inicio de sesión exitoso');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-finflow-dark text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-finflow-card p-8 rounded-2xl">
        <div className="flex justify-center mb-6">
          <img src={FinFlowIcon} alt="FinFlow Icon" className="w-16 h-16" />
        </div>
        <h1 className="text-2xl font-bold mb-6 text-center">
          {isSignUp ? 'Crear una Cuenta' : 'Bienvenido de Vuelta'}
        </h1>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Correo electrónico</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-gray-800 border-gray-700"
            />
          </div>
          
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium mb-2">Nombre</label>
              <Input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                className="bg-gray-800 border-gray-700"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-2">Contraseña</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-gray-800 border-gray-700"
            />
          </div>
          
          <Button
            type="submit"
            className="w-full bg-finflow-mint hover:bg-finflow-mint-dark text-black"
            disabled={isLoading}
          >
            {isLoading
              ? 'Cargando...'
              : isSignUp
              ? 'Registrarse'
              : 'Iniciar Sesión'}
          </Button>
        </form>
        
        <p className="mt-4 text-center text-sm">
          {isSignUp ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta?'}{' '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-finflow-mint hover:underline"
          >
            {isSignUp ? 'Iniciar Sesión' : 'Registrarse'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
