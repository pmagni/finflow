
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const SettingsPage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-finflow-dark">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-finflow-mint"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-finflow-dark text-white p-6">
      <div className="container max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Configuración</h1>

        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="appearance">Apariencia</TabsTrigger>
            <TabsTrigger value="account">Cuenta</TabsTrigger>
            <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          </TabsList>
          
          <TabsContent value="appearance" className="space-y-4 mt-6">
            <div className="space-y-4">
              <h2 className="text-lg font-medium">Tema</h2>
              
              <div className="space-y-4">
                <RadioGroup defaultValue="dark">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dark" id="dark" />
                    <Label htmlFor="dark">Tema Oscuro</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="light" />
                    <Label htmlFor="light">Tema Claro</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="system" id="system" />
                    <Label htmlFor="system">Predeterminado del Sistema</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            
            <div className="space-y-4 pt-4">
              <h2 className="text-lg font-medium">Interfaz</h2>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="reduced-motion">Reducir animaciones</Label>
                <Switch id="reduced-motion" />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="compact-view">Vista compacta</Label>
                <Switch id="compact-view" />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="account" className="space-y-4 mt-6">
            <div className="space-y-2">
              <h2 className="text-lg font-medium">Información de la Cuenta</h2>
              <p className="text-gray-400">Email: {user?.email}</p>
            </div>
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-4 mt-6">
            <div className="space-y-4">
              <h2 className="text-lg font-medium">Configuración de Notificaciones</h2>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="push-notifications">Notificaciones push</Label>
                <Switch id="push-notifications" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications">Notificaciones por email</Label>
                <Switch id="email-notifications" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="budget-alerts">Alertas de presupuesto</Label>
                <Switch id="budget-alerts" defaultChecked />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SettingsPage;
