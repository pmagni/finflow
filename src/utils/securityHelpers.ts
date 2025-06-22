
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

    // Aquí podrías implementar verificación de roles específicos
    // Por ahora, solo verificamos que el usuario esté autenticado
    return true;
  } catch (error) {
    console.error('Error checking user permissions:', error);
    return false;
  }
};

// Función para validar ownership de recursos basado en user_id
export const validateResourceOwnership = async (
  table: 'budgets' | 'transactions' | 'goals' | 'categories',
  resourceId: string,
  userId: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from(table)
      .select('user_id')
      .eq('id', resourceId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.user_id === userId;
  } catch (error) {
    console.error('Error validating resource ownership:', error);
    return false;
  }
};

// Función para limpiar y validar datos de entrada
export const sanitizeAndValidate = <T>(
  data: T,
  allowedFields: (keyof T)[]
): Partial<T> => {
  const sanitized: Partial<T> = {};
  
  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      let value = data[field];
      
      // Si es string, sanitizar
      if (typeof value === 'string') {
        value = (value as string).trim().replace(/[<>]/g, '') as T[keyof T];
      }
      
      sanitized[field] = value;
    }
  });
  
  return sanitized;
};

// Función para detectar intentos de inyección SQL básicos
export const detectSqlInjection = (input: string): boolean => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b)/i,
    /(--|#|\/\*|\*\/)/,
    /('|"|;|\||&)/
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
};

// Función para validar formato de UUID
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Función para verificar si un usuario es propietario de un recurso
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
