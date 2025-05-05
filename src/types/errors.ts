export interface AppError {
  code: string;
  message: string;
  details?: unknown;
}

export class DatabaseError implements AppError {
  code: string;
  message: string;
  details?: unknown;

  constructor(message: string, details?: unknown) {
    this.code = 'DATABASE_ERROR';
    this.message = message;
    this.details = details;
  }
}

export class ValidationError implements AppError {
  code: string;
  message: string;
  details?: unknown;

  constructor(message: string, details?: unknown) {
    this.code = 'VALIDATION_ERROR';
    this.message = message;
    this.details = details;
  }
}

export class AuthenticationError implements AppError {
  code: string;
  message: string;
  details?: unknown;

  constructor(message: string, details?: unknown) {
    this.code = 'AUTHENTICATION_ERROR';
    this.message = message;
    this.details = details;
  }
}

export class NetworkError implements AppError {
  code: string;
  message: string;
  details?: unknown;

  constructor(message: string, details?: unknown) {
    this.code = 'NETWORK_ERROR';
    this.message = message;
    this.details = details;
  }
} 