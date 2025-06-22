
import { supabase } from '@/integrations/supabase/client';

export interface AdminMetrics {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalRevenue: number;
  averageHealthScore: number;
  topCategories: Array<{ category: string; total: number }>;
  userGrowth: Array<{ date: string; count: number }>;
}

export interface UserAnalytics {
  userId: string;
  totalTransactions: number;
  totalExpenses: number;
  totalIncome: number;
  averageMonthlySpending: number;
  topSpendingCategories: Array<{ category: string; amount: number; percentage: number }>;
  monthlyTrends: Array<{ month: string; income: number; expenses: number; balance: number }>;
  financialHealth: {
    score: number;
    trends: Array<{ date: string; score: number }>;
  };
  achievements: Array<{ title: string; description: string; achieved_at: string }>;
}

class AdminServiceClass {
  // Obtener métricas administrativas
  async getAdminMetrics(): Promise<AdminMetrics> {
    const { data, error } = await supabase.functions.invoke('admin-metrics');
    
    if (error) {
      console.error('Error fetching admin metrics:', error);
      throw new Error('Error al obtener métricas administrativas');
    }
    
    return data;
  }

  // Obtener analíticas de un usuario específico
  async getUserAnalytics(userId?: string): Promise<UserAnalytics> {
    const { data, error } = await supabase.functions.invoke('user-analytics', {
      body: { userId }
    });
    
    if (error) {
      console.error('Error fetching user analytics:', error);
      throw new Error('Error al obtener analíticas del usuario');
    }
    
    return data;
  }

  // Verificar si el usuario actual es admin
  async isAdmin(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      return !error && !!data;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  // Obtener lista de usuarios (solo para admins)
  async getAllUsers(): Promise<Array<{id: string, user_name: string, created_at: string}>> {
    const isAdminUser = await this.isAdmin();
    if (!isAdminUser) {
      throw new Error('No tienes permisos de administrador');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_name, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      throw new Error('Error al obtener lista de usuarios');
    }

    return data || [];
  }

  // Asignar rol a usuario (solo para admins)
  async assignRole(userId: string, role: 'admin' | 'moderator'): Promise<void> {
    const isAdminUser = await this.isAdmin();
    if (!isAdminUser) {
      throw new Error('No tienes permisos de administrador');
    }

    const { error } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: role
      });

    if (error) {
      console.error('Error assigning role:', error);
      throw new Error('Error al asignar rol');
    }
  }
}

export const adminService = new AdminServiceClass();
