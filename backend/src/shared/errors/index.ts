export abstract class AppError extends Error {
  public abstract readonly statusCode: number;
  public abstract readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(message: string, isOperational = true, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public readonly statusCode = 400;
  public readonly code = 'VALIDATION_ERROR';

  constructor(message: string = 'Validation failed', details?: unknown) {
    super(message, true, details);
  }
}

export class AuthenticationError extends AppError {
  public readonly statusCode = 401;
  public readonly code = 'AUTHENTICATION_FAILED';

  constructor(message: string = 'Authentication required or invalid credentials', details?: unknown) {
    super(message, true, details);
  }
}

export class AuthorizationError extends AppError {
  public readonly statusCode = 403;
  public readonly code = 'FORBIDDEN';

  constructor(message: string = 'Permission denied: insufficient privileges', details?: unknown) {
    super(message, true, details);
  }
}

export class NotFoundError extends AppError {
  public readonly statusCode = 404;
  public readonly code = 'NOT_FOUND';

  constructor(message: string = 'Resource not found', details?: unknown) {
    super(message, true, details);
  }
}

export class ConflictError extends AppError {
  public readonly statusCode = 409;
  public readonly code = 'CONFLICT';

  constructor(message: string = 'Resource conflict', details?: unknown) {
    super(message, true, details);
  }
}

export class RateLimitError extends AppError {
  public readonly statusCode = 429;
  public readonly code = 'RATE_LIMIT_EXCEEDED';

  constructor(message: string = 'Too many requests. Please try again later.', details?: unknown) {
    super(message, true, details);
  }
}

export class PermissionDeniedError extends AppError {
  public readonly statusCode = 403;
  public readonly code = 'PERMISSION_DENIED';

  constructor(message: string = 'Tool or action execution denied by security policy', details?: unknown) {
    super(message, true, details);
  }
}

export class ToolExecutionError extends AppError {
  public readonly statusCode = 500;
  public readonly code = 'TOOL_EXECUTION_ERROR';

  constructor(message: string = 'Tool execution failed', details?: unknown) {
    super(message, true, details);
  }
}

export class ExternalServiceError extends AppError {
  public readonly statusCode = 502;
  public readonly code = 'EXTERNAL_SERVICE_ERROR';

  constructor(message: string = 'External provider communication failed', details?: unknown) {
    super(message, true, details);
  }
}

export class ConfigurationError extends AppError {
  public readonly statusCode = 500;
  public readonly code = 'CONFIGURATION_ERROR';

  constructor(message: string = 'System configuration is invalid or missing', details?: unknown) {
    super(message, false, details);
  }
}
