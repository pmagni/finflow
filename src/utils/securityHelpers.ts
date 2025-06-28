
import { supabase } from '@/integrations/supabase/client';

// Función para verificar si el usuario tiene permisos para una operación
export const checkUserPermissions = async (requiredRole?: string): Promise<boolean> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return false;
    }

    // Si no se requiere un rol específico, solo verificar autenticación
    if (!requiredRole) {
      return true;
    }

    // Verificar roles específicos con RLS
    const { data, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', requiredRole)
      .single();
    
    return !roleError && !!data;
  } catch (error) {
    console.error('Error checking user permissions:', error);
    return false;
  }
};

// Función para validar ownership de recursos basado en user_id (now with RLS)
export const validateResourceOwnership = async (
  table: 'budgets' | 'transactions' | 'goals' | 'categories',
  resourceId: string,
  userId: string
): Promise<boolean> => {
  try {
    if (!isValidUUID(resourceId) || !isValidUUID(userId)) {
      return false;
    }

    // With RLS enabled, this query will automatically filter by user
    const { data, error } = await supabase
      .from(table)
      .select('user_id')
      .eq('id', resourceId)
      .single();

    // If RLS is working correctly, we should either get the record (if owned)
    // or get an error/null (if not owned)
    return !error && data?.user_id === userId;
  } catch (error) {
    console.error('Error validating resource ownership:', error);
    return false;
  }
};

// Función para limpiar y validar datos de entrada (enhanced)
export const sanitizeAndValidate = <T>(
  data: T,
  allowedFields: (keyof T)[]
): Partial<T> => {
  const sanitized: Partial<T> = {};
  
  allowedFields.forEach((field) => {
    if (data[field] !== undefined && data[field] !== null) {
      let value = data[field];
      
      // Si es string, sanitizar
      if (typeof value === 'string') {
        // Remove potentially dangerous characters and trim
        value = (value as string)
          .trim()
          .replace(/[<>]/g, '')
          .replace(/javascript:/gi, '')
          .replace(/data:/gi, '')
          .slice(0, 1000) as T[keyof T]; // Limit length
      }
      
      // Si es número, validar rangos
      if (typeof value === 'number') {
        if (isNaN(value) || !isFinite(value)) {
          return; // Skip invalid numbers
        }
        // Clamp to reasonable financial ranges
        if (value < 0) value = 0 as T[keyof T];
        if (value > 999999999) value = 999999999 as T[keyof T];
      }
      
      sanitized[field] = value;
    }
  });
  
  return sanitized;
};

// Función para detectar intentos de inyección SQL básicos (enhanced)
export const detectSqlInjection = (input: string): boolean => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE)\b)/i,
    /(--|#|\/\*|\*\/)/,
    /('|"|;|\||&)/,
    /(\bOR\b|\bAND\b).*=.*=/i,
    /1=1|1='1'|'=''/i,
    /(\bSCRIPT\b|\bALERT\b|\bONLOAD\b)/i
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
};

// Función para validar formato de UUID (enhanced)
export const isValidUUID = (uuid: string): boolean => {
  if (!uuid || typeof uuid !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Función para verificar si un usuario es propietario de un recurso (enhanced with RLS)
export const checkResourceOwnership = async (
  table: 'budgets' | 'transactions' | 'goals' | 'categories',
  resourceId: string
): Promise<boolean> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return false;
    }

    return validateResourceOwnership(table, resourceId, user.id);
  } catch (error) {
    console.error('Error checking resource ownership:', error);
    return false;
  }
};

// Nueva función para validar entradas de formularios financieros
export const validateFinancialInput = (value: any, fieldName: string): string | null => {
  if (value === undefined || value === null || value === '') {
    return null; // Allow empty values, let required field validation handle it
  }

  const numValue = Number(value);
  
  if (isNaN(numValue)) {
    return `${fieldName} debe ser un número válido`;
  }
  
  if (numValue < 0) {
    return `${fieldName} no puede ser negativo`;
  }
  
  if (numValue > 999999999) {
    return `${fieldName} excede el límite máximo permitido`;
  }
  
  return null;
};

// Función para sanitizar texto de entrada
export const sanitizeTextInput = (input: string, maxLength: number = 500): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/data:/gi, '') // Remove data: URLs
    .slice(0, maxLength);
};
