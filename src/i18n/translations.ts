export const translations = {
  es: {
    common: {
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
    },
    dashboard: {
      title: 'Panel de Control',
      monthlyExpenses: 'Gastos Mensuales',
      monthlyIncome: 'Ingresos Mensuales',
      balance: 'Balance',
      categories: 'Categorías',
      transactions: 'Transacciones',
      financialHealth: 'Salud Financiera',
    },
    transactions: {
      title: 'Transacciones',
      addTransaction: 'Agregar Transacción',
      editTransaction: 'Editar Transacción',
      deleteTransaction: 'Eliminar Transacción',
      amount: 'Monto',
      date: 'Fecha',
      category: 'Categoría',
      description: 'Descripción',
      type: 'Tipo',
      income: 'Ingreso',
      expense: 'Gasto',
    },
    categories: {
      title: 'Categorías',
      addCategory: 'Agregar Categoría',
      editCategory: 'Editar Categoría',
      deleteCategory: 'Eliminar Categoría',
      name: 'Nombre',
      icon: 'Ícono',
      color: 'Color',
    },
    errors: {
      required: 'Este campo es requerido',
      invalidAmount: 'Monto inválido',
      invalidDate: 'Fecha inválida',
      invalidCategory: 'Categoría inválida',
      networkError: 'Error de conexión',
      serverError: 'Error del servidor',
    },
  },
};

export type TranslationKey = keyof typeof translations.es;

export const useTranslation = () => {
  const currentLang = 'es'; // TODO: Implementar selector de idioma

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[currentLang];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key;
      }
    }

    return value || key;
  };

  return { t };
}; 