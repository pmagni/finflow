
import { useState } from 'react';
import { SecurityService } from '@/services/securityService';
import { toast } from 'sonner';

export const useSecureOperation = () => {
  const [isLoading, setIsLoading] = useState(false);

  const executeSecureOperation = async <T>(
    operation: () => Promise<T>,
    operationName: string = 'operation'
  ): Promise<T | null> => {
    setIsLoading(true);
    
    try {
      // Verify authentication first
      const { user, error: authError } = await SecurityService.verifyAuthentication();
      if (authError || !user) {
        toast.error('Debes iniciar sesión para realizar esta operación');
        return null;
      }

      // Execute the operation
      const result = await operation();
      return result;
    } catch (error: any) {
      console.error(`Error in ${operationName}:`, error);
      
      // Handle specific security errors
      if (error.message.includes('rate limit') || error.message.includes('Demasiadas solicitudes')) {
        toast.error('Demasiadas solicitudes. Por favor espera un momento antes de intentar de nuevo.');
      } else if (error.message.includes('unauthorized') || error.message.includes('permisos')) {
        toast.error('No tienes permisos para realizar esta operación');
      } else if (error.message.includes('Validation')) {
        toast.error('Datos inválidos: ' + error.message);
      } else {
        toast.error(error.message || `Error en ${operationName}`);
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    executeSecureOperation,
    isLoading
  };
};
