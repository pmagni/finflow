
import { supabase } from '@/integrations/supabase/client';
import { checkUserPermissions } from '@/utils/securityHelpers';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  achieved_at: string;
  user_id: string;
}

export interface GamificationEvent {
  id: string;
  user_id: string;
  event_type: string;
  points_earned: number;
  metadata: any;
  created_at: string;
}

export interface HealthScore {
  id: string;
  user_id: string;
  score: number;
  calculated_at: string;
}

class GamificationServiceClass {
  // Obtener achievements del usuario
  async getUserAchievements(userId: string): Promise<Achievement[]> {
    if (!userId) {
      throw new Error('User ID es requerido');
    }

    const hasPermissions = await checkUserPermissions();
    if (!hasPermissions) {
      throw new Error('No tienes permisos para esta operación');
    }

    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .order('achieved_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Crear nuevo achievement
  async createAchievement(achievement: Omit<Achievement, 'id' | 'achieved_at'>): Promise<Achievement> {
    const hasPermissions = await checkUserPermissions();
    if (!hasPermissions) {
      throw new Error('No tienes permisos para esta operación');
    }

    const { data, error } = await supabase
      .from('achievements')
      .insert({
        ...achievement,
        achieved_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Registrar evento de gamificación
  async recordGamificationEvent(event: Omit<GamificationEvent, 'id' | 'created_at'>): Promise<GamificationEvent> {
    const hasPermissions = await checkUserPermissions();
    if (!hasPermissions) {
      throw new Error('No tienes permisos para esta operación');
    }

    const { data, error } = await supabase
      .from('gamification_events')
      .insert(event)
      .select()
      .single();

    if (error) throw error;

    // Verificar si se debe otorgar algún achievement
    await this.checkAndAwardAchievements(event.user_id, event.event_type);

    return data;
  }

  // Obtener puntuación de salud financiera
  async getFinancialHealthScore(userId: string): Promise<HealthScore | null> {
    if (!userId) {
      throw new Error('User ID es requerido');
    }

    const hasPermissions = await checkUserPermissions();
    if (!hasPermissions) {
      throw new Error('No tienes permisos para esta operación');
    }

    const { data, error } = await supabase
      .from('financial_health_scores')
      .select('*')
      .eq('user_id', userId)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  // Calcular y actualizar puntuación de salud financiera
  async calculateHealthScore(userId: string): Promise<HealthScore> {
    const hasPermissions = await checkUserPermissions();
    if (!hasPermissions) {
      throw new Error('No tienes permisos para esta operación');
    }

    // Obtener datos financieros del usuario
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId);

    const { data: budgets } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId);

    const { data: goals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId);

    // Calcular puntuación basada en múltiples factores
    let score = 0;

    // Factor 1: Diversidad de transacciones (max 25 puntos)
    if (transactions && transactions.length > 0) {
      const uniqueCategories = new Set(transactions.map(t => t.category));
      score += Math.min(uniqueCategories.size * 5, 25);
    }

    // Factor 2: Existencia de presupuesto (max 25 puntos)
    if (budgets && budgets.length > 0) {
      score += 25;
    }

    // Factor 3: Metas financieras (max 25 puntos)
    if (goals && goals.length > 0) {
      const completedGoals = goals.filter(g => g.completed).length;
      score += Math.min(goals.length * 10 + completedGoals * 5, 25);
    }

    // Factor 4: Consistencia (max 25 puntos)
    if (transactions && transactions.length > 10) {
      score += 25;
    }

    // Guardar puntuación
    const { data, error } = await supabase
      .from('financial_health_scores')
      .insert({
        user_id: userId,
        score: Math.min(score, 100)
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Verificar y otorgar achievements
  private async checkAndAwardAchievements(userId: string, eventType: string): Promise<void> {
    const achievements = await this.getAchievementRules(userId, eventType);
    
    for (const achievement of achievements) {
      const exists = await this.achievementExists(userId, achievement.title);
      if (!exists) {
        await this.createAchievement({
          user_id: userId,
          title: achievement.title,
          description: achievement.description
        });
      }
    }
  }

  // Reglas de achievements
  private async getAchievementRules(userId: string, eventType: string): Promise<Array<{title: string, description: string}>> {
    const rules: Array<{title: string, description: string}> = [];

    if (eventType === 'transaction_created') {
      const { data: transactions } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', userId);

      if (transactions && transactions.length === 1) {
        rules.push({
          title: 'Primera Transacción',
          description: 'Has registrado tu primera transacción'
        });
      }

      if (transactions && transactions.length === 10) {
        rules.push({
          title: 'Décima Transacción',
          description: 'Has registrado 10 transacciones'
        });
      }
    }

    if (eventType === 'budget_created') {
      rules.push({
        title: 'Primer Presupuesto',
        description: 'Has creado tu primer presupuesto mensual'
      });
    }

    if (eventType === 'goal_completed') {
      rules.push({
        title: 'Meta Cumplida',
        description: 'Has completado tu primera meta financiera'
      });
    }

    return rules;
  }

  // Verificar si achievement ya existe
  private async achievementExists(userId: string, title: string): Promise<boolean> {
    const { data } = await supabase
      .from('achievements')
      .select('id')
      .eq('user_id', userId)
      .eq('title', title)
      .single();

    return !!data;
  }

  // Obtener estadísticas del usuario
  async getUserStats(userId: string): Promise<{
    totalPoints: number;
    achievements: number;
    healthScore: number;
    streak: number;
  }> {
    const hasPermissions = await checkUserPermissions();
    if (!hasPermissions) {
      throw new Error('No tienes permisos para esta operación');
    }

    const [events, achievements, healthScore] = await Promise.all([
      supabase.from('gamification_events').select('points_earned').eq('user_id', userId),
      supabase.from('achievements').select('id').eq('user_id', userId),
      this.getFinancialHealthScore(userId)
    ]);

    const totalPoints = events.data?.reduce((sum, event) => sum + (event.points_earned || 0), 0) || 0;
    const achievementsCount = achievements.data?.length || 0;
    const currentHealthScore = healthScore?.score || 0;

    return {
      totalPoints,
      achievements: achievementsCount,
      healthScore: currentHealthScore,
      streak: await this.calculateStreak(userId)
    };
  }

  // Calcular racha de actividad
  private async calculateStreak(userId: string): Promise<number> {
    const { data: events } = await supabase
      .from('gamification_events')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (!events || events.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < events.length; i++) {
      const eventDate = new Date(events[i].created_at);
      const daysDiff = Math.floor((today.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === i) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }
}

export const gamificationService = new GamificationServiceClass();
