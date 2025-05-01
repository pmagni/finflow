
import { supabase } from '@/integrations/supabase/client';
import { DebtItem } from '@/types';
import { PaymentStrategy } from '@/components/DebtAssassin/utils/debtCalculations';
import { toast } from 'sonner';

// Service for handling debt-related operations with Supabase
export const debtService = {
  // Load user's active debt plan and associated debts
  async loadUserDebts(userId: string) {
    if (!userId) {
      console.log('No user ID available for loading debts');
      return { debtPlan: null, debts: [] };
    }
    
    try {
      const { data: debtPlans, error: debtPlanError } = await supabase
        .from('debt_plans')
        .select('*')
        .eq('is_active', true)
        .eq('user_id', userId)
        .limit(1);
      
      console.log('[loadDebts] Planes recibidos:', debtPlans);
      
      if (debtPlanError) {
        console.error('[loadDebts] Error al cargar el plan de deudas:', debtPlanError);
        return { debtPlan: null, debts: [] };
      }

      const debtPlan = debtPlans && debtPlans.length > 0 ? debtPlans[0] : null;

      if (debtPlan) {
        // Load debts associated with the plan
        const { data: debtsData, error: debtsError } = await supabase
          .from('debts')
          .select('*')
          .eq('debt_plan_id', debtPlan.id);
        
        console.log('[loadDebts] Deudas recibidas:', debtsData);
        
        if (debtsError) {
          console.error('[loadDebts] Error al cargar las deudas:', debtsError);
          return { debtPlan, debts: [] };
        }

        if (debtsData && debtsData.length > 0) {
          const mappedDebts = debtsData.map(debt => ({
            id: debt.id,
            name: debt.name,
            balance: debt.balance,
            interestRate: debt.interest_rate,
            minimumPayment: debt.minimum_payment,
            totalPayments: debt.total_payments
          }));
          
          return { debtPlan, debts: mappedDebts };
        } else {
          return { debtPlan, debts: [] };
        }
      } else {
        return { debtPlan: null, debts: [] };
      }
    } catch (error) {
      console.error('[loadDebts] Error al cargar los datos:', error);
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

      const debtPlanData = {
        monthly_income: Math.round(monthlyIncome),
        monthly_budget: Math.round(monthlyBudget),
        budget_percentage: Math.round(budgetPercentage),
        payment_strategy: selectedStrategy,
        is_active: true,
        user_id: userId
      };
      
      console.log('[saveDebtPlan] Enviando datos a Supabase:', debtPlanData);
      
      let newPlanId = debtPlanId;
      if (debtPlanId) {
        const { error } = await supabase
          .from('debt_plans')
          .update(debtPlanData)
          .eq('id', debtPlanId);
          
        if (error) {
          console.error('[saveDebtPlan] Error actualizando plan:', error);
          throw error;
        }
      } else {
        const { data, error } = await supabase
          .from('debt_plans')
          .insert([debtPlanData])
          .select();
          
        if (error) {
          console.error('[saveDebtPlan] Error creando plan:', error);
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
      console.error('[saveDebtPlan] Error al guardar el plan de deudas:', error);
      toast.error(`Error al guardar el plan de deudas: ${error.message || error}`);
      return null;
    }
  },

  // Save a single debt to the database
  async saveDebt(debt: DebtItem, debtPlanId: string) {
    try {
      if (!debtPlanId) {
        toast.error('No se pudo obtener el ID del plan de deudas');
        return false;
      }
      
      const debtData = {
        name: debt.name,
        balance: Math.round(debt.balance),
        interest_rate: Math.round(debt.interestRate * 100) / 100,
        minimum_payment: Math.round(debt.minimumPayment),
        total_payments: Math.round(debt.totalPayments),
        debt_plan_id: debtPlanId,
        is_paid: false
      };
      
      console.log('[saveDebt] Enviando datos a Supabase:', debtData);
      
      // For new debts with temporary IDs
      if (debt.id.startsWith('temp_')) {
        const { data, error } = await supabase
          .from('debts')
          .insert([debtData])
          .select();
          
        if (error) {
          console.error('[saveDebt] Error insertando deuda:', error);
          throw error;
        }
        
        if (data && data.length > 0) {
          return { success: true, id: data[0].id };
        } else {
          console.error('[saveDebt] No se recibió ID para la deuda nueva');
          return { success: false, id: null };
        }
      } else {
        // For updating existing debts
        const { error } = await supabase
          .from('debts')
          .update(debtData)
          .eq('id', debt.id);
          
        if (error) {
          console.error('[saveDebt] Error actualizando deuda:', error);
          throw error;
        }
        
        return { success: true, id: debt.id };
      }
    } catch (error: any) {
      console.error('[saveDebt] Error al guardar la deuda:', error);
      toast.error(`Error al guardar la deuda: ${error.message || error}`);
      return { success: false, id: null };
    }
  },

  // Delete a debt from the database
  async deleteDebt(debtId: string) {
    // For existing debts in database
    if (!debtId.startsWith('temp_')) {
      try {
        const { error } = await supabase
          .from('debts')
          .delete()
          .eq('id', debtId);
          
        if (error) {
          console.error('[removeDebt] Error eliminando deuda:', error);
          throw error;
        }
        
        return true;
      } catch (error: any) {
        console.error('[removeDebt] Error al eliminar la deuda:', error);
        toast.error(`Error al eliminar la deuda: ${error.message || error}`);
        return false;
      }
    }
    
    // For temporary debts that aren't in the database yet
    return true;
  }
};
