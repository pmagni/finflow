import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const SettingsPage = () => {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="container max-w-md mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="appearance" className="space-y-4 mt-6">
            <div className="space-y-4">
              <h2 className="text-lg font-medium">Theme</h2>
              
              <div className="space-y-4">
                <RadioGroup defaultValue="dark">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dark" id="dark" />
                    <Label htmlFor="dark">Dark Theme</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="light" />
                    <Label htmlFor="light">Light Theme</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="system" id="system" />
                    <Label htmlFor="system">System Default</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            
            <div className="space-y-4 pt-4">
              <h2 className="text-lg font-medium">Interface</h2>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="reduced-motion">Reduce animations</Label>
                <Switch id="reduced-motion" />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="compact-view">Compact view</Label>
                <Switch id="compact-view" />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="account" className="space-y-4 mt-6">
            <div className="space-y-2">
              <h2 className="text-lg font-medium">Account Information</h2>
              <p className="text-gray-400">Email: {user?.email}</p>
            </div>
            
            {/* Aquí se pueden agregar más configuraciones de cuenta */}
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-4 mt-6">
            <div className="space-y-4">
              <h2 className="text-lg font-medium">Notification Settings</h2>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="push-notifications">Push notifications</Label>
                <Switch id="push-notifications" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications">Email notifications</Label>
                <Switch id="email-notifications" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="budget-alerts">Budget alerts</Label>
                <Switch id="budget-alerts" defaultChecked />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default SettingsPage; 