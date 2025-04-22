export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'No autorizado') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'DATABASE_ERROR', 500, details);
    this.name = 'DatabaseError';
  }
}

export const handleError = (error: unknown): AppError => {
  console.error('Error:', error);

  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, 'UNKNOWN_ERROR');
  }

  return new AppError('Error desconocido', 'UNKNOWN_ERROR');
};

export const errorMessages = {
  es: {
    VALIDATION_ERROR: 'Error de validación',
    AUTHENTICATION_ERROR: 'No autorizado',
    DATABASE_ERROR: 'Error en la base de datos',
    UNKNOWN_ERROR: 'Error desconocido',
  },
}; 