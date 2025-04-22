/**
 * Utilidades para formatear valores en la aplicación
 */

/**
 * Formatea un número como moneda CLP
 * 
 * @param amount - Monto a formatear
 * @returns String formateado en CLP (ej: $35.000)
 */
export const formatCurrency = (amount: number | string): string => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericAmount);
};

/**
 * Formatea un número como porcentaje
 * 
 * @param value - Valor a formatear como porcentaje
 * @param decimals - Número de decimales a mostrar (por defecto 1)
 * @returns String formateado como porcentaje (ej: 42,5%)
 */
export const formatPercent = (value: number, decimals = 1): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
};

/**
 * Formatea una fecha en formato local chileno
 * 
 * @param date - Fecha a formatear
 * @returns String con la fecha formateada (ej: 15 de junio de 2023)
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Formatea una fecha abreviada
 * 
 * @param date - Fecha a formatear
 * @returns String con la fecha formateada (ej: 15 jun 2023)
 */
export const formatShortDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}; 