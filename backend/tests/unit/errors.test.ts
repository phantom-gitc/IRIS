import { describe, it, expect } from 'vitest';
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  PermissionDeniedError,
  ToolExecutionError,
  ExternalServiceError,
  ConfigurationError,
} from '../../src/shared/errors';

describe('Shared Errors Hierarchy', () => {
  it('ValidationError has statusCode 400 and code VALIDATION_ERROR', () => {
    const err = new ValidationError('Invalid email format', { field: 'email' });
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.message).toBe('Invalid email format');
    expect(err.details).toEqual({ field: 'email' });
    expect(err.isOperational).toBe(true);
  });

  it('AuthenticationError has statusCode 401 and code AUTHENTICATION_FAILED', () => {
    const err = new AuthenticationError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('AUTHENTICATION_FAILED');
  });

  it('AuthorizationError has statusCode 403 and code FORBIDDEN', () => {
    const err = new AuthorizationError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });

  it('NotFoundError has statusCode 404 and code NOT_FOUND', () => {
    const err = new NotFoundError('Conversation not found');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
  });

  it('ConflictError has statusCode 409 and code CONFLICT', () => {
    const err = new ConflictError('User already exists');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('CONFLICT');
  });

  it('RateLimitError has statusCode 429 and code RATE_LIMIT_EXCEEDED', () => {
    const err = new RateLimitError();
    expect(err.statusCode).toBe(429);
    expect(err.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('PermissionDeniedError has statusCode 403 and code PERMISSION_DENIED', () => {
    const err = new PermissionDeniedError('Action requires confirmation');
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('PERMISSION_DENIED');
  });

  it('ToolExecutionError has statusCode 500 and code TOOL_EXECUTION_ERROR', () => {
    const err = new ToolExecutionError('Command timed out');
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('TOOL_EXECUTION_ERROR');
  });

  it('ExternalServiceError has statusCode 502 and code EXTERNAL_SERVICE_ERROR', () => {
    const err = new ExternalServiceError('Groq API unavailable');
    expect(err.statusCode).toBe(502);
    expect(err.code).toBe('EXTERNAL_SERVICE_ERROR');
  });

  it('ConfigurationError has statusCode 500 and is not operational', () => {
    const err = new ConfigurationError('Missing database connection string');
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('CONFIGURATION_ERROR');
    expect(err.isOperational).toBe(false);
  });
});
