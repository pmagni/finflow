import { toast } from 'sonner';
import { AppError } from '@/types/errors';

export const useErrorHandler = () => {
  const handleError = (error: unknown) => {
    if (error instanceof Error) {
      // Error estándar
      toast.error(error.message);
      console.error('Error:', error);
    } else if (typeof error === 'object' && error !== null && 'code' in error) {
      // Error personalizado de la aplicación
      const appError = error as AppError;
      
      switch (appError.code) {
        case 'DATABASE_ERROR':
          toast.error('Error de base de datos: ' + appError.message);
          break;
        case 'VALIDATION_ERROR':
          toast.error('Error de validación: ' + appError.message);
          break;
        case 'AUTHENTICATION_ERROR':
          toast.error('Error de autenticación: ' + appError.message);
          break;
        case 'NETWORK_ERROR':
          toast.error('Error de red: ' + appError.message);
          break;
        default:
          toast.error('Error desconocido: ' + appError.message);
      }
      
      console.error('Error detallado:', appError);
    } else {
      // Error desconocido
      toast.error('Ha ocurrido un error inesperado');
      console.error('Error desconocido:', error);
    }
  };

  return { handleError };
}; 