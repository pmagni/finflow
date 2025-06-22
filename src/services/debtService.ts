
import { supabase } from '@/integrations/supabase/client';
import { DebtItem } from '@/types';
import { PaymentStrategy } from '@/components/DebtAssassin/utils/debtCalculations';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/types/supabase';

export type Debt = Tables<'debts'>;
export type DebtPlan = Tables<'debt_plans'>;
export type DebtInsert = TablesInsert<'debts'>;
export type DebtPlanInsert = TablesInsert<'debt_plans'>;

// Service for handling debt-related operations with Supabase
export const debtService = {
  // Load user's active debt plan and associated debts
  async loadUserDebts(userId: string) {
    if (!userId) {
      console.log('No user ID available for loading debts');
      return { debtPlan: null, debts: [] };
    }
    
    try {
      // First search for an active plan
      const { data: debtPlans, error: debtPlanError } = await supabase
        .from('debt_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();
      
      if (debtPlanError && debtPlanError.code !== 'PGRST116') {
        console.error('[loadDebts] Error loading debt plan:', debtPlanError);
        throw debtPlanError;
      }

      // If no active plan, return null
      if (!debtPlans) {
        console.log('[loadDebts] No active plan found');
        return { debtPlan: null, debts: [] };
      }

      console.log('[loadDebts] Plan found:', debtPlans);

      // If there's a plan, load associated debts
      const { data: debtsData, error: debtsError } = await supabase
        .from('debts')
        .select('*')
        .eq('user_id', userId);
      
      if (debtsError) {
        console.error('[loadDebts] Error loading debts:', debtsError);
        throw debtsError;
      }

      console.log('[loadDebts] Debts found:', debtsData);

      // Map debts to the format expected by the application
      const mappedDebts = (debtsData || []).map(debt => ({
        id: debt.id,
        name: debt.name || '',
        balance: debt.balance,
        interestRate: debt.interest_rate || 0,
        minimumPayment: debt.minimum_payment || 0,
        totalPayments: 0 // This field doesn't exist in current schema
      }));
      
      return { 
        debtPlan: debtPlans,
        debts: mappedDebts 
      };
      
    } catch (error) {
      console.error('[loadDebts] Error loading data:', error);
      toast.error('Error al cargar los datos de deudas');
      return { debtPlan: null, debts: [] };
    }
  },

  // Save or update a debt plan
  async saveDebtPlan(userId: string, monthlyIncome: number, monthlyBudget: number, 
                    budgetPercentage: number, selectedStrategy: PaymentStrategy, 
                    debtPlanId: string | null) {
    try {
      if (!userId) {
        toast.error('Debes iniciar sesión para guardar tu plan de deudas');
        return null;
      }

      // Validaciones
      if (monthlyIncome <= 0) {
        throw new Error('Los ingresos mensuales deben ser mayores a 0');
      }

      if (monthlyBudget <= 0) {
        throw new Error('El presupuesto mensual debe ser mayor a 0');
      }

      if (budgetPercentage <= 0 || budgetPercentage > 100) {
        throw new Error('El porcentaje del presupuesto debe estar entre 1 y 100');
      }

      if (monthlyBudget > monthlyIncome) {
        toast.error('El presupuesto para deudas no puede ser mayor a los ingresos mensuales');
      }

      const debtPlanData: DebtPlanInsert = {
        name: 'Plan Principal',
        monthly_income: Math.round(monthlyIncome),
        monthly_budget: Math.round(monthlyBudget),
        budget_percentage: Math.round(budgetPercentage),
        payment_strategy: selectedStrategy,
        is_active: true,
        user_id: userId
      };
      
      console.log('[saveDebtPlan] Sending data to Supabase:', debtPlanData);
      
      let newPlanId = debtPlanId;
      if (debtPlanId) {
        const { error } = await supabase
          .from('debt_plans')
          .update(debtPlanData)
          .eq('id', debtPlanId);
          
        if (error) {
          console.error('[saveDebtPlan] Error updating plan:', error);
          throw error;
        }
      } else {
        const { data, error } = await supabase
          .from('debt_plans')
          .insert(debtPlanData)
          .select();
          
        if (error) {
          console.error('[saveDebtPlan] Error creating plan:', error);
          throw error;
        }
        
        if (data && data.length > 0) {
          newPlanId = data[0].id;
        } else {
          toast.error('Error al crear el plan de deudas: no se recibió ID');
          return null;
        }
      }
      
      return newPlanId;
    } catch (error: any) {
      console.error('[saveDebtPlan] Error saving debt plan:', error);
      toast.error(`Error al guardar el plan de deudas: ${error.message || error}`);
      return null;
    }
  },

  // Save a single debt to the database
  async saveDebt(debt: DebtItem, userId: string) {
    try {
      if (!userId) {
        toast.error('Debes iniciar sesión para guardar deudas');
        return false;
      }

      // Validaciones
      if (!debt.name || debt.name.trim() === '') {
        throw new Error('El nombre de la deuda es requerido');
      }

      if (debt.balance <= 0) {
        throw new Error('El saldo debe ser mayor a 0');
      }

      if (debt.interestRate < 0) {
        throw new Error('La tasa de interés no puede ser negativa');
      }

      if (debt.minimumPayment <= 0) {
        throw new Error('El pago mínimo debe ser mayor a 0');
      }
      
      const debtData: DebtInsert = {
        name: debt.name.trim(),
        balance: Math.round(debt.balance),
        interest_rate: Math.round(debt.interestRate * 100) / 100,
        minimum_payment: Math.round(debt.minimumPayment),
        user_id: userId
      };
      
      console.log('[saveDebt] Sending data to Supabase:', debtData);
      
      // For new debts with temporary IDs
      if (debt.id.startsWith('temp_')) {
        const { data, error } = await supabase
          .from('debts')
          .insert(debtData)
          .select();
          
        if (error) {
          console.error('[saveDebt] Error inserting debt:', error);
          throw error;
        }
        
        if (data && data.length > 0) {
          return { success: true, id: data[0].id };
        } else {
          console.error('[saveDebt] No ID received for new debt');
          return { success: false, id: null };
        }
      } else {
        // For updating existing debts
        const { error } = await supabase
          .from('debts')
          .update(debtData)
          .eq('id', debt.id);
          
        if (error) {
          console.error('[saveDebt] Error updating debt:', error);
          throw error;
        }
        
        return { success: true, id: debt.id };
      }
    } catch (error: any) {
      console.error('[saveDebt] Error saving debt:', error);
      toast.error(`Error al guardar la deuda: ${error.message || error}`);
      return { success: false, id: null };
    }
  },

  // Delete a debt from the database
  async deleteDebt(debtId: string) {
    if (!debtId) {
      throw new Error('ID de la deuda es requerido');
    }

    // For existing debts in database
    if (!debtId.startsWith('temp_')) {
      try {
        const { error } = await supabase
          .from('debts')
          .delete()
          .eq('id', debtId);
          
        if (error) {
          console.error('[removeDebt] Error deleting debt:', error);
          throw error;
        }
        
        return true;
      } catch (error: any) {
        console.error('[removeDebt] Error deleting debt:', error);
        toast.error(`Error al eliminar la deuda: ${error.message || error}`);
        return false;
      }
    }
    
    // For temporary debts that aren't in the database yet
    return true;
  },

  // Get debt statistics for a user
  async getDebtStatistics(userId: string): Promise<{
    totalDebts: number;
    totalBalance: number;
    totalMinimumPayments: number;
    averageInterestRate: number;
    highestInterestDebt: Debt | null;
  }> {
    if (!userId) {
      throw new Error('ID de usuario es requerido');
    }

    const { data: debts, error } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    if (!debts || debts.length === 0) {
      return {
        totalDebts: 0,
        totalBalance: 0,
        totalMinimumPayments: 0,
        averageInterestRate: 0,
        highestInterestDebt: null
      };
    }

    const totalDebts = debts.length;
    const totalBalance = debts.reduce((sum, debt) => sum + debt.balance, 0);
    const totalMinimumPayments = debts.reduce((sum, debt) => sum + (debt.minimum_payment || 0), 0);
    const averageInterestRate = debts.reduce((sum, debt) => sum + (debt.interest_rate || 0), 0) / totalDebts;
    const highestInterestDebt = debts.reduce((highest, current) => 
      (current.interest_rate || 0) > (highest.interest_rate || 0) ? current : highest
    );

    return {
      totalDebts,
      totalBalance,
      totalMinimumPayments,
      averageInterestRate,
      highestInterestDebt
    };
  }
};
