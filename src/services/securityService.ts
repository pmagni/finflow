
import { supabase } from '@/integrations/supabase/client';
import { budgetRateLimit } from './budget/budgetRateLimit';
import { detectSqlInjection, isValidUUID, sanitizeAndValidate } from '@/utils/securityHelpers';

interface SecurityValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: any;
}

export class SecurityService {
  // Rate limiting check
  static checkRateLimit(userId: string, operation: string): boolean {
    return budgetRateLimit.checkRateLimit(userId, operation);
  }

  // Comprehensive input validation
  static validateInput(data: any, allowedFields: string[], requiredFields: string[] = []): SecurityValidationResult {
    const errors: string[] = [];
    let sanitizedData: any = {};

    // Check for required fields
    for (const field of requiredFields) {
      if (!data[field] || data[field] === '') {
        errors.push(`Campo requerido: ${field}`);
      }
    }

    // Sanitize and validate allowed fields
    const allowedFieldsTyped = allowedFields as (keyof typeof data)[];
    sanitizedData = sanitizeAndValidate(data, allowedFieldsTyped);

    // Check for SQL injection attempts in string fields
    for (const [key, value] of Object.entries(sanitizedData)) {
      if (typeof value === 'string' && detectSqlInjection(value)) {
        errors.push(`Entrada inválida detectada en campo: ${key}`);
      }
    }

    // Validate UUIDs
    for (const [key, value] of Object.entries(sanitizedData)) {
      if (key.includes('id') && typeof value === 'string' && value.length > 0) {
        if (!isValidUUID(value)) {
          errors.push(`ID inválido en campo: ${key}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: errors.length === 0 ? sanitizedData : undefined
    };
  }

  // Verify user authentication
  static async verifyAuthentication(): Promise<{ user: any; error: string | null }> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return { user: null, error: 'Usuario no autenticado' };
      }

      return { user, error: null };
    } catch (error) {
      return { user: null, error: 'Error de autenticación' };
    }
  }

  // Verify resource ownership with RLS bypass check
  static async verifyResourceOwnership(
    table: 'budgets' | 'transactions' | 'goals' | 'categories' | 'debts',
    resourceId: string,
    userId: string
  ): Promise<boolean> {
    try {
      if (!isValidUUID(resourceId) || !isValidUUID(userId)) {
        return false;
      }

      const { data, error } = await supabase
        .from(table)
        .select('user_id')
        .eq('id', resourceId)
        .eq('user_id', userId) // Double check for extra security
        .single();

      return !error && data?.user_id === userId;
    } catch (error) {
      console.error('Error verifying resource ownership:', error);
      return false;
    }
  }

  // Enhanced authorization middleware
  static async authorizeOperation(
    operation: string,
    userId: string,
    resourceId?: string,
    table?: 'budgets' | 'transactions' | 'goals' | 'categories' | 'debts'
  ): Promise<{ authorized: boolean; error?: string }> {
    // Rate limiting check
    if (this.checkRateLimit(userId, operation)) {
      return { authorized: false, error: 'Demasiadas solicitudes. Intenta más tarde.' };
    }

    // Resource ownership check for update/delete operations
    if (resourceId && table && ['update', 'delete'].includes(operation)) {
      const ownsResource = await this.verifyResourceOwnership(table, resourceId, userId);
      if (!ownsResource) {
        return { authorized: false, error: 'No tienes permisos para esta operación' };
      }
    }

    return { authorized: true };
  }

  // Validate financial data
  static validateFinancialData(data: any): SecurityValidationResult {
    const errors: string[] = [];
    const sanitizedData: any = {};

    const numericFields = ['amount', 'income', 'expenses', 'savings', 'target', 'balance'];
    
    for (const [key, value] of Object.entries(data)) {
      if (numericFields.some(field => key.includes(field))) {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          errors.push(`Valor numérico inválido en ${key}`);
        } else if (numValue < 0) {
          errors.push(`${key} no puede ser negativo`);
        } else if (numValue > 999999999) {
          errors.push(`${key} excede el límite máximo`);
        } else {
          sanitizedData[key] = numValue;
        }
      } else {
        sanitizedData[key] = value;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: errors.length === 0 ? sanitizedData : undefined
    };
  }
}
