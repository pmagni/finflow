
import { useState, useCallback } from 'react';
import { z } from 'zod';

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const useFormValidation = <T extends Record<string, any>>(
  schema: z.ZodSchema<T>
) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState(false);

  const validateField = useCallback((fieldName: keyof T, value: any) => {
    try {
      // Crear un objeto temporal para validar solo este campo
      const tempData = { [fieldName]: value } as Partial<T>;
      
      // Validar usando safeParse para evitar errores de tipos
      const result = schema.safeParse(tempData);
      
      if (result.success) {
        // Si no hay error, limpiar el error de este campo
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[fieldName as string];
          return newErrors;
        });
        return true;
      } else {
        // Si hay errores, buscar el error específico de este campo
        const fieldError = result.error.errors.find(err => 
          err.path.includes(fieldName as string)
        );
        
        if (fieldError) {
          setErrors(prev => ({
            ...prev,
            [fieldName as string]: fieldError.message
          }));
        }
        return false;
      }
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        [fieldName as string]: 'Error de validación'
      }));
      return false;
    }
  }, [schema]);

  const validateForm = useCallback((data: T): ValidationResult => {
    try {
      schema.parse(data);
      setErrors({});
      setIsValid(true);
      return { isValid: true, errors: {} };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path.length > 0) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        setIsValid(false);
        return { isValid: false, errors: fieldErrors };
      }
      return { isValid: false, errors: { general: 'Error de validación' } };
    }
  }, [schema]);

  const clearErrors = useCallback(() => {
    setErrors({});
    setIsValid(false);
  }, []);

  return {
    errors,
    isValid,
    validateField,
    validateForm,
    clearErrors
  };
};
