
export const validateBudgetData = (budget: any) => {
  if (!budget.user_id) {
    throw new Error('ID de usuario es requerido');
  }

  // Validar que los valores numéricos sean positivos
  const numericFields = ['income', 'fixed_expenses', 'variable_expenses', 'savings_goal', 'discretionary_spend'];
  for (const field of numericFields) {
    const value = budget[field as keyof typeof budget] as number;
    if (value !== undefined && (value < 0 || value > 999999999)) {
      throw new Error(`${field} debe estar entre 0 y $999.999.999`);
    }
  }
};

export const validateBudgetId = (id: string) => {
  if (!id) {
    throw new Error('ID del presupuesto es requerido');
  }
};

export const validateUserAndMonth = (userId: string, month: string) => {
  if (!userId || !month) {
    throw new Error('Usuario y mes son requeridos');
  }
};
