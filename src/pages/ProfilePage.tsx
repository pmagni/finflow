import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface ProfileData {
  user_name: string | null;
}

const ProfilePage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    user_name: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('user_name')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setProfileData({
          user_name: data.user_name,
        });
      }
    } catch (error: any) {
      toast.error(`Error al cargar perfil: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      
      if (!user?.id) return;

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          user_name: profileData.user_name,
        });

      if (error) throw error;
      
      toast.success('Perfil actualizado exitosamente');
    } catch (error: any) {
      toast.error(`Error al guardar perfil: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4 md:px-8">
      <Card className="bg-finflow-card border-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl">Editar Perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-finflow-mint"></div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Correo electrónico</label>
                <Input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-gray-800 border-gray-700"
                />
                <p className="text-xs text-gray-400">El correo electrónico no se puede cambiar</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre</label>
                <Input
                  type="text"
                  value={profileData.user_name || ''}
                  onChange={(e) => setProfileData({ ...profileData, user_name: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              
              <Button 
                onClick={handleSaveProfile} 
                disabled={isSaving} 
                className="w-full mt-4 bg-finflow-mint hover:bg-finflow-mint-dark text-black"
              >
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
